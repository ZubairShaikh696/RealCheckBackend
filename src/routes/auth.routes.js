const express = require("express");

const router = express.Router();

const {
  register,
  login,
  refreshToken,
  logout,
  changePassword,
  googleLogin
} = require("../controllers/auth.controller");

const { protect } = require("../middleware/auth.middleware");
const { auth } = require("google-auth-library");

router.post("/register", register);

router.post("/login", login);

router.post("/google", googleLogin);

router.post("/change-password", protect, changePassword);

router.post("/refresh-token", refreshToken);

router.post("/logout", logout);

module.exports = router;