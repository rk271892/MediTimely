import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import authRoutes from './routes/auth.js';
import medicationRoutes from './routes/medications.js';
import cron from 'node-cron';
import { notificationService } from './services/notificationService.js';
import './cron/notificationCron.js';
import notificationRoutes from './routes/notification.js';
import { format, addHours } from 'date-fns';
import telegramRoutes from './routes/telegram.js';
import symptomsRouter from './routes/symptoms.js';
import adminRoutes from './routes/admin.js';
import { getBot, stopBot } from './config/telegram.js';
import app from './app.js';

dotenv.config();

// Initialize Firebase Admin SDK
try {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (!privateKey) {
    throw new Error('Firebase private key is missing');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    })
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  // Don't exit process, just log the error
}

const PORT = process.env.PORT || 3000;

// Add after imports
process.env.TZ = 'Asia/Kolkata';
console.log('Server timezone set to:', process.env.TZ);
console.log('Current server time:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

// Connect to MongoDB and start server
async function startServer() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);

    // Initialize Telegram bot but don't fail if it fails
    try {
      await getBot();
    } catch (error) {
      console.error('Failed to initialize Telegram bot:', error);
      // Continue server startup even if bot fails
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Set up cron job for notifications
    cron.schedule('* * * * *', async () => {
      console.log('\n=== Running Notification Cron Job ===');
      console.log('Current time:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      
      try {
        await notificationService.checkAndSendNotifications();
      } catch (error) {
        console.error('Cron job error:', error);
      }
    });

    // Add this after your imports
    setInterval(() => {
      const now = new Date();
      console.log('Server Time Check:', {
        utc: now.toUTCString(),
        local: now.toString(),
        indianTime: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        timestamp: now.getTime()
      });
    }, 60000); // Logs every minute

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Cleanup function
const cleanup = async () => {
  console.log('Cleaning up...');
  try {
    await stopBot();
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
  setTimeout(() => process.exit(0), 1000);
};

// Handle shutdown signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start the server
startServer(); 