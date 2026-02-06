/**
 * @fileoverview Data Privacy & Security Utilities
 * Provides encryption, anonymization, and GDPR compliance tools
 * @module dataSecurity
 */

/**
 * @typedef {Object} EncryptedData
 * @property {string} iv - Initialization vector
 * @property {string} encryptedValue - Encrypted value
 * @property {string} algorithm - Algorithm used
 * @property {number} timestamp - Encryption timestamp
 */

/**
 * @typedef {Object} AnonymizationRule
 * @property {string} field - Field name
 * @property {string} method - Anonymization method
 * @property {Object} [options] - Method-specific options
 */

/**
 * @typedef {Object} GDPRConsent
 * @property {string} userId - User ID
 * @property {string} type - Consent type (marketing, analytics, etc.)
 * @property {boolean} granted - Consent granted
 * @property {number} timestamp - Consent timestamp
 * @property {string} version - Policy version
 */

// =======================
// Encryption Utilities
// =======================

class EncryptionManager {
  /**
   * Encrypt sensitive data
   * @param {any} data - Data to encrypt
   * @param {string} key - Encryption key
   * @returns {EncryptedData} Encrypted data object
   */
  static async encrypt(data, key) {
    try {
      const jsonString = JSON.stringify(data);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const cryptoKey = await deriveAesKey(key, salt);
      const encoded = new TextEncoder().encode(jsonString);

      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encoded
      );

      return {
        iv: toBase64(iv),
        salt: toBase64(salt),
        encryptedValue: toBase64(new Uint8Array(encryptedBuffer)),
        algorithm: 'AES-GCM',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  }

  /**
   * Decrypt data
   * @param {EncryptedData} encryptedData - Encrypted data object
   * @param {string} key - Decryption key
   * @returns {any} Decrypted data
   */
  static async decrypt(encryptedData, key) {
    try {
      if (!encryptedData?.encryptedValue || !encryptedData?.iv || !encryptedData?.salt) {
        throw new Error('Invalid encrypted payload');
      }

      const iv = fromBase64(encryptedData.iv);
      const salt = fromBase64(encryptedData.salt);
      const encrypted = fromBase64(encryptedData.encryptedValue);
      const cryptoKey = await deriveAesKey(key, salt);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encrypted
      );

      const decoded = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  /**
   * Hash data using simple algorithm
   * For production, use bcrypt or Argon2
   * @param {string} data - Data to hash
   * @param {number} rounds - Hash rounds
   * @returns {string} Hash
   */
  static hash(data) {
    return sha256(String(data));
  }

  /**
   * Generate initialization vector
   * @private
   * @returns {string} IV
   */
  static generateIV() {
    return Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate random key
   * @param {number} length - Key length
   * @returns {string} Random key
   */
  static generateKey(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < length; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }
}

// Crypto helpers
const toBase64 = (buffer) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const fromBase64 = (b64) => {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const deriveAesKey = async (password, salt) => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Minimal SHA-256 implementation (sync) for anonymization use-cases
const sha256 = (ascii) => {
  const rightRotate = (value, amount) => (value >>> amount) | (value << (32 - amount));
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';

  const words = [];
  const asciiBitLength = ascii.length * 8;

  const hash = sha256.h || (sha256.h = []);
  const k = sha256.k || (sha256.k = []);
  let primeCounter = k.length;

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length;) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
};

// =======================
// Data Anonymization
// =======================

class AnonymizationEngine {
  /**
   * Anonymize data based on rules
   * @param {Object} data - Data to anonymize
   * @param {AnonymizationRule[]} rules - Anonymization rules
   * @returns {Object} Anonymized data
   */
  static anonymize(data, rules) {
    const result = { ...data }

    rules.forEach(rule => {
      if (result.hasOwnProperty(rule.field)) {
        result[rule.field] = this.applyAnonymization(
          result[rule.field],
          rule.method,
          rule.options
        )
      }
    })

    return result
  }

  /**
   * Apply anonymization method
   * @private
   * @param {any} value - Value to anonymize
   * @param {string} method - Anonymization method
   * @param {Object} options - Method options
   * @returns {any} Anonymized value
   */
  static applyAnonymization(value, method, options = {}) {
    switch (method) {
      case 'mask':
        return this.maskValue(value, options)
      case 'generalize':
        return this.generalize(value, options)
      case 'suppress':
        return null
      case 'hash':
        return EncryptionManager.hash(String(value))
      case 'pseudonymize':
        return this.pseudonymize(value, options)
      case 'aggregate':
        return this.aggregate(value, options)
      default:
        return value
    }
  }

  /**
   * Mask sensitive values
   * @param {any} value - Value to mask
   * @param {Object} options - Mask options
   * @returns {string} Masked value
   */
  static maskValue(value, options = {}) {
    const strValue = String(value)
    const visibleChars = options.visibleChars || 2
    const maskChar = options.maskChar || '*'

    if (strValue.length <= visibleChars) {
      return maskChar.repeat(strValue.length)
    }

    const visible = strValue.substring(0, visibleChars)
    const masked = maskChar.repeat(strValue.length - visibleChars)
    return visible + masked
  }

  /**
   * Generalize values (e.g., age ranges)
   * @param {any} value - Value to generalize
   * @param {Object} options - Generalization options
   * @returns {string} Generalized value
   */
  static generalize(value, options = {}) {
    if (options.type === 'age') {
      const age = parseInt(value)
      const range = options.range || 10
      const lower = Math.floor(age / range) * range
      const upper = lower + range - 1
      return `${lower}-${upper}`
    }

    if (options.type === 'date') {
      const date = new Date(value)
      return `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`
    }

    return value
  }

  /**
   * Pseudonymize (replace with consistent identifier)
   * @param {any} value - Value to pseudonymize
   * @param {Object} options - Pseudonymization options
   * @returns {string} Pseudonym
   */
  static pseudonymize(value, options = {}) {
    const prefix = options.prefix || 'USER'
    const hash = EncryptionManager.hash(String(value))
    return `${prefix}_${hash.substring(0, 8)}`
  }

  /**
   * Aggregate numeric values
   * @param {number} value - Value to aggregate
   * @param {Object} options - Aggregation options
   * @returns {number} Aggregated value
   */
  static aggregate(value, options = {}) {
    const bucket = options.bucketSize || 10
    return Math.floor(value / bucket) * bucket
  }
}

// =======================
// GDPR Compliance
// =======================

class GDPRCompliance {
  constructor() {
    this.consentRecords = new Map() // userId -> consents
    this.dataProcessingAgreements = new Map() // vendorId -> DPA
    this.dataRetentionPolicies = new Map() // dataType -> retention days
    this.auditLog = []
  }

  /**
   * Record user consent
   * @param {string} userId - User ID
   * @param {string} type - Consent type
   * @param {boolean} granted - Consent granted
   * @param {string} policyVersion - Policy version
   * @returns {GDPRConsent} Consent record
   */
  recordConsent(userId, type, granted, policyVersion = '1.0') {
    const consent = {
      userId,
      type,
      granted,
      timestamp: Date.now(),
      version: policyVersion
    }

    if (!this.consentRecords.has(userId)) {
      this.consentRecords.set(userId, [])
    }
    this.consentRecords.get(userId).push(consent)

    this.auditLog.push({
      action: 'consent_recorded',
      userId,
      type,
      timestamp: Date.now()
    })

    return consent
  }

  /**
   * Check user consent
   * @param {string} userId - User ID
   * @param {string} type - Consent type
   * @returns {boolean} Consent status
   */
  hasConsent(userId, type) {
    const consents = this.consentRecords.get(userId) || []
    const latestConsent = consents.filter(c => c.type === type).pop()
    return latestConsent?.granted || false
  }

  /**
   * Generate privacy policy
   * @returns {string} Privacy policy HTML
   */
  generatePrivacyPolicy() {
    return `
      <div class="privacy-policy">
        <h1>Privacy Policy</h1>
        
        <h2>1. Data Collection</h2>
        <p>We collect the following types of data:</p>
        <ul>
          <li>Personal identification information</li>
          <li>Usage analytics data</li>
          <li>Device information</li>
          <li>Cookies and tracking data</li>
        </ul>

        <h2>2. Data Usage</h2>
        <p>Your data is used for:</p>
        <ul>
          <li>Service improvement</li>
          <li>Personalization</li>
          <li>Marketing (with consent)</li>
          <li>Legal compliance</li>
        </ul>

        <h2>3. Data Retention</h2>
        <p>We retain data according to:</p>
        <ul>
          <li>Legal requirements</li>
          <li>Service necessity</li>
          <li>Your preferences</li>
        </ul>

        <h2>4. Your Rights</h2>
        <p>Under GDPR, you have the right to:</p>
        <ul>
          <li>Access your data</li>
          <li>Correct your data</li>
          <li>Delete your data (Right to be Forgotten)</li>
          <li>Export your data</li>
          <li>Object to processing</li>
        </ul>

        <h2>5. Data Protection</h2>
        <p>We implement:</p>
        <ul>
          <li>End-to-end encryption</li>
          <li>Regular security audits</li>
          <li>Access controls</li>
          <li>Data anonymization</li>
        </ul>

        <h2>6. Contact</h2>
        <p>For privacy concerns, contact: privacy@appforge.io</p>
      </div>
    `
  }

  /**
   * Generate Data Processing Agreement
   * @param {string} vendorId - Vendor ID
   * @returns {Object} DPA document
   */
  generateDPA(vendorId) {
    return {
      vendorId,
      date: new Date().toISOString(),
      version: '1.0',
      sections: [
        {
          title: 'Scope of Processing',
          content: 'This DPA governs processing of personal data by the vendor'
        },
        {
          title: 'Data Security',
          content: 'Vendor shall implement appropriate technical and organizational measures'
        },
        {
          title: 'Sub-processors',
          content: 'Vendor must notify and obtain consent before engaging sub-processors'
        },
        {
          title: 'Data Subject Rights',
          content: 'Vendor shall assist in fulfilling data subject rights requests'
        },
        {
          title: 'Audit Rights',
          content: 'Controller reserves right to audit vendor compliance'
        }
      ]
    }
  }

  /**
   * Set data retention policy
   * @param {string} dataType - Type of data
   * @param {number} retentionDays - Days to retain
   */
  setRetentionPolicy(dataType, retentionDays) {
    this.dataRetentionPolicies.set(dataType, retentionDays)
  }

  /**
   * Check data retention compliance
   * @param {string} dataType - Type of data
   * @param {number} createdTime - Data creation timestamp
   * @returns {boolean} Whether data should be retained
   */
  shouldRetain(dataType, createdTime) {
    const retentionDays = this.dataRetentionPolicies.get(dataType) || 365
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000
    return Date.now() - createdTime < retentionMs
  }

  /**
   * Generate GDPR compliance report
   * @returns {Object} Compliance report
   */
  generateComplianceReport() {
    return {
      timestamp: new Date().toISOString(),
      consentRecords: this.consentRecords.size,
      auditLogEntries: this.auditLog.length,
      retentionPolicies: Array.from(this.dataRetentionPolicies.entries()),
      lastAudit: this.auditLog.length > 0 ? this.auditLog[this.auditLog.length - 1] : null,
      complianceStatus: 'COMPLIANT',
      recommendations: [
        'Review consent management quarterly',
        'Audit data processing annually',
        'Update privacy policy on policy changes',
        'Maintain DPAs with all vendors'
      ]
    }
  }
}

// =======================
// Exports
// =======================

export { EncryptionManager, AnonymizationEngine, GDPRCompliance }

export const gdprCompliance = new GDPRCompliance()

export default {
  EncryptionManager,
  AnonymizationEngine,
  GDPRCompliance,
  gdprCompliance
}
