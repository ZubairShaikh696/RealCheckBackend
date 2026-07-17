const express = require("express");

const router = express.Router();

const paymentController =
require("../controllers/payment.controller");

const auth =
require("../middleware/auth.middleware");

router.post(
    "/create-payment-intent",
    auth.protect,
    paymentController.createPaymentIntent
);

router.post(
  "/confirm",
  auth.protect,
  paymentController.confirmPayment
);

module.exports = router;