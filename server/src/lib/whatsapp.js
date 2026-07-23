import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, '../../.wwebjs_auth');
const INIT_TIMEOUT_MS = 90000;
const STUCK_THRESHOLD_MS = 60000;

function findChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  try {
    const cacheRoot = path.join(process.env.HOME || '/root', '.cache/puppeteer');
    if (fs.existsSync(cacheRoot)) {
      const matches = execSync(`find "${cacheRoot}" -name chrome -type f 2>/dev/null | head -1`, {
        encoding: 'utf-8',
      }).trim();
      if (matches && fs.existsSync(matches)) return matches;
    }
  } catch {
    /* fall through */
  }
  return undefined;
}

class WhatsAppService {
  constructor() {
    this.initStartedAt = null;
    this.lastError = null;
    this.setupClient();
  }

  setupClient() {
    console.log('Initializing WhatsApp Client...');

    const chromePath = findChromePath();
    if (chromePath) {
      console.log('Using Chrome at:', chromePath);
    }

    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: AUTH_DIR }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--disable-extensions',
        ],
        executablePath: chromePath || null,
      },
    });

    this.qr = null;
    this.status = 'DISCONNECTED';

    this.client.on('qr', (qr) => {
      this.qr = qr;
      this.status = 'QR_READY';
      this.lastError = null;
      console.log('WhatsApp QR Code generated');
    });

    this.client.on('ready', () => {
      this.status = 'CONNECTED';
      this.qr = null;
      this.initStartedAt = null;
      this.lastError = null;
      console.log('WhatsApp Client is ready!');
    });

    this.client.on('auth_failure', (msg) => {
      this.status = 'DISCONNECTED';
      this.lastError = `Authentication failed: ${msg}`;
      console.error('WhatsApp Auth failure', msg);
    });

    this.client.on('disconnected', async (reason) => {
      this.status = 'DISCONNECTED';
      this.qr = null;
      this.initStartedAt = null;
      console.log('WhatsApp Disconnected', reason);
      try {
        await this.client.destroy();
      } catch {
        /* ignore */
      }
      this.setupClient();
    });
  }

  isInitStuck() {
    return (
      this.status === 'INITIALIZING' &&
      this.initStartedAt != null &&
      Date.now() - this.initStartedAt > STUCK_THRESHOLD_MS
    );
  }

  async destroyClient() {
    try {
      await this.client.destroy();
    } catch {
      /* ignore */
    }
    try {
      execSync('pkill -f "chrome-linux64/chrome" || true', { stdio: 'ignore' });
    } catch {
      /* ignore */
    }
  }

  clearSession() {
    try {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }

  async forceReset() {
    console.log('Force-resetting WhatsApp client...');
    await this.destroyClient();
    this.clearSession();
    this.qr = null;
    this.status = 'DISCONNECTED';
    this.initStartedAt = null;
    this.lastError = null;
    this.setupClient();
  }

  async initialize() {
    if (this.status === 'CONNECTED' || this.status === 'QR_READY') {
      return;
    }

    if (this.status === 'INITIALIZING') {
      if (this.isInitStuck()) {
        this.lastError = 'Initialization timed out. Clearing session and retrying...';
        await this.forceReset();
      } else {
        return;
      }
    }

    if (this.status !== 'DISCONNECTED') {
      return;
    }

    this.status = 'INITIALIZING';
    this.initStartedAt = Date.now();
    this.lastError = null;

    try {
      await Promise.race([
        this.client.initialize(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('WhatsApp initialization timed out after 90 seconds')),
            INIT_TIMEOUT_MS,
          ),
        ),
      ]);
    } catch (err) {
      this.status = 'DISCONNECTED';
      this.initStartedAt = null;
      this.lastError = err.message;
      console.error('Failed to initialize WhatsApp', err);
      await this.destroyClient();
      this.setupClient();
    }
  }

  async disconnect() {
    console.log('Disconnecting WhatsApp manually...');
    try {
      await this.client.logout();
    } catch (e) {
      console.error('Logout failed:', e.message);
    }
    await this.forceReset();
  }

  async getQrDataUrl() {
    if (!this.qr) return null;
    return await qrcode.toDataURL(this.qr);
  }

  getConnectionError() {
    if (this.status === 'CONNECTED') return null;
    if (this.lastError) return this.lastError;
    if (this.status === 'QR_READY') {
      return 'WhatsApp is not connected. Open TC Management, click Connect WhatsApp, and scan the QR code.';
    }
    if (this.status === 'INITIALIZING') {
      if (this.isInitStuck()) {
        return 'WhatsApp is stuck initializing. Click Reset in the WhatsApp panel and try again.';
      }
      return 'WhatsApp is starting up. Please wait a moment and try again.';
    }
    return 'WhatsApp is disconnected. Open TC Management and connect WhatsApp first.';
  }

  async sendMessage(number, message) {
    const connectionError = this.getConnectionError();
    if (connectionError) {
      throw new Error(connectionError);
    }

    let formattedNumber = number.replace(/\D/g, '');
    if (!formattedNumber.startsWith('91') && formattedNumber.length === 10) {
      formattedNumber = '91' + formattedNumber;
    }

    const chatId = formattedNumber + '@c.us';
    return await this.client.sendMessage(chatId, message);
  }

  async sendMedia(number, mediaData, fileName, caption) {
    const connectionError = this.getConnectionError();
    if (connectionError) {
      throw new Error(connectionError);
    }

    let formattedNumber = number.replace(/\D/g, '');
    if (!formattedNumber.startsWith('91') && formattedNumber.length === 10) {
      formattedNumber = '91' + formattedNumber;
    }

    const chatId = formattedNumber + '@c.us';

    let mimeType;
    let data;

    if (typeof mediaData === 'string' && mediaData.startsWith('data:')) {
      const base64Marker = ';base64,';
      const base64Index = mediaData.indexOf(base64Marker);
      if (base64Index === -1) {
        throw new Error('Invalid media data format');
      }
      mimeType = mediaData.slice(5, base64Index).split(';')[0];
      data = mediaData.slice(base64Index + base64Marker.length);
    } else if (typeof mediaData === 'string' && /^[A-Za-z0-9+/=\s]+$/.test(mediaData.trim())) {
      mimeType = (fileName || '').toLowerCase().endsWith('.pdf')
        ? 'application/pdf'
        : 'application/octet-stream';
      data = mediaData.trim();
    } else {
      throw new Error('Invalid media data format');
    }

    const media = new MessageMedia(mimeType, data, fileName);
    return await this.client.sendMessage(chatId, media, { caption });
  }
}

export const whatsappService = new WhatsAppService();
