const express = require("express");
const userRoutes = require("./routes/user.routes");
const errorHandler = require("./middleware/error.middleware");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Running",
  });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

// Error middleware (LAST)
app.use(errorHandler);

module.exports = app;