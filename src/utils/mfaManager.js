/**
 * Multi-Factor Authentication (MFA) Manager
 * TOTP, SMS, Email, and Backup Codes
 */

import crypto from 'crypto';

export const MFA_METHODS = {
  TOTP: 'totp',
  SMS: 'sms',
  EMAIL: 'email',
  BACKUP_CODES: 'backup_codes',
  WEBAUTHN: 'webauthn',
};

export const MFA_STATUS = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  PENDING: 'pending',
};

/**
 * TOTP (Time-based One-Time Password) Provider
 */
export class TOTPProvider {
  constructor(options = {}) {
    this.issuer = options.issuer || 'AppForge';
    this.algorithm = options.algorithm || 'sha1';
    this.digits = options.digits || 6;
    this.period = options.period || 30; // seconds
    this.window = options.window || 1; // tolerance window
  }

  /**
   * Generate secret key
   */
  generateSecret() {
    const buffer = crypto.randomBytes(20);
    const secret = this._base32Encode(buffer);
    
    return {
      secret,
      qrCode: null, // Will be generated with QR library
      uri: this.getKeyUri(secret),
    };
  }

  /**
   * Get key URI for QR code
   */
  getKeyUri(secret, accountName = 'user@appforge.com') {
    const params = new URLSearchParams({
      secret,
      issuer: this.issuer,
      algorithm: this.algorithm.toUpperCase(),
      digits: this.digits.toString(),
      period: this.period.toString(),
    });

    return `otpauth://totp/${encodeURIComponent(this.issuer)}:${encodeURIComponent(accountName)}?${params}`;
  }

  /**
   * Generate TOTP code
   */
  generateCode(secret, timestamp = Date.now()) {
    const counter = Math.floor(timestamp / 1000 / this.period);
    return this._generateHOTP(secret, counter);
  }

  /**
   * Verify TOTP code
   */
  verifyCode(secret, code, timestamp = Date.now()) {
    const currentCounter = Math.floor(timestamp / 1000 / this.period);

    // Check current window and tolerance windows
    for (let i = -this.window; i <= this.window; i++) {
      const expectedCode = this._generateHOTP(secret, currentCounter + i);
      if (this._constantTimeCompare(code, expectedCode)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate HOTP (HMAC-based One-Time Password)
   */
  _generateHOTP(secret, counter) {
    const decodedSecret = this._base32Decode(secret);
    const buffer = Buffer.alloc(8);
    
    // Write counter as big-endian
    for (let i = 7; i >= 0; i--) {
      buffer[i] = counter & 0xff;
      counter = counter >> 8;
    }

    // Generate HMAC
    const hmac = crypto.createHmac(this.algorithm, decodedSecret);
    hmac.update(buffer);
    const hmacResult = hmac.digest();

    // Dynamic truncation
    const offset = hmacResult[hmacResult.length - 1] & 0x0f;
    const code = (
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff)
    ) % Math.pow(10, this.digits);

    return code.toString().padStart(this.digits, '0');
  }

  /**
   * Base32 encode
   */
  _base32Encode(buffer) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }

  /**
   * Base32 decode
   */
  _base32Decode(str) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    const output = [];

    for (let i = 0; i < str.length; i++) {
      const idx = alphabet.indexOf(str[i].toUpperCase());
      if (idx === -1) continue;

      value = (value << 5) | idx;
      bits += 5;

      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(output);
  }

  /**
   * Constant time comparison
   */
  _constantTimeCompare(a, b) {
    if (a.length !== b.length) return false;

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}

/**
 * SMS/Email OTP Provider
 */
export class OTPProvider {
  constructor(options = {}) {
    this.codeLength = options.codeLength || 6;
    this.expiryTime = options.expiryTime || 300; // 5 minutes in seconds
    this.maxAttempts = options.maxAttempts || 5;
    this.codes = new Map();
  }

  /**
   * Generate OTP code
   */
  generateCode(identifier) {
    const code = this._generateNumericCode(this.codeLength);
    const expiresAt = Date.now() + (this.expiryTime * 1000);

    this.codes.set(identifier, {
      code,
      expiresAt,
      attempts: 0,
      createdAt: Date.now(),
    });

    return {
      code,
      expiresIn: this.expiryTime,
    };
  }

  /**
   * Verify OTP code
   */
  verifyCode(identifier, code) {
    const stored = this.codes.get(identifier);

    if (!stored) {
      return { valid: false, reason: 'code_not_found' };
    }

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      this.codes.delete(identifier);
      return { valid: false, reason: 'code_expired' };
    }

    // Check attempts
    if (stored.attempts >= this.maxAttempts) {
      this.codes.delete(identifier);
      return { valid: false, reason: 'max_attempts_exceeded' };
    }

    // Increment attempts
    stored.attempts++;

    // Verify code
    if (stored.code === code) {
      this.codes.delete(identifier);
      return { valid: true };
    }

    return { valid: false, reason: 'invalid_code', attemptsRemaining: this.maxAttempts - stored.attempts };
  }

  /**
   * Generate numeric code
   */
  _generateNumericCode(length) {
    const max = Math.pow(10, length);
    const code = crypto.randomInt(0, max);
    return code.toString().padStart(length, '0');
  }
}

/**
 * Backup Codes Provider
 */
export class BackupCodesProvider {
  constructor(options = {}) {
    this.codeCount = options.codeCount || 10;
    this.codeLength = options.codeLength || 8;
  }

  /**
   * Generate backup codes
   */
  generateCodes() {
    const codes = [];
    
    for (let i = 0; i < this.codeCount; i++) {
      codes.push(this._generateCode());
    }

    return {
      codes,
      generated: new Date().toISOString(),
    };
  }

  /**
   * Hash backup code
   */
  hashCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Verify backup code
   */
  verifyCode(code, hashedCodes) {
    const hashedCode = this.hashCode(code);
    return hashedCodes.includes(hashedCode);
  }

  /**
   * Generate single backup code
   */
  _generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < this.codeLength; i++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      code += chars[randomIndex];
      
      // Add hyphen every 4 characters
      if ((i + 1) % 4 === 0 && i !== this.codeLength - 1) {
        code += '-';
      }
    }

    return code;
  }
}

/**
 * MFA Manager
 */
export class MFAManager {
  constructor() {
    this.totpProvider = new TOTPProvider();
    this.otpProvider = new OTPProvider();
    this.backupCodesProvider = new BackupCodesProvider();
    this.userMFA = new Map();
  }

  /**
   * Enable TOTP for user
   */
  async enableTOTP(userId, accountName) {
    const { secret, uri } = this.totpProvider.generateSecret();

    // Store pending MFA setup
    this.userMFA.set(userId, {
      ...this.getUserMFA(userId),
      totp: {
        secret,
        status: MFA_STATUS.PENDING,
        enabledAt: null,
      },
    });

    return {
      secret,
      qrCodeUri: uri,
      manualEntry: secret,
    };
  }

  /**
   * Verify and activate TOTP
   */
  async verifyTOTP(userId, code) {
    const userMFA = this.getUserMFA(userId);
    
    if (!userMFA.totp || userMFA.totp.status !== MFA_STATUS.PENDING) {
      throw new Error('TOTP not configured');
    }

    const valid = this.totpProvider.verifyCode(userMFA.totp.secret, code);

    if (valid) {
      userMFA.totp.status = MFA_STATUS.ENABLED;
      userMFA.totp.enabledAt = new Date().toISOString();
      this.userMFA.set(userId, userMFA);
    }

    return { valid };
  }

  /**
   * Enable SMS MFA
   */
  async enableSMS(userId, phoneNumber) {
    const userMFA = this.getUserMFA(userId);

    userMFA.sms = {
      phoneNumber,
      status: MFA_STATUS.ENABLED,
      enabledAt: new Date().toISOString(),
    };

    this.userMFA.set(userId, userMFA);

    return { success: true };
  }

  /**
   * Send SMS code
   */
  async sendSMSCode(userId) {
    const userMFA = this.getUserMFA(userId);

    if (!userMFA.sms || userMFA.sms.status !== MFA_STATUS.ENABLED) {
      throw new Error('SMS MFA not enabled');
    }

    const { code, expiresIn } = this.otpProvider.generateCode(`sms_${userId}`);

    // TODO: Integrate with SMS provider (Twilio, etc.)
    console.log(`SMS code for ${userMFA.sms.phoneNumber}: ${code}`);

    return {
      success: true,
      expiresIn,
      maskedPhone: this._maskPhoneNumber(userMFA.sms.phoneNumber),
    };
  }

  /**
   * Verify SMS code
   */
  async verifySMSCode(userId, code) {
    return this.otpProvider.verifyCode(`sms_${userId}`, code);
  }

  /**
   * Enable Email MFA
   */
  async enableEmail(userId, email) {
    const userMFA = this.getUserMFA(userId);

    userMFA.email = {
      email,
      status: MFA_STATUS.ENABLED,
      enabledAt: new Date().toISOString(),
    };

    this.userMFA.set(userId, userMFA);

    return { success: true };
  }

  /**
   * Send email code
   */
  async sendEmailCode(userId) {
    const userMFA = this.getUserMFA(userId);

    if (!userMFA.email || userMFA.email.status !== MFA_STATUS.ENABLED) {
      throw new Error('Email MFA not enabled');
    }

    const { code, expiresIn } = this.otpProvider.generateCode(`email_${userId}`);

    // TODO: Send email with code
    console.log(`Email code for ${userMFA.email.email}: ${code}`);

    return {
      success: true,
      expiresIn,
      maskedEmail: this._maskEmail(userMFA.email.email),
    };
  }

  /**
   * Verify email code
   */
  async verifyEmailCode(userId, code) {
    return this.otpProvider.verifyCode(`email_${userId}`, code);
  }

  /**
   * Generate backup codes
   */
  async generateBackupCodes(userId) {
    const { codes } = this.backupCodesProvider.generateCodes();
    const hashedCodes = codes.map(code => this.backupCodesProvider.hashCode(code));

    const userMFA = this.getUserMFA(userId);
    userMFA.backupCodes = {
      codes: hashedCodes,
      used: [],
      generatedAt: new Date().toISOString(),
    };

    this.userMFA.set(userId, userMFA);

    return { codes };
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId, code) {
    const userMFA = this.getUserMFA(userId);

    if (!userMFA.backupCodes) {
      return { valid: false, reason: 'no_backup_codes' };
    }

    const hashedCode = this.backupCodesProvider.hashCode(code);

    // Check if already used
    if (userMFA.backupCodes.used.includes(hashedCode)) {
      return { valid: false, reason: 'code_already_used' };
    }

    // Verify code
    const valid = userMFA.backupCodes.codes.includes(hashedCode);

    if (valid) {
      userMFA.backupCodes.used.push(hashedCode);
      this.userMFA.set(userId, userMFA);
    }

    return {
      valid,
      remaining: userMFA.backupCodes.codes.length - userMFA.backupCodes.used.length,
    };
  }

  /**
   * Get user MFA settings
   */
  getUserMFA(userId) {
    return this.userMFA.get(userId) || {};
  }

  /**
   * Get enabled MFA methods
   */
  getEnabledMethods(userId) {
    const userMFA = this.getUserMFA(userId);
    const methods = [];

    if (userMFA.totp?.status === MFA_STATUS.ENABLED) {
      methods.push(MFA_METHODS.TOTP);
    }
    if (userMFA.sms?.status === MFA_STATUS.ENABLED) {
      methods.push(MFA_METHODS.SMS);
    }
    if (userMFA.email?.status === MFA_STATUS.ENABLED) {
      methods.push(MFA_METHODS.EMAIL);
    }
    if (userMFA.backupCodes?.codes?.length > 0) {
      methods.push(MFA_METHODS.BACKUP_CODES);
    }

    return methods;
  }

  /**
   * Disable MFA method
   */
  async disableMethod(userId, method) {
    const userMFA = this.getUserMFA(userId);

    if (userMFA[method]) {
      delete userMFA[method];
      this.userMFA.set(userId, userMFA);
    }

    return { success: true };
  }

  /**
   * Mask phone number
   */
  _maskPhoneNumber(phone) {
    const digits = phone.replace(/\D/g, '');
    return `***-***-${digits.slice(-4)}`;
  }

  /**
   * Mask email
   */
  _maskEmail(email) {
    const [local, domain] = email.split('@');
    const maskedLocal = local.charAt(0) + '***' + local.charAt(local.length - 1);
    return `${maskedLocal}@${domain}`;
  }
}

export default MFAManager;
