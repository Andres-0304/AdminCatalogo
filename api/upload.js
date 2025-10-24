const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

// Configuración de Cloudflare R2
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || 'c60c478cd5b8bf04641f5c466cb3f793';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '449553cc789b51ec983221c316d9ec6e3f89f9dcfd4cba8e5fa62ad031c70281';
const R2_ENDPOINT = process.env.R2_ENDPOINT || 'https://14260027a130bb3910678a34f010dcb7.r2.cloudflarestorage.com';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'servilletas-navidenas';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // Log para debugging
  console.log('Upload function called:', req.method, req.url);

  try {
    const { fileData, fileName, contentType } = req.body;

    if (!fileData || !fileName || !contentType) {
      return res.status(400).json({ success: false, error: 'Missing file data, file name, or content type' });
    }

    // Generar nombre único para el archivo
    const uniqueFileName = `${Date.now()}-${uuidv4()}-${fileName}`;
    const key = `images/${uniqueFileName}`;

    // Convertir base64 a buffer preservando integridad exacta
    const fileBuffer = Buffer.from(fileData, 'base64');
    
    console.log('Procesando archivo en Vercel Function:');
    console.log('- Tamaño base64 recibido:', fileData.length, 'caracteres');
    console.log('- Tamaño buffer generado:', fileBuffer.length, 'bytes');
    console.log('- Verificación de integridad:', fileBuffer.length > 0 ? '✅ OK' : '❌ PROBLEMA');

    // Parámetros para subir a R2 preservando archivo exactamente como está
    const uploadParams = {
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType || 'application/octet-stream',
      ACL: 'public-read',
      CacheControl: 'max-age=31536000', // Cache por 1 año
      ContentEncoding: 'identity', // Sin compresión automática
      Metadata: {
        'original-filename': fileName,
        'upload-timestamp': new Date().toISOString(),
        'preserve-quality': 'true',
        'original-size': fileBuffer.length.toString(),
        'no-compression': 'true'
      }
    };

    // Subir archivo a R2
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // URL pública del archivo
    const publicUrl = `https://pub-8abbc2a107f14bacaecfca417d47cfb3.r2.dev/${key}`;

    console.log('Archivo subido exitosamente a R2:', publicUrl);
    console.log('Detalles del archivo:');
    console.log('- Nombre:', fileName);
    console.log('- Tamaño:', fileBuffer.length, 'bytes');
    console.log('- Tipo:', contentType);
    console.log('- Clave:', key);

    return res.status(200).json({
      success: true,
      url: publicUrl,
      key: key,
      fileSize: fileBuffer.length,
      contentType: contentType,
      originalName: fileName
    });
  } catch (error) {
    console.error('Error subiendo archivo a R2:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
