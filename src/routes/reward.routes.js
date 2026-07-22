const express = require("express");

const router = express.Router();

const rewardController = require("../controllers/reward.controller");

const auth = require("../middleware/auth.middleware");

router.post(
  "/ad",
  auth.optionalAuth,
  rewardController.rewardAd
);

module.exports = router;