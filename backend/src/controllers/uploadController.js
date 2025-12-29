const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3 } = require("../config/s3");
const { randomUUID } = require("crypto");
const path = require("path");

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav'];

const fileUpload = async (req, res) => {
   try {
      const { file } = req;
      if (!file) {
         console.log("No file uploaded");
         return res.status(400).json({ message: "No file uploaded" });
      }

      if (file.size > MAX_FILE_SIZE) {
         console.log("File size exceeds limit");
         return res.status(400).json({ message: "File size exceeds limit" });
      }

      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
         console.log("File type not allowed");
         return res.status(400).json({ message: "File type not allowed" });
      }

      const fileExtension = path.extname(file.originalname);
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const randomId = randomUUID();
      const fileKey = `uploads/${year}/${month}/${randomId}${fileExtension}`;

      const command = new PutObjectCommand({
         Bucket: process.env.SUPABASE_BUCKET,
         Key: fileKey,
         Body: file.buffer,
         ContentType: file.mimetype,
      });
      const response = await s3.send(command);
      return res.status(200).json({ message: "File uploaded successfully", response, path: fileKey });
   } catch (error) {
      console.error("Error uploading file:", error);
      return res.status(500).json({ message: "Failed to upload file" });
   }
};

exports.fileUpload = fileUpload;

/*
v -- tip: ⚙️  suppress all logs with { quiet: true }
User connected: pEMtUtnx20CUoGd6AAAB UserID: cbf9900e-f9eb-49ce-8b39-3491d1c41d3d
{
  fieldname: 'file',
  originalname: 'pexels-pealdesign-13138870.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg'
} file*******
{
  fieldname: 'file',
  originalname: 'pexels-pealdesign-13138870.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  buffer: <Buffer ff d8 ff e0 00 10 4a 46 49 46 00 01 01 01 00 48 00 48 00 00 ff e2 0c 58 49 43 43 5f 50 52 4f 46 49 4c 45 00 01 01 00 00 0c 48 4c 69 6e 6f 02 10 00 00 ... 66177 more bytes>,
  size: 66227
} file
POST /upload/upload 200 651.919 ms - 221
*/

//  _remoteAddress: '::1',
//   body: {
//     file: {
//       path: './pexels-pealdesign-13138870.jpg',
//       relativePath: './pexels-pealdesign-13138870.jpg'
//     }
//   },
//   _body: true,
//   length: undefined,
//   _eventsCount: 0,