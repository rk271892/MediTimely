import express from 'express';
import { analyzeSymptoms } from '../controllers/symptomController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Debug logging
router.use((req, res, next) => {
  console.log('Symptoms route accessed:', req.path);
  next();
});

router.post('/analyze', authenticateToken, analyzeSymptoms);

export default router; 