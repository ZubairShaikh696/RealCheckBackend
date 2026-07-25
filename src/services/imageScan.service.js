const {
    S3Client,
    GetObjectCommand,
} = require("@aws-sdk/client-s3");

const s3 = new S3Client({
    region: process.env.AWS_REGION,

    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,

        secretAccessKey:
            process.env.AWS_SECRET_KEY,
    },
});

async function streamToBuffer(stream) {
    const chunks = [];

    for await (const chunk of stream) {
        chunks.push(chunk);
    }

    return Buffer.concat(chunks);
}

exports.getImageBase64 = async (imageKey) => {

    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,

        Key: imageKey,
    });

    const response =
        await s3.send(command);

    const buffer =
        await streamToBuffer(response.Body);

    return buffer.toString("base64");
};