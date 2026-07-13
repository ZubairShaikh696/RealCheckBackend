const jwt = require("jsonwebtoken");

const Device = require("../models/Device");
const User = require("../models/user.model");

exports.updateCredits = async (req, res) => {
  try {
    const { credits } = req.body;

    if (credits === undefined) {
      return res.status(400).json({
        success: false,
        message: "credits is required",
      });
    }

    // ==========================
    // DEVICE
    // ==========================

    const device_id =
      req.headers["x-device-id"] || req.body.device_id;

    if (device_id) {
      const device = await Device.findOne({ device_id });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Device not found",
        });
      }

      device.freeCredits = Number(credits);

      await device.save();

      return res.status(200).json({
        success: true,
        type: "device",
        freeCredits: device.freeCredits,
      });
    }

    // ==========================
    // USER
    // ==========================

    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      let decoded;

      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        decoded = jwt.verify(token, process.env.REFRESH_SECRET);
      }

      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.bundleCredits = Number(credits);

      await user.save();

      return res.status(200).json({
        success: true,
        type: "user",
        credits: user.bundleCredits,
      });
    }

    return res.status(400).json({
      success: false,
      message:
        "Provide x-device-id header or Authorization token",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};