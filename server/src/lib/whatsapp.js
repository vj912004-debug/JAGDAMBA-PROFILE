import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode';

class WhatsAppService {
  constructor() {
    console.log('Initializing WhatsApp Client...');
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
      }
    });
    console.log('Client object created');

    this.qr = null;
    this.status = 'DISCONNECTED'; 

    this.client.on('qr', (qr) => {
      this.qr = qr;
      this.status = 'QR_READY';
      console.log('WhatsApp QR Code generated');
    });

    this.client.on('ready', () => {
      this.status = 'CONNECTED';
      this.qr = null;
      console.log('WhatsApp Client is ready!');
    });

    this.client.on('auth_failure', (msg) => {
      this.status = 'DISCONNECTED';
      console.error('WhatsApp Auth failure', msg);
    });

    this.client.on('disconnected', (reason) => {
      this.status = 'DISCONNECTED';
      console.log('WhatsApp Disconnected', reason);
    });
  }

  async initialize() {
    if (this.status === 'DISCONNECTED') {
      this.status = 'INITIALIZING';
      try {
        await this.client.initialize();
      } catch (err) {
        this.status = 'DISCONNECTED';
        console.error('Failed to initialize WhatsApp', err);
      }
    }
  }

  async getQrDataUrl() {
    if (!this.qr) return null;
    return await qrcode.toDataURL(this.qr);
  }

  async sendMessage(number, message) {
    if (this.status !== 'CONNECTED') {
      throw new Error('WhatsApp client not connected');
    }
    
    let formattedNumber = number.replace(/\D/g, '');
    if (!formattedNumber.startsWith('91') && formattedNumber.length === 10) {
      formattedNumber = '91' + formattedNumber;
    }
    
    const chatId = formattedNumber + '@c.us';
    return await this.client.sendMessage(chatId, message);
  }

  async sendMedia(number, mediaData, fileName, caption) {
    if (this.status !== 'CONNECTED') {
      throw new Error('WhatsApp client not connected');
    }

    let formattedNumber = number.replace(/\D/g, '');
    if (!formattedNumber.startsWith('91') && formattedNumber.length === 10) {
      formattedNumber = '91' + formattedNumber;
    }

    const chatId = formattedNumber + '@c.us';
    
    const matches = mediaData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid media data format');
    }

    const mimeType = matches[1];
    const data = matches[2];

    const media = new MessageMedia(mimeType, data, fileName);
    return await this.client.sendMessage(chatId, media, { caption });
  }
}

export const whatsappService = new WhatsAppService();
