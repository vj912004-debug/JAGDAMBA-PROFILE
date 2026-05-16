import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendTCEmail = async (req, res) => {
  const { to, subject, message, tcData, fileName } = req.body;

  if (!to || !tcData) {
    return res.status(400).json({ message: 'Recipient email and TC data are required' });
  }

  try {
    const mailOptions = {
      from: `"Jagdamba Steel" <${process.env.SMTP_USER}>`,
      to,
      subject: subject || `Test Certificate - ${fileName || 'Material'}`,
      text: message || 'Please find the attached Test Certificate.',
      attachments: [
        {
          filename: fileName || 'Test_Certificate.pdf',
          path: tcData, // handles base64 data URLs
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);

    // Log to database
    try {
      await pool.query(
        'INSERT INTO email_logs (recipient_email, subject, message_id, file_name) VALUES ($1, $2, $3, $4)',
        [to, subject, info.messageId, fileName]
      );
    } catch (dbError) {
      console.error('Database logging error:', dbError);
      // We don't fail the request if logging fails, but we log it
    }

    res.json({ success: true, message: 'Email sent successfully', messageId: info.messageId });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
  }
};
