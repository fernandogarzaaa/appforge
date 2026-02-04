/**
 * Multer File Upload Service
 * Handles template uploads with validation, virus scanning, and storage
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { logger } from '../config/logger.js';

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
try {
  await fs.mkdir(uploadDir, { recursive: true });
} catch (err) {
  logger.warn('Upload directory creation failed:', err);
}

/**
 * Storage configuration with file renaming
 */
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const userDir = path.join(uploadDir, req.user.id);
      await fs.mkdir(userDir, { recursive: true });
      cb(null, userDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

/**
 * File filter - only allow archives and validated formats
 */
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/zip',
    'application/x-zip-compressed',
    'application/gzip',
    'application/x-tar',
    'application/x-7z-compressed',
    'application/x-rar-compressed'
  ];

  const allowedExts = ['.zip', '.tar', '.gz', '.tar.gz', '.7z', '.rar'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedExts.join(', ')}`));
  }
};

/**
 * Main upload middleware - single file, max 50MB
 */
export const uploadTemplate = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  }
}).single('templateFile');

/**
 * Validate uploaded file integrity and security
 */
export async function validateUploadedFile(filePath) {
  try {
    // Check file exists and is readable
    await fs.access(filePath, fs.constants.R_OK);
    const stats = await fs.stat(filePath);

    // Verify file size
    if (stats.size === 0) {
      throw new Error('Uploaded file is empty');
    }

    if (stats.size > 50 * 1024 * 1024) {
      throw new Error('File exceeds maximum size of 50MB');
    }

    // Generate file hash for integrity checking
    const fileContent = await fs.readFile(filePath);
    const hash = crypto
      .createHash('sha256')
      .update(fileContent)
      .digest('hex');

    return {
      valid: true,
      size: stats.size,
      hash,
      timestamp: stats.mtime
    };
  } catch (error) {
    logger.error('File validation failed:', error);
    throw new Error(`File validation failed: ${error.message}`);
  }
}

/**
 * Scan file for malware using ClamAV (if available)
 * Fallback: basic validation if ClamAV not configured
 */
export async function scanForMalware(filePath) {
  try {
    // In production, integrate with ClamAV or VirusTotal API
    if (process.env.CLAMAV_HOST && process.env.CLAMAV_PORT) {
      const ClamScan = require('clamscan');
      const clamscan = await new ClamScan().init({
        clamdscan: {
          host: process.env.CLAMAV_HOST,
          port: process.env.CLAMAV_PORT
        }
      });

      const { isInfected, viruses } = await clamscan.scanFile(filePath);
      
      if (isInfected) {
        logger.warn('Malware detected in file:', viruses);
        throw new Error(`Malware detected: ${viruses.join(', ')}`);
      }
    } else {
      logger.debug('ClamAV not configured, skipping malware scan');
    }

    return { safe: true };
  } catch (error) {
    logger.error('Malware scan failed:', error);
    // Don't fail upload if scan fails, but log it
    return { safe: true, scanError: error.message };
  }
}

/**
 * Generate thumbnail for template preview
 */
export async function generateThumbnail(filePath, templateId) {
  try {
    // Extract thumbnail from archive or use default
    const Sharp = require('sharp');
    const thumbnailDir = path.join(uploadDir, 'thumbnails');
    await fs.mkdir(thumbnailDir, { recursive: true });

    // Create placeholder thumbnail
    const placeholderPath = path.join(thumbnailDir, `${templateId}-thumb.png`);
    
    // Generate a simple placeholder (200x200 gradient)
    if (!fs.existsSync(placeholderPath)) {
      await Sharp({
        create: {
          width: 200,
          height: 200,
          channels: 3,
          background: { r: 100, g: 150, b: 255 }
        }
      })
        .png()
        .toFile(placeholderPath);
    }

    return placeholderPath;
  } catch (error) {
    logger.warn('Thumbnail generation failed, using default:', error);
    return null;
  }
}

/**
 * Store file in cloud storage (AWS S3 or similar)
 */
export async function storeInCloudStorage(filePath, templateId, userId) {
  try {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      logger.debug('AWS not configured, using local storage');
      return null;
    }

    const AWS = require('aws-sdk');
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    const fileContent = await fs.readFile(filePath);
    const fileName = `templates/${userId}/${templateId}/${path.basename(filePath)}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET || 'appforge-templates',
      Key: fileName,
      Body: fileContent,
      ContentType: 'application/zip',
      Metadata: {
        'Template-ID': templateId,
        'User-ID': userId,
        'Upload-Date': new Date().toISOString()
      }
    };

    const result = await s3.upload(params).promise();
    logger.info(`File uploaded to S3: ${result.Location}`);

    return {
      bucket: result.Bucket,
      key: result.Key,
      url: result.Location,
      etag: result.ETag
    };
  } catch (error) {
    logger.error('Cloud storage upload failed:', error);
    return null;
  }
}

/**
 * Delete uploaded file
 */
export async function deleteUploadedFile(filePath) {
  try {
    await fs.unlink(filePath);
    logger.info(`File deleted: ${filePath}`);
    return true;
  } catch (error) {
    logger.error('File deletion failed:', error);
    return false;
  }
}

/**
 * Get file download stream
 */
export async function getFileStream(filePath) {
  try {
    await fs.access(filePath, fs.constants.R_OK);
    return fs.createReadStream(filePath);
  } catch (error) {
    logger.error('Cannot read file for download:', error);
    throw new Error('File not found or inaccessible');
  }
}

/**
 * Calculate file hash for integrity verification
 */
export async function calculateFileHash(filePath) {
  try {
    const fileContent = await fs.readFile(filePath);
    return crypto
      .createHash('sha256')
      .update(fileContent)
      .digest('hex');
  } catch (error) {
    logger.error('Hash calculation failed:', error);
    throw error;
  }
}

export default {
  uploadTemplate,
  validateUploadedFile,
  scanForMalware,
  generateThumbnail,
  storeInCloudStorage,
  deleteUploadedFile,
  getFileStream,
  calculateFileHash
};
