const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const {
  purchasePlan,
} = require("../controllers/subscription.controller");

router.post("/purchase", auth.protect, purchasePlan);

module.exports = router;