const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Device = require("../models/Device");
const User = require("../models/user.model");
const ScanHistory = require("../models/ScanHistory");
const asyncHandler = require("../middleware/async.middleware");
const { getAccountInfo } = require("../helpers/subscription.helper");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// =========================
// REGISTER
// =========================
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

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

  const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" },
  );

  // Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  const account = getAccountInfo(user);
  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,

      hasPremium: account.hasPremium,
      planType: account.planType,
      planName: account.planName,
      expiryDate: account.expiryDate,
      credits: account.remainingCredits,
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
  if (user.provider === "google") {
    return res.status(400).json({
      success: false,

      message: "Please continue with Google.",
    });
  }
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" },
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
  }
  // =======================================================
  // Merge guest history into logged-in user
  // =======================================================

  if (device_id) {
    const guestHistory = await ScanHistory.find({
      device_id,
      user: null,
    });

    for (const guest of guestHistory) {
      const existingHistory = await ScanHistory.findOne({
        user: user._id,
        normalizedUrl: guest.normalizedUrl,
      });

      if (existingHistory) {
        // Merge counts
        existingHistory.scanCount += guest.scanCount;

        // Keep latest viewed date
        if (guest.lastViewedAt > existingHistory.lastViewedAt) {
          existingHistory.lastViewedAt = guest.lastViewedAt;
        }

        // Keep latest scan reference
        existingHistory.scan = guest.scan;
        existingHistory.result = guest.result;
        existingHistory.originalUrl = guest.originalUrl;

        await existingHistory.save();

        // Remove guest duplicate
        await guest.deleteOne();
      } else {
        // Transfer ownership
        guest.user = user._id;
        guest.device_id = null;

        await guest.save();
      }
    }
  }
  const account = getAccountInfo(user);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,

      hasPremium: account.hasPremium,
      planType: account.planType,
      planName: account.planName,
      expiryDate: account.expiryDate,
      credits: account.remainingCredits,
    },
  });
});

// =========================
// Google Login
// =========================
exports.googleLogin = asyncHandler(async (req, res) => {
  const { idToken, device_id } = req.body;

  if (!idToken) {
    return res.status(400).json({
      success: false,

      message: "idToken required",
    });
  }

  const ticket = await client.verifyIdToken({
    idToken,

    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  const email = payload.email;

  const name = payload.name;

  const picture = payload.picture;

  const googleId = payload.sub;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,

      email,

      googleId,

      avatar: picture,

      provider: "google",

      password: null,
    });
  }

  const accessToken = jwt.sign(
    { userId: user._id },

    process.env.JWT_SECRET,

    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    { userId: user._id },

    process.env.REFRESH_SECRET,

    { expiresIn: "7d" },
  );

  user.refreshToken = refreshToken;

  await user.save();

  if (device_id) {
    const device = await Device.findOne({
      device_id,
    });

    if (device) {
      device.user = user._id;

      await device.save();
    }
  }

  const account = getAccountInfo(user);

  return res.json({
    success: true,

    accessToken,

    refreshToken,

    user: {
      id: user._id,

      name: user.name,

      email: user.email,

      hasPremium: account.hasPremium,

      planType: account.planType,

      planName: account.planName,

      expiryDate: account.expiryDate,

      credits: account.remainingCredits,
    },
  });
});
// =========================
// CHANGE PASSWORD
// =========================
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Current password and new password are required.",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters.",
    });
  }

  const user = await User.findById(req.user._id);

  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: "Current password is incorrect.",
    });
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    return res.status(400).json({
      success: false,
      message: "New password must be different from current password.",
    });
  }

  user.password = await bcrypt.hash(newPassword, 10);

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password changed successfully.",
  });
});

// =========================
// Refresh token
// =========================
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

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
    },
  );

  return res.status(200).json({
    success: true,
    accessToken,
  });
});

// =========================
// Logout
// =========================
exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

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
