import express from 'express';
import { createPayment, handleCallback, handleSuccess } from '../controller/paymob.js';

const router = express.Router();

// Create payment
router.post('/create', createPayment);

// Handle Paymob callback
router.post('/paymob/callback', handleCallback);
router.get('/success', handleSuccess);

export default router;