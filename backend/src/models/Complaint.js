const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'],
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    remarks: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    imageHash: {
      type: String,
      trim: true,
    },
    // Location Details
    location: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
      address: {
        type: String,
        default: 'Location captured via GPS',
      },
    },
    // AI Analysis Details (from Google Gemini)
    aiCategory: {
      type: String,
      enum: ['Pothole', 'Garbage Overflow', 'Broken Streetlight', 'Drainage Issue', 'Other'],
      required: true,
    },
    aiSeverity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    aiConfidence: {
      type: Number,
      default: 0.92,
    },
    aiSummary: {
      type: String,
      default: '',
    },
    // Department Routing
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    departmentName: {
      type: String,
      default: 'Unassigned',
    },
    // Status
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'],
      default: 'Submitted',
    },
    statusHistory: [statusHistorySchema],
    // Upvotes / Supporters
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    upvoteCount: {
      type: Number,
      default: 0,
    },
    supporters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    supporterCount: {
      type: Number,
      default: 0,
    },
    // Duplicate Detection Metadata
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
    },
    duplicateDistanceMeters: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster geo-queries and search
complaintSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
complaintSchema.index({ status: 1, aiCategory: 1 });
complaintSchema.index({ imageHash: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
