const stripe = require("../config/stripe");
const PLANS = require("../constants/plans");
const User = require("../models/user.model");
const { getAccountInfo } = require("../helpers/subscription.helper");
const Payment = require("../models/payment.model");

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

    const paymentIntent = await stripe.paymentIntents.create({
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
    // Save Pending Payment
    const payment = await Payment.create({
  user: req.user._id,
  paymentIntentId: paymentIntent.id,
  planId: plan.id,
  planName: plan.name,
  planType: plan.type,
  amount: plan.amount / 100,
  currency: "USD",
  status: "pending",
});

    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
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

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "paymentIntentId is required",
      });
    }

    const paymentIntent =
      await stripe.paymentIntents.retrieve(paymentIntentId);

    //------------------------------------------------------

    if (paymentIntent.status !== "succeeded") {

      await Payment.findOneAndUpdate(
        {
          paymentIntentId,
        },
        {
          status: "failed",
          transactionId: paymentIntent.id,
          stripeResponse: paymentIntent,
        }
      );

      return res.status(400).json({
        success: false,
        message: "Payment not completed.",
      });
    }

    //------------------------------------------------------

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

    //------------------------------------------------------
    // Subscription
    //------------------------------------------------------

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

    //------------------------------------------------------
    // Bundle
    //------------------------------------------------------

    if (plan.type === "bundle") {

      user.subscriptionType = "bundle";
      user.hasPremium = true;
      user.planName = plan.name;
      user.subscriptionExpiresAt = null;

      user.bundleCredits =
        (user.bundleCredits || 0) + plan.credits;
    }

    await user.save();

    //------------------------------------------------------
    // Update Payment History
    //------------------------------------------------------
    await Payment.findOneAndUpdate(
      {
        paymentIntentId,
      },
      {
        status: "paid",
        transactionId: paymentIntent.id,
        stripeResponse: paymentIntent,
      }
    );

    //------------------------------------------------------

    const account = getAccountInfo(user);

    return res.json({
      success: true,
      message: "Payment successful.",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,

        hasPremium: account.hasPremium,
        planType: account.planType,
        planName: account.planName,
        expiryDate: account.expiryDate,
        credits: account.remainingCredits,
      },
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Unable to confirm payment.",
    });

  }
};

exports.getPaymentHistory = async (req, res) => {
  try {

    const page = Number(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;

    const total = await Payment.countDocuments({
      user: req.user._id,
    });

    const payments = await Payment.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-stripeResponse");

    return res.json({
      success: true,
      page,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
      data: payments,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch payment history.",
    });

  }
};
