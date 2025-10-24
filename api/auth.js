const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Usuario autorizado
const AUTHORIZED_USER = {
  email: 'entretablas@gmail.com',
  passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // Hash de 'DFY@H6SFquXhBYJ'
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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validar datos de entrada
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
    }

    // Verificar email
    if (email !== AUTHORIZED_USER.email) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, AUTHORIZED_USER.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
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
