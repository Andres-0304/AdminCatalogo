// Función para proporcionar la configuración de Firebase de forma segura
// Las credenciales sensibles se obtienen desde variables de entorno

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

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        // Obtener configuración de Firebase desde variables de entorno
        const firebaseConfig = {
            apiKey: process.env.FIREBASE_API_KEY || "AIzaSyA3OvglK2Qcmi20kBp_q--zwesFE8c77IM",
            authDomain: process.env.FIREBASE_AUTH_DOMAIN || "servilletasnavidenas.firebaseapp.com",
            projectId: process.env.FIREBASE_PROJECT_ID || "servilletasnavidenas",
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "servilletasnavidenas.firebasestorage.app",
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "484584775953",
            appId: process.env.FIREBASE_APP_ID || "1:484584775953:web:817077cb2f184b69a92cb0",
            measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-8QC2ZXW0DC"
        };

        return res.status(200).json({
            success: true,
            firebaseConfig: firebaseConfig
        });

    } catch (error) {
        console.error('Error obteniendo configuración de Firebase:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};
