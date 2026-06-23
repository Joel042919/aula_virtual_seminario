import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
export const R2_PUBLIC_CUSTOM_DOMAIN = process.env.R2_PUBLIC_CUSTOM_DOMAIN;

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
});

export async function getUploadPresignedUrl(filename: string, contentType: string) {
  if (!R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME no configurado");

  // Generamos una clave única para evitar sobreescribir archivos con el mismo nombre
  const key = `${Date.now()}-${Math.random().toString(36).substring(7)}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  // La firma expirará en 300 segundos (5 minutos)
  const url = await getSignedUrl(r2Client, command, { expiresIn: 300 });

  return { url, key };
}

export async function getDownloadPresignedUrl(key: string) {
  // Solo usar R2_PUBLIC_CUSTOM_DOMAIN si es un dominio público real (no el endpoint de API)
  if (R2_PUBLIC_CUSTOM_DOMAIN && !R2_PUBLIC_CUSTOM_DOMAIN.includes('.r2.cloudflarestorage.com')) {
    return `${R2_PUBLIC_CUSTOM_DOMAIN}/${key}`;
  }

  if (!R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME no configurado");

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
  return url;
}

export async function deleteR2File(key: string) {
  if (!R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME no configurado");
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });
  await r2Client.send(command);
  return { success: true };
}
