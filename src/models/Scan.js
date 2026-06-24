const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },

    maliciousCount: {
      type: Number,
      default: 0,
    },

    harmlessCount: {
      type: Number,
      default: 0,
    },

    suspiciousCount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      default: "Unknown",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Scan", scanSchema);