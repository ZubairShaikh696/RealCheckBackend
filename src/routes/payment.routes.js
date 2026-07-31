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
router.get(
  "/payment-history",
  auth.protect,
  paymentController.getPaymentHistory
);
router.post(
  "/cancel-subscription",
  auth.protect,
  paymentController.cancelSubscription
);

module.exports = router;