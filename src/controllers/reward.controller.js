const Device = require("../models/Device");
const User = require("../models/user.model");
const { getAccountInfo } = require("../helpers/subscription.helper");

const DAILY_LIMIT = 5;

exports.rewardAd = async (req, res) => {
  try {

    const deviceId = req.headers["x-device-id"];

    let user = req.user || null;

    let device = null;

    if (deviceId) {
      device = await Device.findOne({
        device_id: deviceId,
      });
    }

    // ------------------------
    // Logged in user
    // ------------------------

    if (user) {

      user = await User.findById(user._id);

      // Unlimited subscription
      if (
        user.subscriptionType === "monthly" ||
        user.subscriptionType === "yearly"
      ) {
        return res.status(400).json({
          success: false,
          message: "Premium users already have unlimited scans.",
        });
      }

      const today = new Date().toDateString();

      if (
        user.lastRewardAt &&
        user.lastRewardAt.toDateString() !== today
      ) {
        user.rewardToday = 0;
      }

      if (user.rewardToday >= DAILY_LIMIT) {
        return res.status(400).json({
          success: false,
          message: "Daily reward limit reached.",
        });
      }

      user.rewardToday += 1;
      user.lastRewardAt = new Date();

      user.bundleCredits += 1;

      if (user.subscriptionType === "free") {

        user.subscriptionType = "bundle";

        user.planName = "Reward Credits";
      }

      await user.save();

      return res.json({
        success: true,
        message: "Reward granted.",
        account: getAccountInfo(user, device),
      });

    }

    // ------------------------
    // Guest
    // ------------------------

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found.",
      });
    }

    const today = new Date().toDateString();

    if (
      device.lastRewardAt &&
      device.lastRewardAt.toDateString() !== today
    ) {
      device.rewardToday = 0;
    }

    if (device.rewardToday >= DAILY_LIMIT) {
      return res.status(400).json({
        success: false,
        message: "Daily reward limit reached.",
      });
    }

    device.rewardToday += 1;
    device.lastRewardAt = new Date();

    device.freeCredits += 1;

    await device.save();

    return res.json({
      success: true,
      message: "Reward granted.",
      account: getAccountInfo(null, device),
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Unable to grant reward.",
    });

  }
};