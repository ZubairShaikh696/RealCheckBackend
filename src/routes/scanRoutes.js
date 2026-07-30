const express = require("express");

const router = express.Router();

const {
  scanUrl,
  reanalyzeUrl,
  getHistory,
  deleteHistory,
  scanImage,
  toggleFavorite,
  getFavoriteHistory
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
router.get("/history", protect, getHistory);

// Delete History
router.delete("/history/:id", protect, deleteHistory);

// favorite
router.patch(
  "/history/:historyId/favorite",
  protect,
  toggleFavorite
);
router.get(
  "/history/favorites",
  protect,
  getFavoriteHistory
);

module.exports = router;