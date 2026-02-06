/**
 * Image Optimization Script
 * Converts PNG/JPG images to WebP format with compression
 *
 * Usage: node scripts/optimize-images.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
const imageExtensions = ['.png', '.jpg', '.jpeg'];

// Stats
let totalProcessed = 0;
let totalConverted = 0;
let totalSkipped = 0;
let totalFailed = 0;
let totalSizeBefore = 0;
let totalSizeAfter = 0;

/**
 * Convert image to WebP format
 * @param {string} filePath - Path to source image
 */
async function convertToWebP(filePath) {
  const parsed = path.parse(filePath);
  const outputPath = path.join(parsed.dir, `${parsed.name}.webp`);

  // Skip if WebP already exists
  if (fs.existsSync(outputPath)) {
    console.log(`⏭️  Skipped: ${path.relative(publicDir, outputPath)} (already exists)`);
    totalSkipped++;
    return;
  }

  try {
    // Get original file size
    const originalSize = fs.statSync(filePath).size;
    totalSizeBefore += originalSize;

    // Convert to WebP
    await sharp(filePath)
      .webp({
        quality: 85, // Good balance between quality and size
        effort: 6, // Higher = better compression but slower
      })
      .toFile(outputPath);

    // Get new file size
    const newSize = fs.statSync(outputPath).size;
    totalSizeAfter += newSize;

    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    const originalKB = (originalSize / 1024).toFixed(1);
    const newKB = (newSize / 1024).toFixed(1);

    console.log(`✅ Converted: ${path.relative(publicDir, filePath)}`);
    console.log(`   ${originalKB}KB → ${newKB}KB (saved ${savings}%)`);

    totalConverted++;
  } catch (error) {
    console.error(`❌ Failed: ${path.relative(publicDir, filePath)}`);
    console.error(`   Error: ${error.message}`);
    totalFailed++;
  }
}

/**
 * Process directory recursively
 * @param {string} dir - Directory to process
 */
async function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules, .git, etc.
      if (!file.startsWith('.') && file !== 'node_modules') {
        await processDirectory(fullPath);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (imageExtensions.includes(ext)) {
        totalProcessed++;
        await convertToWebP(fullPath);
      }
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🖼️  Image Optimization Script');
  console.log('============================\n');
  console.log(`Processing directory: ${publicDir}\n`);

  const startTime = Date.now();

  // Check if sharp is available
  try {
    await sharp({ create: { width: 1, height: 1, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .webp()
      .toBuffer();
  } catch (error) {
    console.error('❌ Sharp not installed or not working');
    console.error('Install with: npm install --save-dev sharp');
    process.exit(1);
  }

  await processDirectory(publicDir);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalSavings = totalSizeBefore > 0
    ? ((totalSizeBefore - totalSizeAfter) / totalSizeBefore * 100).toFixed(1)
    : 0;

  console.log('\n📊 Summary');
  console.log('==========');
  console.log(`✅ Converted: ${totalConverted} images`);
  console.log(`⏭️  Skipped: ${totalSkipped} images (already exist)`);
  console.log(`❌ Failed: ${totalFailed} images`);
  console.log(`📁 Total processed: ${totalProcessed} images`);
  console.log(`💾 Size before: ${(totalSizeBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`💾 Size after: ${(totalSizeAfter / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📉 Total savings: ${totalSavings}%`);
  console.log(`⏱️  Duration: ${duration}s`);

  if (totalConverted > 0) {
    console.log('\n🎉 Optimization complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Update image references to use .webp extension');
    console.log('2. Or use the OptimizedImage component for automatic fallback');
    console.log('3. Consider removing original images if no longer needed');
  } else if (totalSkipped > 0) {
    console.log('\n✨ All images already optimized!');
  } else {
    console.log('\n⚠️  No images found to optimize');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default main;
