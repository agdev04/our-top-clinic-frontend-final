import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = import.meta.env.VITE_CLOUDFLARE_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = import.meta.env.VITE_CLOUDFLARE_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = import.meta.env.VITE_CLOUDFLARE_BUCKET_NAME;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true
});

export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!file) throw new Error('No file provided');
  
  const fileName = `${folder}/${Date.now()}_${file.name}`;
  const fileBuffer = await file.arrayBuffer();

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileName,
    Body: new Uint8Array(fileBuffer),
    ContentType: file.type,
    ACL: 'public-read',
    Metadata: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, HEAD',
      'Access-Control-Allow-Headers': 'Origin, Content-Type'
    }
  });

  try {
    await s3.send(command);
    return `https://pub-b754f12dbd2a4edabb2e2ee2ac862e59.r2.dev/${fileName}`;
  } catch (error) {
    console.error('Error uploading file to R2:', error);
    throw error;
  }
}