const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    device_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    device_name: {
      type: String,
    },

    platform: {
      type: String,
    },

    os_version: {
      type: String,
    },

    app_version: {
      type: String,
      default: null,
    },

    build_number: {
      type: String,
      default: null,
    },

    freeCredits: {
      type: Number,
      default: 3,
    },

    isPremium: {
      type: Boolean,
      default: false,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Device", deviceSchema);