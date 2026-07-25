const {
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const s3 = require("../config/aws");

const streamToBuffer = async (stream) => {

  const chunks = [];

  return new Promise((resolve, reject) => {

    stream.on("data", chunk => chunks.push(chunk));

    stream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    stream.on("error", reject);

  });

};

exports.getImageBuffer = async (imageKey) => {

  const response = await s3.send(

    new GetObjectCommand({

      Bucket: process.env.AWS_BUCKET_NAME,

      Key: imageKey,

    })

  );

  return await streamToBuffer(response.Body);

};