/**
 * Two-Factor Authentication (2FA)
 * TOTP-based 2FA with QR codes and backup codes
 */

// deno-lint-ignore-file no-explicit-any
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// In production, use proper TOTP library
// For now, using simplified implementation
const TOTP_SECRET_LENGTH = 32;
const BACKUP_CODES_COUNT = 10;

// Store 2FA data (use database in production)
const twoFactorData = new Map();

interface TwoFactorAuth {
  userId: string;
  secret: string;
  enabled: boolean;
  backupCodes: string[];
  createdAt: Date;
  lastUsed?: Date;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, code, password } = await req.json();

    switch (action) {
      case 'setup': {
        // Generate secret and backup codes
        const secret = generateSecret();
        const backupCodes = generateBackupCodes();

        // Store temporarily (not enabled yet)
        twoFactorData.set(user.id, {
          userId: user.id,
          secret,
          enabled: false,
          backupCodes,
          createdAt: new Date()
        });

        // Generate QR code URL (for authenticator apps)
        const issuer = 'AppForge';
        const accountName = user.email;
        const otpauthUrl = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}`;

        return Response.json({
          secret,
          qrCodeUrl: otpauthUrl,
          backupCodes,
          message: 'Scan QR code with authenticator app and verify with a code to enable 2FA'
        }, { status: 200 });
      }

      case 'enable': {
        if (!code) {
          return Response.json({ error: 'Missing verification code' }, { status: 400 });
        }

        const tfaData = twoFactorData.get(user.id);
        if (!tfaData) {
          return Response.json({ error: '2FA not set up. Call setup first.' }, { status: 400 });
        }

        // Verify code
        const valid = verifyTOTP(tfaData.secret, code);
        if (!valid) {
          return Response.json({ error: 'Invalid verification code' }, { status: 400 });
        }

        // Enable 2FA
        tfaData.enabled = true;
        tfaData.lastUsed = new Date();
        twoFactorData.set(user.id, tfaData);

        return Response.json({
          success: true,
          message: '2FA enabled successfully',
          backupCodes: tfaData.backupCodes
        }, { status: 200 });
      }

      case 'disable': {
        if (!password) {
          return Response.json({ error: 'Password required to disable 2FA' }, { status: 400 });
        }

        // Verify password (in production, verify against actual password)
        // For now, just check if provided
        
        const tfaData = twoFactorData.get(user.id);
        if (!tfaData) {
          return Response.json({ error: '2FA not enabled' }, { status: 400 });
        }

        // Delete 2FA data
        twoFactorData.delete(user.id);

        return Response.json({
          success: true,
          message: '2FA disabled successfully'
        }, { status: 200 });
      }

      case 'verify': {
        if (!code) {
          return Response.json({ error: 'Missing verification code' }, { status: 400 });
        }

        const tfaData = twoFactorData.get(user.id);
        if (!tfaData || !tfaData.enabled) {
          return Response.json({ error: '2FA not enabled' }, { status: 400 });
        }

        // Check if it's a backup code
        const backupIndex = tfaData.backupCodes.indexOf(code);
        if (backupIndex !== -1) {
          // Remove used backup code
          tfaData.backupCodes.splice(backupIndex, 1);
          tfaData.lastUsed = new Date();
          twoFactorData.set(user.id, tfaData);

          return Response.json({
            success: true,
            message: 'Verified with backup code',
            remainingBackupCodes: tfaData.backupCodes.length
          }, { status: 200 });
        }

        // Verify TOTP code
        const valid = verifyTOTP(tfaData.secret, code);
        if (!valid) {
          return Response.json({ 
            success: false,
            error: 'Invalid verification code' 
          }, { status: 400 });
        }

        tfaData.lastUsed = new Date();
        twoFactorData.set(user.id, tfaData);

        return Response.json({
          success: true,
          message: 'Verification successful'
        }, { status: 200 });
      }

      case 'regenerateBackupCodes': {
        if (!password) {
          return Response.json({ error: 'Password required' }, { status: 400 });
        }

        const tfaData = twoFactorData.get(user.id);
        if (!tfaData || !tfaData.enabled) {
          return Response.json({ error: '2FA not enabled' }, { status: 400 });
        }

        // Generate new backup codes
        tfaData.backupCodes = generateBackupCodes();
        twoFactorData.set(user.id, tfaData);

        return Response.json({
          success: true,
          backupCodes: tfaData.backupCodes,
          message: 'New backup codes generated. Store them securely!'
        }, { status: 200 });
      }

      case 'getStatus': {
        const tfaData = twoFactorData.get(user.id);
        
        return Response.json({
          enabled: tfaData?.enabled || false,
          lastUsed: tfaData?.lastUsed,
          backupCodesRemaining: tfaData?.backupCodes?.length || 0
        }, { status: 200 });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('2FA error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Generate random secret for TOTP
 */
function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < TOTP_SECRET_LENGTH; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

/**
 * Generate backup codes
 */
function generateBackupCodes(): string[] {
  const codes = [];
  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Verify TOTP code
 * In production, use a proper TOTP library like `otplib`
 */
function verifyTOTP(secret: string, code: string): boolean {
  // Simplified verification for demo
  // In production, implement proper TOTP algorithm
  // This would:
  // 1. Get current Unix timestamp
  // 2. Calculate time step (typically 30 seconds)
  // 3. Generate HOTP for current time window
  // 4. Compare with provided code
  // 5. Check adjacent time windows for clock drift
  
  // For demo, accept any 6-digit code
  return code.length === 6 && /^\d{6}$/.test(code);
}
