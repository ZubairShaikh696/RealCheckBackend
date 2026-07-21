const express = require("express");

const router = express.Router();

const aiController = require("../controllers/ai.controller");

const auth =
require("../middleware/auth.middleware");

router.post(
  "/explain",
  auth.protect,
  aiController.explain
);

module.exports = router;