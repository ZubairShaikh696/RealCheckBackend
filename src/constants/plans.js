const PLANS = {
  MONTHLY: {
    id: "monthly",
    name: "Premium Monthly",
    amount: 700, // $7.00
    type: "subscription",
    durationDays: 30,
  },

  YEARLY: {
    id: "yearly",
    name: "Premium Yearly",
    amount: 5000, // $50.00
    type: "subscription",
    durationDays: 365,
  },

  PLAN_A: {
    id: "plan_a",
    name: "Plan A",
    amount: 500, // $5.00
    type: "bundle",
    credits: 10,
  },

  PLAN_B: {
    id: "plan_b",
    name: "Plan B",
    amount: 1500, // $15.00
    type: "bundle",
    credits: 25,
  },

  PLAN_C: {
    id: "plan_c",
    name: "Plan C",
    amount: 5000, // $50.00
    type: "bundle",
    credits: 50,
  },
};

module.exports = PLANS;