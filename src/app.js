const express = require("express");
const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");
const scanRoutes = require("./routes/scanRoutes");
const errorHandler = require("./middleware/error.middleware");
const deviceRoutes = require("./routes/device.routes");
const devRoutes = require("./routes/dev.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const purchaseRoutes = require("./routes/payment.routes");
const aiRoutes = require("./routes/ai.routes");
const rewardRoutes = require("./routes/reward.routes");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Running",
  });
});

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/device", deviceRoutes);
app.use("/api/dev", devRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/payment",purchaseRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reward", rewardRoutes);
app.use(errorHandler);

module.exports = app;