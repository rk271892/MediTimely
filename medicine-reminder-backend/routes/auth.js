import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import authController from '../controllers/authController.js';
import crypto from 'crypto';
import { notificationService } from '../services/notificationService.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Register
router.post('/register', authController.register);

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    console.log('Database user:', {
      found: !!user,
      email: user?.email,
      hasPassword: !!user?.password,
      passwordLength: user?.password?.length,
      isAdmin: user?.isAdmin
    });

    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    console.log('Attempting password comparison:', {
      providedPassword: password,
      hasStoredPassword: !!user.password,
      storedPasswordLength: user.password?.length
    });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password comparison:', {
      result: isMatch,
      email: user.email
    });

    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin === true,
      createdAt: user.createdAt
    };

    console.log('Sending response:', {
      hasToken: !!token,
      user: userResponse
    });

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      whatsappNumber: req.body.whatsappNumber
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select('-password');

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Add a route to check user's Telegram status
router.get('/me', authMiddleware, authController.getMe);

router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Reset password request received for:', email);
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has connected Telegram
    if (!user.telegramChatId) {
      console.log('User has no Telegram:', email);
      return res.status(400).json({ 
        message: 'Please connect your Telegram account first',
        needsTelegram: true 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    console.log('Generated reset token:', {
      token: resetToken,
      expiry: new Date(resetTokenExpiry)
    });

    // Save token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // Send password reset link via Telegram
    await notificationService.sendPasswordResetLink(user, resetToken);

    console.log('Reset link sent successfully to:', email);
    res.json({ message: 'Password reset link sent to your Telegram' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to process reset password request' });
  }
});

router.post('/reset-password-confirm', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Password reset token is invalid or has expired'
      });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password confirm error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

router.post('/register-admin', authController.registerAdmin);

export default router; 