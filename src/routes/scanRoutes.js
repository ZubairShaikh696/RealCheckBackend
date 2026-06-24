const express = require("express");
const router = express.Router();

const { scanUrl } = require("../controllers/scanController");

router.post("/", scanUrl);

module.exports = router;