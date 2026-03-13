import crypto from 'crypto';

import { JWT_CONFIG } from '../../config/env.js';

const ENCRYPTION_SECRET = process.env.USER_API_SETTINGS_ENCRYPTION_KEY || JWT_CONFIG.SECRET;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const VERSION = 'v1';
const PREFIX = `enc:${VERSION}`;

const getKey = () => {
  if (!ENCRYPTION_SECRET) {
    throw new Error('Missing encryption secret for user API settings');
  }

  return crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();
};

export const isEncryptedSecret = (value) => typeof value === 'string' && value.startsWith(`${PREFIX}:`);

export const encryptSecret = (value) => {
  if (!value) {
    return value;
  }

  if (isEncryptedSecret(value)) {
    return value;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decryptSecret = (value) => {
  if (!value) {
    return value;
  }

  if (!isEncryptedSecret(value)) {
    return value;
  }

  const [, , ivHex, tagHex, encryptedHex] = value.split(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};
