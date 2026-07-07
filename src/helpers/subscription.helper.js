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
      accountType: SUBSCRIPTION.GUEST,
      unlimited: false,
      remainingCredits: device?.freeCredits ?? 0,
    };
  }

  // Monthly / Yearly
  if (isUnlimited(user) && !isExpired(user)) {
    return {
      accountType: user.subscriptionType,
      unlimited: true,
      remainingCredits: null,
    };
  }

  // Bundle
  if (isBundle(user)) {
    return {
      accountType: SUBSCRIPTION.BUNDLE,
      unlimited: false,
      remainingCredits: user.bundleCredits,
    };
  }

  // Logged-in Free User
  return {
    accountType: SUBSCRIPTION.FREE,
    unlimited: false,
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