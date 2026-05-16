import express from 'express';
import cors from 'cors';
import { whatsappService } from './lib/whatsapp.js';

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// WhatsApp Status
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: whatsappService.status,
    hasQr: !!whatsappService.qr
  });
});

// Generic Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'WhatsApp Utility',
    timestamp: new Date().toISOString()
  });
});

// Get QR Code
app.get('/api/whatsapp/qr', async (req, res) => {
  const qrDataUrl = await whatsappService.getQrDataUrl();
  if (qrDataUrl) {
    res.json({ qr: qrDataUrl });
  } else {
    res.status(404).json({ message: 'QR code not available' });
  }
});

// Initialize WhatsApp
app.post('/api/whatsapp/init', (req, res) => {
  whatsappService.initialize();
  res.json({ message: 'WhatsApp initialization started' });
});

// Send Bulk Messages (Hybrid Mode: Contacts sent from frontend)
app.post('/api/whatsapp/send-bulk', async (req, res) => {
  const { message, contacts } = req.body;

  if (!message || !contacts || !Array.isArray(contacts)) {
    return res.status(400).json({ message: 'Message and contacts array are required' });
  }

  const results = {
    total: contacts.length,
    success: 0,
    failed: 0,
    details: []
  };

  for (const contact of contacts) {
    const number = contact.whatsapp || contact.mobile;
    if (!number) {
      results.failed++;
      results.details.push({ name: contact.contactPerson, error: 'No phone number provided' });
      continue;
    }

    try {
      await whatsappService.sendMessage(number, message);
      results.success++;
    } catch (err) {
      results.failed++;
      results.details.push({ name: contact.contactPerson, error: err.message });
    }
  }

  res.json(results);
});

// Send Single Media Message
app.post('/api/whatsapp/send-media', async (req, res) => {
  const { number, mediaData, fileName, caption } = req.body;

  if (!number || !mediaData) {
    return res.status(400).json({ message: 'Number and media data are required' });
  }

  try {
    await whatsappService.sendMedia(number, mediaData, fileName, caption);
    res.json({ success: true, message: 'Media sent successfully' });
  } catch (err) {
    console.error('WhatsApp Media Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`WhatsApp Utility Server running on http://localhost:${PORT}`);
});

// Heartbeat to keep process alive
setInterval(() => {}, 10000);
