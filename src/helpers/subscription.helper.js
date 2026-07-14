const SUBSCRIPTION = require("../constants/subscription");

const {
  isGuest,
  isUnlimited,
  isBundle,
  isExpired,
} = require("../services/subscription.service");

// ==========================
// Get Account Info
// ==========================
const getAccountInfo = (user, device) => {

  // Guest
  if (isGuest(user)) {
    return {
  hasPremium: false,
  accountType: SUBSCRIPTION.GUEST,
  planType: "guest",
  planName: "Guest",
  unlimited: false,
  expiryDate: null,
  remainingCredits: device?.freeCredits ?? 0,
};
  }

  // Monthly / Yearly
  if (isUnlimited(user) && !isExpired(user)) {
    return {
  hasPremium: true,
  accountType: user.subscriptionType,
  planType: "subscription",
  planName: user.planName,
  unlimited: true,
  expiryDate: user.subscriptionExpiresAt,
  remainingCredits: null,
};
  }

  // Bundle
  if (isBundle(user)) {
    return {
  hasPremium: true,
  accountType: SUBSCRIPTION.BUNDLE,
  planType: "credits",
  planName: user.planName,
  unlimited: false,
  expiryDate: null,
  remainingCredits: user.bundleCredits,
};
  }

  // Logged-in Free User
  return {
  hasPremium: false,
  accountType: SUBSCRIPTION.FREE,
  planType: "free",
  planName: "Free",
  unlimited: false,
  expiryDate: null,
  remainingCredits: 0,
};
};

// ==========================
// Can Scan?
// ==========================
const canScan = (user, device) => {

  const account = getAccountInfo(user, device);

  if (account.unlimited) {
    return true;
  }

  return account.remainingCredits > 0;
};

// ==========================
// Consume Credit
// ==========================
const consumeCredit = async (user, device) => {

  const account = getAccountInfo(user, device);

  if (account.unlimited) {
    return account;
  }

  // Guest
  if (isGuest(user)) {

    if (device.freeCredits > 0) {
      device.freeCredits -= 1;
      await device.save();
    }

    return getAccountInfo(null, device);
  }

  // Bundle
  if (isBundle(user)) {

    if (user.bundleCredits > 0) {
      user.bundleCredits -= 1;
      await user.save();
    }

    return getAccountInfo(user, device);
  }

  // Free User
  return account;
};

module.exports = {
  getAccountInfo,
  canScan,
  consumeCredit,
};