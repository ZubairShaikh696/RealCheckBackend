const Device = require("../models/Device");

const registerDevice = async (req, res) => {
  try {
    const {
      device_id,
      device_name,
      platform,
      os_version,
      app_version,
      build_number
  } = req.body;

  if (
    !device_id
) {
    return res.status(400).json({
        success: false,
        message: "Required fields are missing"
    });
}

    if (!device_id || !platform) {
      return res.status(400).json({
        success: false,
        message: "device_id and platform are required",
      });
    }

    let device = await Device.findOne({ device_id });

    if (device) {
      device.lastActiveAt = new Date();
      device.appVersion = app_version;
      device.buildNumber = build_number;

      await device.save();

      return res.status(200).json({
        success: true,
        message: "Device already registered",
        data: device,
      });
    }

    device = await Device.create({
      device_id,
      platform,
      app_version,
      build_number,
      os_version,
      device_name
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