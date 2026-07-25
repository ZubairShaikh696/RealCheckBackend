const express = require("express");

const router = express.Router();

const {
  scanUrl,
  reanalyzeUrl,
  getHistory,
  deleteHistory,
  scanImage,
} = require("../controllers/scanController");

const {
  optionalAuth,
  protect,
} = require("../middleware/auth.middleware");

// Scan
router.post("/", optionalAuth, scanUrl);

// image scan route
router.post("/image", optionalAuth, scanImage);

// Reanalyze
router.post("/reanalyze", protect, reanalyzeUrl);

// History
router.get("/history", optionalAuth, getHistory);

// Delete History
router.delete("/history/:id", optionalAuth, deleteHistory);

module.exports = router;