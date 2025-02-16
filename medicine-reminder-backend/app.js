// import express from 'express';
// import cors from 'cors';
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import admin from 'firebase-admin';
// import authRoutes from './routes/auth.js';
// import medicationRoutes from './routes/medications.js';
// import notificationRoutes from './routes/notification.js';
// import telegramRoutes from './routes/telegram.js';
// import symptomsRouter from './routes/symptoms.js';
// import adminRoutes from './routes/admin.js';
// import { errorHandler } from './middlewares/errorHandler.js';
// import { requestLogger } from './middlewares/requestLogger.js';
// import logger from './utils/logger.js';

// const app = express();

// // Middleware
// app.use(cors({
//   origin: 'http://localhost:5173',
//   credentials: true
// }));

// app.use(express.json());

// // Debug logging middleware
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url}`);
//   next();
// });

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/medications', medicationRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/telegram', telegramRoutes);
// app.use('/api/analyze-symptoms', symptomsRouter);
// app.use('/api/admin', adminRoutes);

// // Add request logging middleware
// app.use(requestLogger);

// // Error handling middleware
// app.use((err, req, res, next) => {
//   logger.error('Unhandled error:', {
//     error: err.message,
//     stack: err.stack,
//     path: req.path,
//     method: req.method
//   });
  
//   res.status(500).json({ message: 'Internal server error' });
// });

// export default app; 


import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import authRoutes from './routes/auth.js';
import medicationRoutes from './routes/medications.js';
import notificationRoutes from './routes/notification.js';
import telegramRoutes from './routes/telegram.js';
import symptomsRouter from './routes/symptoms.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';
import logger from './utils/logger.js';

const app = express();

// Configure CORS
app.use(cors({
  origin: ['https://meditimely.vercel.app', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/analyze-symptoms', symptomsRouter);
app.use('/api/admin', adminRoutes);

// Add request logging middleware
app.use(requestLogger);

// Error handling middleware
app.use(errorHandler);

export default app; 