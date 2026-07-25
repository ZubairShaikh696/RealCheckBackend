const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    // ==========================
    // Scan Type
    // ==========================
    scanType: {
      type: String,
      enum: ["url", "image"],
      default: "url",
      index: true,
    },

    // ==========================
    // URL Scan
    // ==========================
    originalUrl: {
      type: String,
      default: null,
      // trim: true,
    },

    normalizedUrl: {
      type: String,
      default: null,
      index: true,
    },

    // ==========================
    // Image Scan
    // ==========================
    imageKey: {
      type: String,
      default: null,
    },

    // ==========================
    // Common
    // ==========================
    scanId: {
      type: String,
      default: null,
    },

    result: {
      type: String,
      enum: ["Safe", "Suspicious", "Malicious", "Unknown"],
      default: "Unknown",
    },

    confidence: {
      type: Number,
      default: 0,
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

    // ==========================
    // AI Explanation
    // ==========================
    aiExplanation: {
      type: String,
      default: null,
    },

    aiGeneratedAt: {
      type: Date,
      default: null,
    },

    // ==========================
    // Dates
    // ==========================
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