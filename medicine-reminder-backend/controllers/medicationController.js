import { parseISO, format } from 'date-fns';
import { notificationService } from '../services/notificationService.js';
import User from '../models/User.js';

export const medicationController = {
  async createMedication(req, res) {
    try {
      const { name, dosage, timings, duration, instructions } = req.body;
      const userId = req.user.id;

      console.log('Creating medication with data:', {
        name,
        dosage,
        timings,
        duration,
        instructions,
        userId
      });

      // Validate required fields
      if (!name || !dosage || !timings || !timings.length) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Create the medication
      const medication = await Medication.create({
        name,
        dosage,
        timings,
        duration,
        instructions,
        userId
      });

      // Schedule notifications
      await notificationService.scheduleNotifications(medication, { _id: userId });

      // Send success response
      return res.status(201).json({
        success: true,
        message: 'Medication created successfully',
        data: medication
      });

    } catch (error) {
      console.error('Failed to create medication:', error);
      // Check for validation errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map(err => err.message)
        });
      }
      
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create medication',
        error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      });
    }
  },
  // ... other methods
}; 