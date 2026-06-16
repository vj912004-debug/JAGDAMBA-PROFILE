import express from 'express';
import { sendTCEmail, sendPoEmail } from '../controllers/mailController.js';

const router = express.Router();

router.post('/send-tc', sendTCEmail);
router.post('/send-po', sendPoEmail);

export default router;
