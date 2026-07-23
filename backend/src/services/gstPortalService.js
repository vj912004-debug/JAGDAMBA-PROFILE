import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const execFileAsync = promisify(execFile);

const GST_ORIGIN = 'https://services.gst.gov.in';
const CURL_HEADERS = [
  '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  '-H', 'Accept: application/json, text/plain, */*',
  '-H', 'Accept-Language: en-IN,en;q=0.9',
  '-H', `Origin: ${GST_ORIGIN}`,
  '-H', `Referer: ${GST_ORIGIN}/services/searchtp`,
];

const sessions = new Map();
const SESSION_TTL_MS = 10 * 60 * 1000;

function pruneSessions() {
  const now = Date.now();
  for (const [id, row] of sessions.entries()) {
    if (now - row.createdAt > SESSION_TTL_MS) sessions.delete(id);
  }
}

function newSessionId() {
  return `gst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function cookieHeaderFromNetscapeFile(content) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('\t'))
    .map((line) => {
      const parts = line.split('\t');
      if (parts.length < 7) return '';
      return `${parts[5]}=${parts[6]}`;
    })
    .filter(Boolean)
    .join('; ');
}

function parsePortalJson(stdout) {
  const text = String(stdout || '').trim();
  if (!text) {
    throw new Error('GST portal returned an empty response');
  }

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // Fall through to HTML error below.
      }
    }
  }

  if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
    throw new Error('GST portal session expired. Refresh captcha and try again.');
  }

  throw new Error('GST portal returned an unexpected response');
}

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'gst-'));
}

export async function fetchGstPortalCaptcha() {
  pruneSessions();
  const tmp = await makeTempDir();
  const cookieFile = path.join(tmp, 'cookies.txt');
  const imageFile = path.join(tmp, 'captcha.png');
  const rnd = Math.random();

  await execFileAsync('curl', [
    '-sL',
    '-c', cookieFile,
    '-b', cookieFile,
    `${GST_ORIGIN}/services/searchtp`,
    ...CURL_HEADERS,
  ]);

  await execFileAsync('curl', [
    '-sL',
    '-c', cookieFile,
    '-b', cookieFile,
    `${GST_ORIGIN}/services/captcha?rnd=${rnd}`,
    '-o', imageFile,
    ...CURL_HEADERS,
  ]);

  const buffer = await fs.readFile(imageFile);
  if (buffer.length === 0 || buffer[0] === 0x3C) {
    throw new Error('GST portal blocked the request (WAF). Please configure a GST API key in .env (GST_LOOKUP_API_KEY).');
  }

  const cookieContent = await fs.readFile(cookieFile, 'utf8');
  const cookie = cookieHeaderFromNetscapeFile(cookieContent);
  if (!cookie) {
    throw new Error('Could not start GST portal session');
  }

  const sessionId = newSessionId();
  sessions.set(sessionId, { cookie, cookieFile, imageFile, createdAt: Date.now(), tmp });

  return {
    sessionId,
    image: `data:image/png;base64,${buffer.toString('base64')}`,
  };
}

export async function fetchGstPortalCaptchaPng(sessionId) {
  const session = sessions.get(sessionId);
  if (!session?.imageFile) {
    throw new Error('GST session expired. Please refresh captcha and try again.');
  }
  return fs.readFile(session.imageFile);
}

export async function fetchGstPortalTaxpayer(gstin, captcha, sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('GST session expired. Please refresh captcha and try again.');
  }

  const payload = JSON.stringify({ gstin, captcha });
  const { stdout } = await execFileAsync('curl', [
    '-sL',
    '-X', 'POST',
    `${GST_ORIGIN}/services/api/search/taxpayerDetails`,
    '-H', 'Content-Type: application/json',
    '-b', session.cookieFile,
    '-c', session.cookieFile,
    ...CURL_HEADERS,
    '--data-raw', payload,
  ]);

  let json;
  try {
    json = parsePortalJson(stdout);
  } catch (error) {
    console.error('GST portal raw response:', String(stdout || '').slice(0, 300));
    throw error;
  }

  if (json?.errorCode) {
    if (json.errorCode === 'SWEB_9000' || json.errorCode === 'SWEB_9033') {
      throw new Error('Invalid captcha. Please try again.');
    }
    throw new Error(json.message || `GST portal error (${json.errorCode})`);
  }

  if (!json?.gstin && !json?.lgnm && !json?.tradeNam) {
    throw new Error('GST details not found for this number');
  }

  sessions.delete(sessionId);
  if (session.tmp) {
    await fs.rm(session.tmp, { recursive: true, force: true }).catch(() => {});
  }

  return json;
}
