import express from 'express';
const router = express.Router();
import askController from '../controllers/askController.js';
import { authenticateApiKey, rateLimit } from '../middlewares/authMiddleware.js';

// Ana ask endpoint'i - sesli cevap döndürür (API key gerekli + rate limit)
router.post('/ask', authenticateApiKey, rateLimit(60000, 50), askController.askQuestion);

// Sadece metin cevabı döndürür (test için) (API key gerekli + rate limit)
router.post('/ask/text', authenticateApiKey, rateLimit(60000, 100), askController.askTextOnly);


export default router;
