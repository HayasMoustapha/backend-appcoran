import fs from 'fs';
import path from 'path';
import env from '../config/env.js';

async function loadS3() {
  const [{ S3Client }, { Upload }] = await Promise.all([
    import('@aws-sdk/client-s3'),
    import('@aws-sdk/lib-storage')
  ]);
  return { S3Client, Upload };
}

async function getS3Client() {
  if (!env.spacesEndpoint || !env.spacesRegion || !env.spacesAccessKeyId || !env.spacesSecretAccessKey) {
    throw new Error('Spaces credentials are missing');
  }
  const { S3Client } = await loadS3();
  return new S3Client({
    region: env.spacesRegion,
    endpoint: env.spacesEndpoint,
    forcePathStyle: false,
    credentials: {
      accessKeyId: env.spacesAccessKeyId,
      secretAccessKey: env.spacesSecretAccessKey
    }
  });
}

export async function uploadFileToSpaces({ filePath, key, contentType }) {
  if (!env.spacesEnabled) {
    return null;
  }
  if (!env.spacesBucket) {
    throw new Error('SPACES_BUCKET is missing');
  }
  const client = await getS3Client();
  const stream = fs.createReadStream(filePath);
  const { Upload } = await loadS3();
  const upload = new Upload({
    client,
    params: {
      Bucket: env.spacesBucket,
      Key: key,
      Body: stream,
      ContentType: contentType,
      ACL: 'public-read'
    }
  });
  await upload.done();

  const baseUrl = env.spacesPublicBaseUrl
    ? env.spacesPublicBaseUrl.replace(/\/+$/, '')
    : `${env.spacesEndpoint?.replace(/^https?:\/\//, '')}/${env.spacesBucket}`;
  const url = env.spacesPublicBaseUrl
    ? `${baseUrl}/${key}`
    : `https://${baseUrl}/${key}`;
  return url;
}

export function buildSpacesKey({ audioId, filename }) {
  const safe = path.basename(filename).replace(/\s+/g, '_');
  return `audios/${audioId}/${safe}`;
}
