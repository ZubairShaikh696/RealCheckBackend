const {
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

const s3 = require("../config/aws");

const crypto = require("crypto");

exports.uploadImage = async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required.",
      });
    }

    const fileName =
  `${Date.now()}-${crypto.randomUUID()}.jpg`;

await s3.send(
  new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  })
);

const imageUrl =
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

return res.json({
  success: true,
  imageKey: fileName,
  imageUrl,
});

  } catch (error) {
console.log("AWS Upload Error:", error);
  console.log("Error Message:", error.message);
  console.log("Stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: "Upload failed.",
    });

  }
};