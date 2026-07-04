const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    platform: {
      type: String,
      enum: ["android", "ios"],
      required: true,
    },

    freeCredits: {
      type: Number,
      default: 3,
    },

    isPremium: {
      type: Boolean,
      default: false,
    },

    appVersion: {
      type: String,
      default: null,
    },

    buildNumber: {
      type: String,
      default: null,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Device", deviceSchema);