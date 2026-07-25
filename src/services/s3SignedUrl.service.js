const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = require("../config/aws");

const getImageSignedUrl = async (key) => {
  if (!key) return null;

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3, command, {
    expiresIn: 3600, // 1 hour
  });
};

module.exports = {
  getImageSignedUrl,
};