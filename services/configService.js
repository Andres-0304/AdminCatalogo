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
        
        // En producción, no debe haber fallback con credenciales hardcodeadas
        throw new Error('No se pudo obtener la configuración de Firebase. Verifica que las variables de entorno estén configuradas correctamente.');
    }
}
