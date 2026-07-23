const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
function () {
    return this.provider === "email";
  },

  default: null,
    },

    // ==========================
    // Subscription
    // ==========================
    hasPremium: {
      type: Boolean,
      default: false,
    },

    subscriptionType: {
      type: String,
      enum: ["free", "monthly", "yearly", "bundle"],
      default: "free",
    },

    planName: {
      type: String,
      default: "Free",
    },

    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },

    bundleCredits: {
      type: Number,
      default: 0,
    },
    rewardToday: {
      type: Number,
      default: 0,
    },

    googleId: {
      type: String,
      default: null,
    },

    provider: {
  type: String,
  enum: ["email", "google"],
  default: "email",
},

    avatar: {
      type: String,
      default: null,
    },

    lastRewardAt: {
      type: Date,
      default: null,
    },

    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
