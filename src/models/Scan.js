const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: true,
      trim: true,
    },

    normalizedUrl: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    scanId: {
      type: String,
      default: null,
    },

    result: {
      type: String,
      enum: ["Safe", "Suspicious", "Malicious", "Unknown"],
      default: "Unknown",
    },

    stats: {
      harmless: { type: Number, default: 0 },
      malicious: { type: Number, default: 0 },
      suspicious: { type: Number, default: 0 },
      undetected: { type: Number, default: 0 },
      timeout: { type: Number, default: 0 },
    },

    fullResponse: {
      type: Object,
      default: {},
    },

    lastScannedAt: {
      type: Date,
      default: Date.now,
    },

    cacheExpiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Scan", scanSchema);