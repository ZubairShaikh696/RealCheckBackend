const SUBSCRIPTION = require("../constants/subscription");

// ==========================
// Is Guest?
// ==========================
const isGuest = (user) => {
  return !user;
};

// ==========================
// Is Unlimited Plan?
// ==========================
const isUnlimited = (user) => {
  if (!user) return false;

  return (
    user.subscriptionType === SUBSCRIPTION.MONTHLY ||
    user.subscriptionType === SUBSCRIPTION.YEARLY
  );
};

// ==========================
// Is Bundle Plan?
// ==========================
const isBundle = (user) => {
  if (!user) return false;

  return user.subscriptionType === SUBSCRIPTION.BUNDLE;
};

// ==========================
// Is Subscription Expired?
// ==========================
const isExpired = (user) => {
  if (!user) return false;

  if (!isUnlimited(user)) {
    return false;
  }

  if (!user.subscriptionExpiresAt) {
    return true;
  }

  return user.subscriptionExpiresAt < new Date();
};

module.exports = {
  isGuest,
  isUnlimited,
  isBundle,
  isExpired,
};