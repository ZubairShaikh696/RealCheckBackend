const User = require("../models/user.model");
const asyncHandler = require("../middleware/async.middleware");
const sendResponse = require("../utils/apiResponse");

// CREATE USER
exports.createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);

  sendResponse(res, 201, user, "User created");
});

// GET ALL USERS
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find();

  sendResponse(res, 200, users);
});

// GET USER BY ID
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  sendResponse(res, 200, user);
});

// UPDATE USER
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  sendResponse(res, 200, user, "User updated");
});

// DELETE USER
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  sendResponse(res, 200, null, "User deleted");
});