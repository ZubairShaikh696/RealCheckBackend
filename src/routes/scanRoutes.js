const express = require("express");

const router = express.Router();

const {
  scanUrl,
  reanalyzeUrl,
  getHistory,
  deleteHistory,
} = require("../controllers/scanController");

const {
  optionalAuth,
  protect,
} = require("../middleware/auth.middleware");

// Scan
router.post("/", optionalAuth, scanUrl);

// Reanalyze
router.post("/reanalyze", protect, reanalyzeUrl);

// History
router.get("/history", optionalAuth, getHistory);

// Delete History
router.delete("/history/:id", optionalAuth, deleteHistory);

module.exports = router;