const sendResponse = (res, statusCode, data, message = "Success") => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

module.exports = sendResponse;