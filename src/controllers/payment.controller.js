const stripe = require("../config/stripe");
const PLANS = require("../constants/plans");
const User = require("../models/user.model");

exports.createPaymentIntent = async (req, res) => {
  try {

    const { planId } = req.body;

    const plan = Object.values(PLANS).find(
      (item) => item.id === planId
    );

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan.",
      });
    }

    const paymentIntent =
      await stripe.paymentIntents.create({
        amount: plan.amount,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },

        metadata: {
          userId: req.user._id.toString(),
          planId: plan.id,
        },
      });

    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: plan.amount,
      planName: plan.name,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment.",
    });

  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    console.log("req.paymentIntentId",paymentIntentId)
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "paymentIntentId is required",
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId
    );
    console.log(paymentIntent);
    console.log(paymentIntent.status);
console.log(paymentIntent.metadata);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed.",
      });
    }

    const planId = paymentIntent.metadata.planId;

    const plan = Object.values(PLANS).find(
      (item) => item.id === planId
    );

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ==========================
    // Monthly / Yearly
    // ==========================

    if (plan.type === "subscription") {

      user.subscriptionType = plan.id;

      user.hasPremium = true;

      user.planName = plan.name;

      const expiry = new Date();

      expiry.setDate(
        expiry.getDate() + plan.durationDays
      );

      user.subscriptionExpiresAt = expiry;

      user.bundleCredits = 0;
    }

    // ==========================
    // Bundle
    // ==========================

    if (plan.type === "bundle") {

      user.subscriptionType = "bundle";

      user.hasPremium = true;

      user.planName = plan.name;

      user.subscriptionExpiresAt = null;

      user.bundleCredits =
        (user.bundleCredits || 0) + plan.credits;
    }

    await user.save();

    return res.json({
      success: true,
      message: "Payment successful.",
      user,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Unable to confirm payment.",
    });

  }
};