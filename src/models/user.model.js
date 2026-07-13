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
      required: true,
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

    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);