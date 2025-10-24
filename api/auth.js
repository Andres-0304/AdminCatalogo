const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Usuario autorizado
const AUTHORIZED_USER = {
  email: 'entretablas@gmail.com',
  passwordHash: '$2a$10$EJ0aEK42cZqgDIRUOpX1yeGqwVND8k/nTCJ.IXjEmw0YT.1WeFvu6' // Hash de 'DFY@H6SFquXhBYJ'
};

// Generar hash de contraseña (usar solo para generar el hash inicial)
async function generatePasswordHash() {
  const password = 'DFY@H6SFquXhBYJ';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash generado:', hash);
  return hash;
}

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

  // Log de debug para verificar variables de entorno
  console.log('JWT_SECRET configurado:', process.env.JWT_SECRET ? 'SÍ' : 'NO');
  console.log('Variables de entorno disponibles:', Object.keys(process.env).filter(key => key.includes('JWT') || key.includes('R2')));

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body;
    
    // Logs de debug
    console.log('Intento de login:', { email, password: password ? '***' : 'undefined' });
    console.log('Usuario autorizado:', AUTHORIZED_USER.email);

    // Validar datos de entrada
    if (!email || !password) {
      console.log('Error: Email o contraseña faltantes');
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
    }

    // Verificar email
    console.log('Email recibido:', email);
    console.log('Email esperado:', AUTHORIZED_USER.email);
    console.log('Emails coinciden:', email === AUTHORIZED_USER.email);
    
    if (email !== AUTHORIZED_USER.email) {
      console.log('Error: Email no coincide');
      return res.status(401).json({
        success: false,
        error: 'Email incorrecto'
      });
    }

    // Verificar contraseña
    console.log('Verificando contraseña...');
    console.log('Contraseña recibida:', password);
    console.log('Hash almacenado:', AUTHORIZED_USER.passwordHash);
    
    const isValidPassword = await bcrypt.compare(password, AUTHORIZED_USER.passwordHash);
    console.log('Resultado de verificación de contraseña:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Error: Contraseña no coincide');
      return res.status(401).json({
        success: false,
        error: 'Contraseña incorrecta'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        email: AUTHORIZED_USER.email,
        userId: 'admin_user'
      },
      process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
      { expiresIn: '24h' }
    );

    // Respuesta exitosa
    console.log('Login exitoso para:', AUTHORIZED_USER.email);
    return res.status(200).json({
      success: true,
      token: token,
      user: {
        email: AUTHORIZED_USER.email,
        role: 'admin'
      },
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};
