const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    device_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    // Logged-in user (null means Guest)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    device_name: {
      type: String,
      default: null,
    },

    platform: {
      type: String,
      required: true,
    },

    os_version: {
      type: String,
      default: null,
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
      min: 0,
    },

    isPremium: {
      type: Boolean,
      default: false,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    rewardToday: {
  type: Number,
  default: 0,
},

lastRewardAt: {
  type: Date,
  default: null,
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Device", deviceSchema);