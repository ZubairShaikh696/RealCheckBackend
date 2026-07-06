const mongoose = require("mongoose");

const scanHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    device_id: {
      type: String,
      default: null,
      index: true,
    },

    scan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scan",
      required: true,
    },

    normalizedUrl: {
      type: String,
      required: true,
      index: true,
    },

    originalUrl: {
      type: String,
      required: true,
    },

    result: {
      type: String,
      enum: [
        "Safe",
        "Suspicious",
        "Malicious",
        "Unknown",
      ],
      default: "Unknown",
    },

    scanCount: {
      type: Number,
      default: 1,
    },

    lastViewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ScanHistory",
  scanHistorySchema
);