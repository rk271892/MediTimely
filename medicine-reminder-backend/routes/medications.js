import express from 'express';
import Medication from '../models/Medication.js';
import { authenticateToken } from '../middleware/auth.js';
import { notificationService } from '../services/notificationService.js';
import User from '../models/User.js';
import { parseISO, isValid, addDays, format } from 'date-fns';
import Notification from '../models/Notification.js';
import { medicineInfoService } from '../services/medicineInfoService.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { createMedicationMessage } from '../utils/messageUtils.js';

const router = express.Router();

// Get all medications for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const medications = await Medication.find({ userId: req.user.userId });
    res.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new medication
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('Creating medication with data:', req.body);
    console.log('User from request:', req.user);

    // Validate required fields
    const { name, dosage, duration, timings } = req.body;
    if (!name || !dosage || !duration || !timings) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        details: { name, dosage, duration, timings }
      });
    }

    // Create medication
    const medicationData = {
      ...req.body,
      userId: req.user.userId,
      active: true
    };

    console.log('Final medication data:', medicationData);

    const medication = await Medication.create(medicationData);
    console.log('Medication created:', medication);

    // Schedule notifications
    try {
      const user = await User.findById(req.user.userId);
      await notificationService.scheduleNotifications(medication, user);
      console.log('Notifications scheduled for medication');
    } catch (notificationError) {
      console.error('Failed to schedule notifications:', notificationError);
      // Continue even if notification scheduling fails
    }

    res.status(201).json({
      success: true,
      medication
    });
  } catch (error) {
    console.error('Failed to create medication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add medication',
      error: error.message,
      details: error.stack
    });
  }
});

// Update a medication
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Updating medication:', {
      id: req.params.id,
      updates: req.body
    });

    // Delete old notifications first
    await Notification.deleteMany({
      medicationId: req.params.id,
      status: 'pending'
    });

    // Update medication using findByIdAndUpdate
    const updatedMedication = await Medication.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId
      },
      {
        $set: {
          name: req.body.name,
          dosage: req.body.dosage,
          duration: req.body.duration,
          timings: req.body.timings,
          instructions: req.body.instructions
        }
      },
      { 
        new: true,  // Return the updated document
        runValidators: true  // Run schema validations
      }
    );

    if (!updatedMedication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    console.log('Medication updated in database:', updatedMedication);

    // Schedule new notifications
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create new notifications
      for (let day = 0; day < updatedMedication.duration.days; day++) {
        const currentDate = addDays(parseISO(updatedMedication.duration.startDate), day);
        
        for (const timing of updatedMedication.timings) {
          const [hours, minutes] = timing.time.split(':').map(Number);
          const scheduledDate = new Date(currentDate);
          
          // Set time in local timezone (using server's timezone)
          const localScheduledDate = new Date(
            scheduledDate.getFullYear(),
            scheduledDate.getMonth(),
            scheduledDate.getDate(),
            hours,
            minutes,
            0
          );

          console.log('Creating notification with times:', {
            inputTime: timing.time,
            localTime: format(localScheduledDate, 'yyyy-MM-dd HH:mm:ss'),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            offset: localScheduledDate.getTimezoneOffset()
          });

          const notification = new Notification({
            userId: user._id,
            medicationId: updatedMedication._id,
            time: timing.time,
            period: timing.period,
            message: createMedicationMessage(updatedMedication, timing, user),
            scheduledFor: localScheduledDate,
            status: 'pending',
            type: 'sms',
            notificationTypes: user.telegramChatId ? ['telegram', 'sms'] : ['sms'],
            telegramChatId: user.telegramChatId,
            metadata: {
              medicineName: updatedMedication.name,
              dosage: updatedMedication.dosage,
              time: timing.time,
              period: timing.period,
              instructions: updatedMedication.instructions,
              userName: user.name
            }
          });

          const savedNotification = await notification.save();
          console.log('Created notification:', {
            id: savedNotification._id,
            scheduledFor: format(savedNotification.scheduledFor, 'yyyy-MM-dd HH:mm:ss'),
            status: savedNotification.status,
            timeUntilNotification: Math.round((savedNotification.scheduledFor - new Date()) / 1000 / 60) + ' minutes'
          });
        }
      }

      console.log('New notifications scheduled successfully');
    } catch (notificationError) {
      console.error('Failed to schedule new notifications:', notificationError);
    }

    // Verify final state
    const verifyMedication = await Medication.findById(updatedMedication._id);
    console.log('Final medication state:', verifyMedication);

    const newNotifications = await Notification.find({
      medicationId: updatedMedication._id,
      status: 'pending'
    });
    console.log('New notifications count:', newNotifications.length);

    res.json({
      success: true,
      medication: updatedMedication
    });
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({ message: 'Failed to update medication' });
  }
});

// Delete a medication
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Deleting medication:', req.params.id, 'for user:', req.user.userId);
    
    // Find and delete the medication
    const medication = await Medication.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!medication) {
      console.log('Medication not found or unauthorized');
      return res.status(404).json({ message: 'Medication not found' });
    }

    // Also delete associated notifications
    await Notification.deleteMany({
      medicationId: req.params.id
    });

    console.log('Medication and associated notifications deleted successfully');
    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add the medicine info route
router.get('/:id/info', authenticateToken, async (req, res) => {
  try {
    console.log('Getting info for medication:', req.params.id);
    
    const medication = await Medication.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    console.log('Found medication:', medication);

    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }

    console.log('Fetching medicine info for:', medication.name);
    const medicineInfo = await medicineInfoService.getMedicineInfo(medication.name);
    console.log('Medicine info result:', medicineInfo);
    
    if (!medicineInfo) {
      return res.status(404).json({ message: 'Medicine information not found' });
    }

    res.json({ medicineInfo });
  } catch (error) {
    console.error('Failed to get medicine info:', error);
    res.status(500).json({ message: 'Failed to get medicine information' });
  }
});

// Add this test route (temporary, for testing only)
router.get('/test-api/:medicineName', authenticateToken, async (req, res) => {
  try {
    const info = await medicineInfoService.getMedicineInfo(req.params.medicineName);
    res.json(info);
  } catch (error) {
    console.error('API test failed:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 