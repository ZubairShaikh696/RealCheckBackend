const Device = require("../models/Device");

// ========================================
// RESET FREE CREDITS (DEV ONLY)
// ========================================
const updateCredits = async (req, res) => {
  try {
    const { device_id, credits } = req.body;

    if (!device_id) {
      return res.status(400).json({
        success: false,
        message: "device_id is required",
      });
    }

    const device = await Device.findOne({ device_id });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    device.freeCredits = Number(credits ?? 3);

    await device.save();

    return res.status(200).json({
      success: true,
      message: "Credits updated successfully.",
      data: {
        device_id: device.device_id,
        freeCredits: device.freeCredits,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

module.exports = {
  updateCredits,
};