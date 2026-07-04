const express = require("express");

const router = express.Router();

const {
  registerDevice,
} = require("../controllers/device.controller");

router.post("/register", registerDevice);

module.exports = router;