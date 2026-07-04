const Device = require("../models/Device");

const registerDevice = async (req, res) => {
  try {
    const {
      deviceId,
      platform,
      appVersion,
      buildNumber,
    } = req.body;

    if (!deviceId || !platform) {
      return res.status(400).json({
        success: false,
        message: "deviceId and platform are required",
      });
    }

    let device = await Device.findOne({ deviceId });

    if (device) {
      device.lastActiveAt = new Date();
      device.appVersion = appVersion;
      device.buildNumber = buildNumber;

      await device.save();

      return res.status(200).json({
        success: true,
        message: "Device already registered",
        data: device,
      });
    }

    device = await Device.create({
      deviceId,
      platform,
      appVersion,
      buildNumber,
    });

    return res.status(201).json({
      success: true,
      message: "Device registered successfully",
      data: device,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });

  }
};

module.exports = {
  registerDevice,
};