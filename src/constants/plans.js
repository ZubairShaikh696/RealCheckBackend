const PLANS = {
  MONTHLY: {
    id: "monthly",
    name: "Premium Monthly",
    amount: 699, // $6.99
    type: "subscription",
    durationDays: 30,
  },

  YEARLY: {
    id: "yearly",
    name: "Premium Yearly",
    amount: 4999, // $49.99
    type: "subscription",
    durationDays: 365,
  },

  PLAN_A: {
    id: "plan_a",
    name: "Plan A",
    amount: 799, // $7.99
    type: "bundle",
    credits: 10,
  },

  PLAN_B: {
    id: "plan_b",
    name: "Plan B",
    amount: 1499, // $14.99
    type: "bundle",
    credits: 25,
  },

  PLAN_C: {
    id: "plan_c",
    name: "Plan C",
    amount: 24.99, // $24.99
    type: "bundle",
    credits: 50,
  },
};

module.exports = PLANS;