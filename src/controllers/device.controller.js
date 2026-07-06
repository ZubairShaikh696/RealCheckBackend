const Device = require("../models/Device");

const registerDevice = async (req, res) => {
  try {
    const {
      device_id,
      device_name,
      platform,
      os_version,
      app_version,
      build_number,
    } = req.body;

    if (!device_id || !platform) {
      return res.status(400).json({
        success: false,
        message: "device_id and platform are required",
      });
    }

    let device = await Device.findOne({ device_id });

    if (device) {
      device.device_name = device_name;
      device.platform = platform;
      device.os_version = os_version;
      device.app_version = app_version;
      device.build_number = build_number;
      device.lastActiveAt = new Date();

      await device.save();

      return res.status(200).json({
        success: true,
        message: "Device already registered",
        data: device,
      });
    }

    device = await Device.create({
      device_id,
      device_name,
      platform,
      os_version,
      app_version,
      build_number,
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