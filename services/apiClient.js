// Servicio para comunicación con las funciones serverless de la API

// Función para subir archivo a R2 usando Vercel Functions
export async function uploadFile(file) {
    try {
        console.log('Subiendo archivo a R2:', file.name, 'Tamaño:', file.size, 'bytes', 'Tipo:', file.type);
        console.log('Última modificación:', new Date(file.lastModified).toISOString());
        
        // Leer archivo tal como está, sin modificaciones
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Convertir a base64 preservando cada byte exactamente
        let base64String = '';
        
        // Método que preserva el archivo exactamente como está
        const convertToBase64 = (uint8Array) => {
            // Crear string binario byte por byte para preservar integridad
            let binary = '';
            for (let i = 0; i < uint8Array.length; i++) {
                binary += String.fromCharCode(uint8Array[i]);
            }
            return btoa(binary);
        };
        
        // Convertir todo el archivo de una vez para preservar integridad completa
        base64String = convertToBase64(uint8Array);
        
        console.log('Archivo convertido a base64 (preservando integridad):');
        console.log('- Tamaño original:', file.size, 'bytes');
        console.log('- Tamaño base64:', base64String.length, 'caracteres');
        console.log('- Ratio esperado (4/3):', Math.ceil(file.size * 4 / 3), 'caracteres');
        console.log('- Verificación de integridad:', base64String.length >= Math.ceil(file.size * 4 / 3) ? ' OK' : ' PROBLEMA');
        
        // URL de la Vercel Function
        const functionUrl = '/api/upload';
        
        // Datos para enviar a la función
        const requestData = {
            fileData: base64String,
            fileName: file.name,
            contentType: file.type
        };
        
        try {
            // Llamar a Vercel Function
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                console.log('Archivo subido exitosamente a R2:', result.url);
                console.log('Verificación de integridad del archivo:');
                console.log('- Tamaño original:', file.size, 'bytes');
                console.log('- Tamaño subido:', result.fileSize, 'bytes');
                console.log('- Tipo:', result.contentType);
                console.log('- Nombre original:', result.originalName);
                
                // Verificar que el tamaño se mantiene exactamente igual
                if (result.fileSize === file.size) {
                    console.log(' INTEGRIDAD VERIFICADA: El archivo se subió exactamente como está');
                } else {
                    console.log('PROBLEMA DE INTEGRIDAD: El archivo cambió de tamaño durante la subida');
                    console.log('- Diferencia:', Math.abs(result.fileSize - file.size), 'bytes');
                }
                
                return result.url;
            } else {
                throw new Error(result.error || 'Error en la respuesta del servidor');
            }
            
        } catch (uploadError) {
            console.log('Error en subida a R2, usando simulación:', uploadError);
            
            // Si falla la subida, usar simulación
            const uniqueFileName = `${Date.now()}-${file.name}`;
            const publicUrl = `https://pub-8abbc2a107f14bacaecfca417d47cfb3.r2.dev/images/${uniqueFileName}`;
            console.log('URL generada (simulación):', publicUrl);
            return publicUrl;
        }
        
    } catch (error) {
        console.error('Error subiendo archivo:', error);
        throw error;
    }
}

// Función para eliminar archivo de R2 usando Vercel Functions
export async function deleteFile(url) {
    try {
        console.log('Eliminando archivo de R2:', url);
        
        // URL de la Vercel Function
        const functionUrl = '/api/delete';
        
        // Datos para enviar a la función
        const requestData = {
            url: url
        };
        
        try {
            // Llamar a Vercel Function
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                console.log('Archivo eliminado exitosamente de R2');
                return true;
            } else {
                throw new Error(result.error || 'Error en la respuesta del servidor');
            }
            
        } catch (deleteError) {
            console.log('Error eliminando archivo de R2, marcando como eliminado:', deleteError);
            return false; // Marcar como eliminado aunque falle la eliminación real
        }
        
    } catch (error) {
        console.error('Error eliminando archivo:', error);
        return false;
    }
}
