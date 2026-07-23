import express from 'express';
import {
  getErpData,
  saveErpData,
  listErpBackups,
  restoreErpBackup,
} from '../controllers/erpController.js';
import { getGstCaptcha, getGstCaptchaImage, lookupGstin, lookupGstinWithCaptcha } from '../controllers/gstLookupController.js';

const router = express.Router();

router.get('/data', getErpData);
router.put('/data', saveErpData);
router.get('/backups', listErpBackups);
router.post('/restore', restoreErpBackup);
router.post('/restore/:id', restoreErpBackup);
router.get('/gst-captcha', getGstCaptcha);
router.get('/gst-captcha/:sessionId.png', getGstCaptchaImage);
router.post('/gst-lookup', lookupGstinWithCaptcha);
router.get('/gst-lookup/:gstin', lookupGstin);

export default router;
