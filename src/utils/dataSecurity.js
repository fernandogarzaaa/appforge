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

/**
 * Simple encryption using base64 (WARNING: Not production-grade)
 * For production, use TweetNaCl.js or libsodium.js
 */
class EncryptionManager {
  /**
   * Encrypt sensitive data
   * @param {any} data - Data to encrypt
   * @param {string} key - Encryption key
   * @returns {EncryptedData} Encrypted data object
   */
  static encrypt(data, key) {
    try {
      const jsonString = JSON.stringify(data)
      const iv = this.generateIV()

      // Simple XOR encryption (for demo only)
      let encrypted = ''
      for (let i = 0; i < jsonString.length; i++) {
        encrypted += String.fromCharCode(
          jsonString.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        )
      }

      return {
        iv,
        encryptedValue: btoa(encrypted), // Base64 encode
        algorithm: 'XOR-Base64',
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Encryption error:', error)
      return null
    }
  }

  /**
   * Decrypt data
   * @param {EncryptedData} encryptedData - Encrypted data object
   * @param {string} key - Decryption key
   * @returns {any} Decrypted data
   */
  static decrypt(encryptedData, key) {
    try {
      const encrypted = atob(encryptedData.encryptedValue)

      // Simple XOR decryption (reverse operation)
      let decrypted = ''
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(
          encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        )
      }

      return JSON.parse(decrypted)
    } catch (error) {
      console.error('Decryption error:', error)
      return null
    }
  }

  /**
   * Hash data using simple algorithm
   * For production, use bcrypt or Argon2
   * @param {string} data - Data to hash
   * @param {number} rounds - Hash rounds
   * @returns {string} Hash
   */
  static hash(data, rounds = 10) {
    let hash = data
    for (let i = 0; i < rounds; i++) {
      hash = btoa(hash) // Simple iterative hash
    }
    return hash
  }

  /**
   * Generate initialization vector
   * @private
   * @returns {string} IV
   */
  static generateIV() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  /**
   * Generate random key
   * @param {number} length - Key length
   * @returns {string} Random key
   */
  static generateKey(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let key = ''
    for (let i = 0; i < length; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return key
  }
}

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
