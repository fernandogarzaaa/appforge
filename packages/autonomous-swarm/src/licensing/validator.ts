import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

/**
 * LICENSE VALIDATION SYSTEM
 * JWT-based license keys with 14-day trial
 */

const SECRET_KEY = process.env.LICENSE_SECRET || 'quantum-swarm-secret-key-change-in-production';
const TRIAL_DAYS = 14;

export interface License {
    email: string;
    tier: 'trial' | 'pro' | 'enterprise';
    expires: string;
    features: string[];
}

export class LicenseValidator {
    /**
     * Generate a license key
     */
    static generate(email: string, tier: 'trial' | 'pro' | 'enterprise' = 'trial'): string {
        const license: License = {
            email,
            tier,
            expires: tier === 'trial'
                ? new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()
                : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            features: tier === 'trial'
                ? ['3_agents', '10_cycles_per_day']
                : ['all_agents', 'unlimited_cycles', 'priority_support']
        };

        return jwt.sign(license, SECRET_KEY, { expiresIn: tier === 'trial' ? '14d' : '1y' });
    }

    /**
     * Validate a license key
     */
    static validate(licenseKey: string): { valid: boolean; license?: License; error?: string } {
        try {
            const decoded = jwt.verify(licenseKey, SECRET_KEY) as License;

            // Check expiration
            if (new Date(decoded.expires) < new Date()) {
                return { valid: false, error: 'License expired' };
            }

            return { valid: true, license: decoded };
        } catch (error: any) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Check if feature is enabled
     */
    static hasFeature(license: License, feature: string): boolean {
        if (license.features.includes('all_agents') || license.features.includes('unlimited_cycles')) {
            return true; // Pro/Enterprise has all features
        }

        return license.features.includes(feature);
    }

    /**
     * Get license info
     */
    static getInfo(licenseKey: string): any {
        const result = this.validate(licenseKey);

        if (!result.valid) {
            return { valid: false, error: result.error };
        }

        const license = result.license!;
        const daysRemaining = Math.ceil(
            (new Date(license.expires).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        return {
            valid: true,
            email: license.email,
            tier: license.tier,
            expires: license.expires,
            daysRemaining,
            features: license.features
        };
    }
}

export default LicenseValidator;
