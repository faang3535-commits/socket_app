const { DeleteObjectsCommand, S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config();

const s3 = new S3Client({
  region: process.env.SUPABASE_S3_REGION,
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY,
    secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY,
  },
  forcePathStyle: true
})

const deleteFilesFromS3 = async (fileKeys) => {
  const command = new DeleteObjectsCommand({
    Bucket: process.env.SUPABASE_BUCKET,
    Delete: {
      Objects: fileKeys.map(key => ({ Key: key })),
    },
  });
  return s3.send(command);
};
module.exports = { s3, deleteFilesFromS3 }; 