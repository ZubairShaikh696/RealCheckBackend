const router = require("express").Router();

const upload = require("../middleware/upload.middleware");

// const authMiddleware = require("../middlewares/auth.middleware");

const uploadController = require("../controllers/upload.controller");
const auth = require("../middleware/auth.middleware");

router.post(
  "/image",
  auth.protect,
  upload.single("image"),
  uploadController.uploadImage
);

module.exports = router;