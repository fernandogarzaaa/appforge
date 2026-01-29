import React, { useMemo, useState } from 'react';
import {
  EncryptionManager,
  AnonymizationEngine,
  gdprCompliance,
} from '@/utils/dataSecurity';

/**
 * DataPrivacyDashboard
 *
 * Enterprise UI for privacy and security workflows.
 * - Encryption/Decryption demo
 * - Data anonymization with configurable rules
 * - GDPR consent management
 * - Compliance report + privacy policy viewer
 */
export default function DataPrivacyDashboard() {
  const [plainText, setPlainText] = useState('Sensitive customer data');
  const [encryptionKey, setEncryptionKey] = useState(
    () => EncryptionManager.generateKey(24)
  );
  const [encryptedData, setEncryptedData] = useState(null);
  const [decryptedData, setDecryptedData] = useState('');

  const [anonymizationRule, setAnonymizationRule] = useState({
    field: 'email',
    method: 'mask',
    options: { visibleChars: 3, maskChar: '*' },
  });

  const [consentForm, setConsentForm] = useState({
    userId: 'user_123',
    type: 'analytics',
    granted: true,
    version: '1.0',
  });
  const [lastConsent, setLastConsent] = useState(null);

  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [report, setReport] = useState(null);

  const sampleData = useMemo(
    () => ({
      name: 'Fernanda Garza',
      email: 'fernanda@appforge.io',
      age: 32,
      phone: '+1 (555) 123-4567',
      userId: 'user_123',
    }),
    []
  );

  const anonymizedData = useMemo(() => {
    return AnonymizationEngine.anonymize(sampleData, [anonymizationRule]);
  }, [sampleData, anonymizationRule]);

  const handleEncrypt = () => {
    const encrypted = EncryptionManager.encrypt(plainText, encryptionKey);
    setEncryptedData(encrypted);
    setDecryptedData('');
  };

  const handleDecrypt = () => {
    if (!encryptedData) return;
    const decrypted = EncryptionManager.decrypt(encryptedData, encryptionKey);
    setDecryptedData(String(decrypted));
  };

  const handleRecordConsent = () => {
    const consent = gdprCompliance.recordConsent(
      consentForm.userId,
      consentForm.type,
      consentForm.granted,
      consentForm.version
    );
    setLastConsent(consent);
  };

  const handleGenerateReport = () => {
    setReport(gdprCompliance.generateComplianceReport());
  };

  const handleRuleOptionChange = (key, value) => {
    setAnonymizationRule((prev) => ({
      ...prev,
      options: { ...prev.options, [key]: value },
    }));
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Data Privacy & Security
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage encryption, anonymization, and GDPR compliance in one place.
        </p>
      </header>

      {/* Encryption */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Encryption Demo
          </h2>
          <button
            onClick={() => setEncryptionKey(EncryptionManager.generateKey(24))}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Generate Key
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Plaintext
            </label>
            <textarea
              value={plainText}
              onChange={(e) => setPlainText(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Encryption Key
            </label>
            <input
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-gray-900 dark:text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={handleEncrypt}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                Encrypt
              </button>
              <button
                onClick={handleDecrypt}
                disabled={!encryptedData}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                Decrypt
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <p className="text-xs uppercase text-gray-500">Encrypted Payload</p>
            <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
              {encryptedData ? JSON.stringify(encryptedData, null, 2) : '—'}
            </pre>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <p className="text-xs uppercase text-gray-500">Decrypted Output</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {decryptedData || '—'}
            </p>
          </div>
        </div>
      </section>

      {/* Anonymization */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Data Anonymization
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Field
            </label>
            <select
              value={anonymizationRule.field}
              onChange={(e) =>
                setAnonymizationRule((prev) => ({
                  ...prev,
                  field: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-gray-900 dark:text-white"
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="age">Age</option>
              <option value="phone">Phone</option>
              <option value="userId">User ID</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Method
            </label>
            <select
              value={anonymizationRule.method}
              onChange={(e) =>
                setAnonymizationRule((prev) => ({
                  ...prev,
                  method: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-gray-900 dark:text-white"
            >
              <option value="mask">Mask</option>
              <option value="hash">Hash</option>
              <option value="pseudonymize">Pseudonymize</option>
              <option value="generalize">Generalize</option>
              <option value="aggregate">Aggregate</option>
              <option value="suppress">Suppress</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Options
            </label>
            {anonymizationRule.method === 'mask' && (
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={anonymizationRule.options.visibleChars || 2}
                  onChange={(e) =>
                    handleRuleOptionChange('visibleChars', Number(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-gray-900 dark:text-white"
                  placeholder="Visible chars"
                />
                <input
                  value={anonymizationRule.options.maskChar || '*'}
                  onChange={(e) =>
                    handleRuleOptionChange('maskChar', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-gray-900 dark:text-white"
                  placeholder="Mask char"
                />
              </div>
            )}
            {anonymizationRule.method === 'generalize' && (
              <select
                value={anonymizationRule.options.type || 'age'}
                onChange={(e) => handleRuleOptionChange('type', e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-gray-900 dark:text-white"
              >
                <option value="age">Age Range</option>
                <option value="date">Date (Quarter)</option>
              </select>
            )}
            {anonymizationRule.method === 'aggregate' && (
              <input
                type="number"
                min={1}
                value={anonymizationRule.options.bucketSize || 10}
                onChange={(e) =>
                  handleRuleOptionChange('bucketSize', Number(e.target.value))
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-gray-900 dark:text-white"
                placeholder="Bucket size"
              />
            )}
            {['hash', 'pseudonymize', 'suppress'].includes(anonymizationRule.method) && (
              <p className="text-xs text-gray-500">No options required.</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <p className="text-xs uppercase text-gray-500">Original</p>
            <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
              {JSON.stringify(sampleData, null, 2)}
            </pre>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <p className="text-xs uppercase text-gray-500">Anonymized</p>
            <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
              {JSON.stringify(anonymizedData, null, 2)}
            </pre>
          </div>
        </div>
      </section>

      {/* GDPR Consent */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          GDPR Consent Manager
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              User ID
            </label>
            <input
              value={consentForm.userId}
              onChange={(e) =>
                setConsentForm((prev) => ({ ...prev, userId: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-gray-900 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Type
            </label>
            <select
              value={consentForm.type}
              onChange={(e) =>
                setConsentForm((prev) => ({ ...prev, type: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-gray-900 dark:text-white"
            >
              <option value="analytics">Analytics</option>
              <option value="marketing">Marketing</option>
              <option value="personalization">Personalization</option>
              <option value="support">Support</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Policy Version
            </label>
            <input
              value={consentForm.version}
              onChange={(e) =>
                setConsentForm((prev) => ({ ...prev, version: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-gray-900 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Granted
            </label>
            <select
              value={consentForm.granted ? 'yes' : 'no'}
              onChange={(e) =>
                setConsentForm((prev) => ({
                  ...prev,
                  granted: e.target.value === 'yes',
                }))
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 text-gray-900 dark:text-white"
            >
              <option value="yes">Granted</option>
              <option value="no">Denied</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRecordConsent}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            Record Consent
          </button>
          {lastConsent && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last recorded: {lastConsent.type} ({lastConsent.granted ? 'granted' : 'denied'})
            </p>
          )}
        </div>
      </section>

      {/* Compliance & Policy */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Compliance Toolkit
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateReport}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              Generate Report
            </button>
            <button
              onClick={() => setShowPrivacyPolicy((prev) => !prev)}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
            >
              {showPrivacyPolicy ? 'Hide' : 'View'} Privacy Policy
            </button>
          </div>
        </div>

        {report && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}

        {showPrivacyPolicy && (
          <div
            className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
            dangerouslySetInnerHTML={{
              __html: gdprCompliance.generatePrivacyPolicy(),
            }}
          />
        )}
      </section>
    </div>
  );
}
