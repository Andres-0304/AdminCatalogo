// Función de prueba para diagnosticar problemas de autenticación
const bcrypt = require('bcryptjs');

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

  try {
    // Información de debug
    const debugInfo = {
      jwtSecret: process.env.JWT_SECRET ? 'Configurado' : 'No configurado',
      environmentVariables: Object.keys(process.env).filter(key => key.includes('JWT') || key.includes('R2')),
      timestamp: new Date().toISOString()
    };

    // Probar hash de contraseña
    const testPassword = 'DFY@H6SFquXhBYJ';
    const storedHash = '$2a$10$EJ0aEK42cZqgDIRUOpX1yeGqwVND8k/nTCJ.IXjEmw0YT.1WeFvu6';
    const isValidPassword = await bcrypt.compare(testPassword, storedHash);

    debugInfo.passwordTest = {
      testPassword: testPassword,
      storedHash: storedHash,
      isValid: isValidPassword
    };

    return res.status(200).json({
      success: true,
      debug: debugInfo,
      message: 'Función de prueba ejecutada correctamente'
    });

  } catch (error) {
    console.error('Error en función de prueba:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
