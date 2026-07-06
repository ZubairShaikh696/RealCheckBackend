const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Device = require("../models/Device");
const User = require("../models/user.model");
const ScanHistory = require("../models/ScanHistory");
const asyncHandler = require("../middleware/async.middleware");

// =========================
// REGISTER
// =========================
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, device_id } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "Email already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" }
  );

// Save refresh token in DB
user.refreshToken = refreshToken;
await user.save();
// Link device with logged-in/registered user and merge guest history
if (device_id) {
  const device = await Device.findOne({ device_id });

  if (device) {
    device.user = user._id;
    await device.save();
  }

  await ScanHistory.updateMany(
    {
      device_id,
      user: null,
    },
    {
      $set: {
        user: user._id,
      },
    }
  );
}
  // Merge guest history into registered user
  if (device_id) {
    await ScanHistory.updateMany(
      {
        device_id,
        user: null,
      },
      {
        $set: {
          user: user._id,
        },
      }
    );
  }

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

// =========================
// LOGIN
// =========================
exports.login = asyncHandler(async (req, res) => {
  const { email, password, device_id } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const isMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" }
  );

// Save refresh token in DB
user.refreshToken = refreshToken;
await user.save();
// Link device with logged-in/registered user and merge guest history
if (device_id) {
  const device = await Device.findOne({ device_id });

  if (device) {
    device.user = user._id;
    await device.save();
  }

  await ScanHistory.updateMany(
    {
      device_id,
      user: null,
    },
    {
      $set: {
        user: user._id,
      },
    }
  );
}
  // Merge guest history into logged-in user
  if (device_id) {
    await ScanHistory.updateMany(
      {
        device_id,
        user: null,
      },
      {
        $set: {
          user: user._id,
        },
      }
    );
  }

  return res.status(200).json({
    success: true,
    message: "Login successful",
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  const decoded = jwt.verify(
    refreshToken,
    process.env.REFRESH_SECRET
  );

  const user = await User.findById(decoded.userId);

  if (!user || user.refreshToken !== refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }

  const accessToken = jwt.sign(
    {
      userId: user._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );

  return res.status(200).json({
    success: true,
    accessToken,
  });
});

exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  const decoded = jwt.verify(
    refreshToken,
    process.env.REFRESH_SECRET
  );

  const user = await User.findById(decoded.userId);

  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});