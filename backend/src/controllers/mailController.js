import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import pool from '../config/db.js';

dotenv.config();

function attachmentFromDataUrl(dataUrl, filename) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  if (dataUrl.startsWith('data:')) {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    return {
      filename: filename || 'attachment.pdf',
      content: Buffer.from(match[2], 'base64'),
      contentType: match[1],
    };
  }
  return { filename: filename || 'attachment.pdf', path: dataUrl };
}

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

export const getMailStatus = async (req, res) => {
  const configured = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

  if (!configured) {
    return res.json({ status: 'NOT_CONFIGURED' });
  }

  res.json({
    status: 'CONFIGURED',
    user: process.env.SMTP_USER,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
  });
};

export const verifyMailConnection = async (req, res) => {
  const configured = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

  if (!configured) {
    return res.status(400).json({
      success: false,
      status: 'NOT_CONFIGURED',
      message: 'SMTP credentials are not configured on the server.',
    });
  }

  try {
    await transporter.verify();
    res.json({
      success: true,
      status: 'CONNECTED',
      user: process.env.SMTP_USER,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
    });
  } catch (error) {
    console.error('SMTP verification error:', error);
    res.status(500).json({
      success: false,
      status: 'ERROR',
      message: error.message,
      user: process.env.SMTP_USER,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
    });
  }
};

export const sendPoEmail = async (req, res) => {
  const { to, subject, message, poData, fileName } = req.body;

  if (!to || !poData) {
    return res.status(400).json({ message: 'Recipient email and PO PDF data are required' });
  }

  try {
    const attachment = attachmentFromDataUrl(poData, fileName || 'Purchase_Order.pdf');
    const mailOptions = {
      from: `"Jagdamba Steel" <${process.env.SMTP_USER}>`,
      to,
      subject: subject || `Purchase Order - ${fileName || 'PO'}`,
      text: message || 'Please find the attached Purchase Order.',
      attachments: attachment ? [attachment] : [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('PO Email sent: ' + info.response);

    try {
      await pool.query(
        'INSERT INTO email_logs (recipient_email, subject, message_id, file_name) VALUES ($1, $2, $3, $4)',
        [to, subject, info.messageId, fileName]
      );
    } catch (dbError) {
      console.error('Database logging error:', dbError);
    }

    res.json({ success: true, message: 'Email sent successfully', messageId: info.messageId });
  } catch (error) {
    console.error('PO Email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
  }
};

export const sendTCEmail = async (req, res) => {
  const { to, subject, message, tcData, fileName } = req.body;

  if (!to || !tcData) {
    return res.status(400).json({ message: 'Recipient email and TC data are required' });
  }

  try {
    const attachment = attachmentFromDataUrl(tcData, fileName || 'Test_Certificate.pdf');
    const mailOptions = {
      from: `"Jagdamba Steel" <${process.env.SMTP_USER}>`,
      to,
      subject: subject || `Test Certificate - ${fileName || 'Material'}`,
      text: message || 'Please find the attached Test Certificate.',
      attachments: attachment ? [attachment] : [],
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
