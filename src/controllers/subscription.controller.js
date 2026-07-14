const User = require("../models/user.model");
const SUBSCRIPTION = require("../constants/subscription");
const asyncHandler = require("../middleware/async.middleware");
const { getAccountInfo } = require("../helpers/subscription.helper");

// =======================================
// Purchase Subscription (Temporary)
// =======================================

exports.purchasePlan = asyncHandler(async (req, res) => {
  const { plan } = req.body;

  const user = await User.findById(req.user._id);
  // console.log("user",user)
  // console.log("req.user.userId",req.user)
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  switch (plan) {

    // =======================
    // Monthly
    // =======================
    case "monthly":
      user.subscriptionType = SUBSCRIPTION.MONTHLY;
      user.planName = "Premium Monthly";
      user.hasPremium = true;
      user.subscriptionExpiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );
      user.bundleCredits = 0;
      break;

    // =======================
    // Yearly
    // =======================
    case "yearly":
      user.subscriptionType = SUBSCRIPTION.YEARLY;
      user.planName = "Premium Yearly";
      user.hasPremium = true;
      user.subscriptionExpiresAt = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      );
      user.bundleCredits = 0;
      break;

    // =======================
    // Plan A
    // =======================
    case "planA":
      user.subscriptionType = SUBSCRIPTION.BUNDLE;
      user.planName = "Plan A";
      user.hasPremium = true;
      user.subscriptionExpiresAt = null;
      user.bundleCredits += 10;
      break;

    // =======================
    // Plan B
    // =======================
    case "planB":
      user.subscriptionType = SUBSCRIPTION.BUNDLE;
      user.planName = "Plan B";
      user.hasPremium = true;
      user.subscriptionExpiresAt = null;
      user.bundleCredits += 25;
      break;

    // =======================
    // Plan C
    // =======================
    case "planC":
      user.subscriptionType = SUBSCRIPTION.BUNDLE;
      user.planName = "Plan C";
      user.hasPremium = true;
      user.subscriptionExpiresAt = null;
      user.bundleCredits += 50;
      break;

    default:
      return res.status(400).json({
        success: false,
        message: "Invalid plan",
      });
  }

  await user.save();

  const account = getAccountInfo(user);

  res.json({
    success: true,
    message: "Plan purchased successfully.",
    account,
  });
});