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

app.listen(PORT, () => {
  console.log(`WhatsApp Utility Server running on http://localhost:${PORT}`);
});

// Heartbeat to keep process alive
setInterval(() => {}, 10000);
