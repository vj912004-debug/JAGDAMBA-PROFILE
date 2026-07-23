import express from 'express';
import { sendTCEmail, sendPoEmail, getMailStatus, verifyMailConnection } from '../controllers/mailController.js';

const router = express.Router();

router.get('/status', getMailStatus);
router.post('/verify', verifyMailConnection);
router.post('/send-tc', sendTCEmail);
router.post('/send-po', sendPoEmail);

export default router;
