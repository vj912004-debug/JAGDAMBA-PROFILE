import express from 'express';
import { getErpData, saveErpData } from '../controllers/erpController.js';

const router = express.Router();

router.get('/data', getErpData);
router.put('/data', saveErpData);

export default router;
