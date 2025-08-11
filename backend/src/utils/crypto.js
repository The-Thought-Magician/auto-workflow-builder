const crypto = require('crypto');

// Derive a 32 byte key from the provided secret
function deriveKey(secret) {
  return crypto.createHash('sha256').update(String(secret)).digest().slice(0, 32);
}

/**
 * Encrypts a plain text string using AES-256-CBC. The IV is generated
 * randomly and prepended to the encrypted data. The result is base64 encoded.
 *
 * @param {string} plaintext The plain text to encrypt
 * @param {string} secret    The secret used to derive the encryption key
 * @returns {string} Encrypted data in the form iv:encrypted (both base64)
 */
function encryptData(plaintext, secret) {
  const iv = crypto.randomBytes(16);
  const key = deriveKey(secret);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return iv.toString('base64') + ':' + encrypted;
}

/**
 * Decrypts data encrypted with encryptData. Expects a base64 encoded iv and
 * encrypted data separated by a colon.
 *
 * @param {string} encrypted The encrypted data string (iv:encrypted)
 * @param {string} secret    The secret used to derive the encryption key
 * @returns {string} Decrypted plain text
 */
function decryptData(encrypted, secret) {
  const [ivB64, encryptedData] = encrypted.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const key = deriveKey(secret);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encryptData, decryptData };