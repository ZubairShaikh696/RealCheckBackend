const express = require("express");

const router = express.Router();

const {
  updateCredits,
} = require("../controllers/dev.controller");

router.post("/credits", updateCredits);

module.exports = router;