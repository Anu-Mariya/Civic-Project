const crypto = require('crypto');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const Complaint = require('../models/Complaint');

const uploadsDirectory = path.resolve(__dirname, '../../uploads');

/**
 * Calculates SHA-256 hash of a file on disk
 * @param {string} filePath 
 * @returns {Promise<string>} 64-character hex SHA-256 hash
 */
async function hashFile(filePath) {
  const contents = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(contents).digest('hex');
}

/**
 * Backfills SHA-256 hashes for any existing complaints in DB that don't have one
 */
async function backfillMissingHashes() {
  try {
    const complaintsWithoutHash = await Complaint.find({
      $or: [{ imageHash: { $exists: false } }, { imageHash: null }, { imageHash: '' }],
    });

    for (const complaint of complaintsWithoutHash) {
      if (!complaint.imageUrl) continue;
      const filename = path.basename(complaint.imageUrl);
      const filePath = path.join(uploadsDirectory, filename);
      if (fsSync.existsSync(filePath)) {
        try {
          const hash = await hashFile(filePath);
          complaint.imageHash = hash;
          await complaint.save();
        } catch {
          // Ignore read error for missing/inaccessible file
        }
      }
    }
  } catch (err) {
    console.warn('[ImageDuplicateService] Backfill skipped:', err.message);
  }
}

/**
 * Searches for an existing complaint with matching SHA-256 image hash
 * @param {string} filePath - path of the newly uploaded image
 * @returns {Promise<{ imageHash: string, complaint: object|null, complaintId: string|null }>}
 */
async function findDuplicateImage(filePath) {
  const imageHash = await hashFile(filePath);

  // 1. Look up existing complaint in MongoDB with matching SHA-256 imageHash
  let existingComplaint = await Complaint.findOne({ imageHash })
    .sort({ createdAt: -1 })
    .populate('citizen', 'name email');

  if (existingComplaint) {
    return {
      imageHash,
      complaint: existingComplaint,
      complaintId: existingComplaint._id,
    };
  }

  // 2. Check legacy complaints that don't have an imageHash yet
  const legacyComplaints = await Complaint.find({
    $or: [{ imageHash: { $exists: false } }, { imageHash: null }, { imageHash: '' }],
  }).populate('citizen', 'name email');

  for (const complaint of legacyComplaints) {
    const filename = path.basename(complaint.imageUrl || '');
    if (!filename) continue;
    const legacyFilePath = path.join(uploadsDirectory, filename);
    if (fsSync.existsSync(legacyFilePath)) {
      try {
        const legacyHash = await hashFile(legacyFilePath);
        if (legacyHash === imageHash) {
          // Backfill hash to DB for future direct index queries
          complaint.imageHash = imageHash;
          await complaint.save();
          return {
            imageHash,
            complaint,
            complaintId: complaint._id,
          };
        }
      } catch {
        // Old complaints may refer to files that have since been removed
      }
    }
  }

  return {
    imageHash,
    complaint: null,
    complaintId: null,
  };
}

module.exports = {
  hashFile,
  findDuplicateImage,
  backfillMissingHashes,
};
