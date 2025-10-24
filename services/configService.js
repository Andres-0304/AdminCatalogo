// Servicio para manejar la configuración de Firebase de forma segura
// Las credenciales se obtienen desde variables de entorno o configuración del servidor

// Función para obtener la configuración de Firebase
export async function getFirebaseConfig() {
    try {
        // Intentar obtener la configuración desde el servidor
        const response = await fetch('/api/config');
        const config = await response.json();
        
        if (config.success) {
            return config.firebaseConfig;
        } else {
            throw new Error('No se pudo obtener la configuración de Firebase');
        }
    } catch (error) {
        console.error('Error obteniendo configuración de Firebase:', error);
        
        // Fallback: usar configuración pública (solo para desarrollo)
        // En producción, esto debería fallar si no hay configuración segura
        return {
            apiKey: "AIzaSyA3OvglK2Qcmi20kBp_q--zwesFE8c77IM",
            authDomain: "servilletasnavidenas.firebaseapp.com",
            projectId: "servilletasnavidenas",
            storageBucket: "servilletasnavidenas.firebasestorage.app",
            messagingSenderId: "484584775953",
            appId: "1:484584775953:web:817077cb2f184b69a92cb0",
            measurementId: "G-8QC2ZXW0DC"
        };
    }
}
