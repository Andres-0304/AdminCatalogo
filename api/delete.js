const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Configuración de Cloudflare R2
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
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

  // Validar que las credenciales estén configuradas
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.error('Credenciales de R2 no configuradas');
    return res.status(500).json({ 
      success: false, 
      error: 'Configuración de servidor incompleta' 
    });
  }

  try {
    const { url } = req.body;
    
    console.log('Solicitud de eliminación recibida:', { url, body: req.body });

    if (!url) {
      return res.status(400).json({ success: false, error: 'Missing file URL' });
    }

    // Extraer la clave del archivo de la URL
    let key;
    
    // Diferentes formatos de URL que podemos recibir
    if (url.includes('pub-8abbc2a107f14bacaecfca417d47cfb3.r2.dev')) {
      // URL nueva: https://pub-8abbc2a107f14bacaecfca417d47cfb3.r2.dev/images/filename
      key = url.split('pub-8abbc2a107f14bacaecfca417d47cfb3.r2.dev/')[1];
    } else if (url.includes('14260027a130bb3910678a34f010dcb7.r2.cloudflarestorage.com')) {
      // URL antigua: https://14260027a130bb3910678a34f010dcb7.r2.cloudflarestorage.com/bucket/images/filename
      key = url.split('servilletas-navidenas/')[1];
    } else if (url.includes('pub-servilletas-navidenas.r2.dev')) {
      // URL alternativa: https://pub-servilletas-navidenas.r2.dev/images/filename
      key = url.split('pub-servilletas-navidenas.r2.dev/')[1];
    } else {
      // Fallback: tomar las últimas 2 partes de la URL
      key = url.split('/').slice(-2).join('/');
    }
    
    console.log('URL original:', url);
    console.log('Clave extraída:', key);

    const deleteParams = {
      Bucket: R2_BUCKET_NAME,
      Key: key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);

    console.log('Archivo eliminado exitosamente de R2:', key);

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error eliminando archivo de R2:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
