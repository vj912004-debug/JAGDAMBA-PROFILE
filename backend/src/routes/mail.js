import express from 'express';
import { sendTCEmail } from '../controllers/mailController.js';

const router = express.Router();

router.post('/send-tc', sendTCEmail);

export default router;
