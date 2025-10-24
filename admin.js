// Archivo principal que orquesta los otros módulos
import { loadProducts, addProductToDB, updateProductInDB, deleteProductFromDB, generateSemanticId, cleanup } from './services/firebaseService.js';
import { uploadFile, deleteFile } from './services/apiClient.js';
import { renderProducts, showModal, showNotification, clearForm, fillFormWithProduct } from './ui/uiManager.js';

// Variables globales
let currentEditingProduct = null;

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', async function() {
    // Mostrar información del usuario
    const userEmail = document.getElementById('userEmail');
    if (userEmail) {
        userEmail.textContent = authService.getUserEmail();
    }
    
    // Configurar botón de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            authService.logout();
        });
    }
    
    // Inicializar la aplicación
    initializeApp();
});

// Función para inicializar la aplicación
async function initializeApp() {
    try {
        // Cargar productos y configurar suscripción
        await loadProducts((products) => {
            // Almacenar productos globalmente para acceso desde funciones
            window.currentProducts = products;
            
            // Renderizar productos
            renderProducts(products);
            
            // Actualizar contador de productos
            updateProductCounter(products.length);
        });
        
        // Configurar event listeners
        setupEventListeners();
        
        // Configurar funciones globales para manejar la carga de imágenes
        setupImageHandlers();
    } catch (error) {
        console.error('Error inicializando la aplicación:', error);
        showNotification('Error inicializando la aplicación: ' + error.message, 'error');
    }
}

// Función para configurar event listeners
function setupEventListeners() {
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Event listeners para previews
    const imageInput = document.getElementById('imagen');
    const videoInput = document.getElementById('videos');
    
    if (imageInput) {
        imageInput.addEventListener('change', handleFileChange);
    }
    
    if (videoInput) {
        videoInput.addEventListener('change', handleFileChange);
    }
}

// Función para manejar envío del formulario
async function handleFormSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const productData = {
            nombre: formData.get('nombre'),
            desc: formData.get('desc'),
            precio: `S/. ${formData.get('precio')}`,
            incluye: formData.get('incluye'),
            fechaCreacion: new Date().toISOString()
        };
        
        // Validar datos requeridos
        if (!productData.nombre || !productData.precio) {
            showNotification('Nombre y precio son requeridos', 'error');
            return;
        }
        
        // Manejar imagen
        const imageFile = formData.get('imagen');
        if (imageFile && imageFile.size > 0) {
            console.log('Subiendo imagen...');
            productData.img = await uploadFile(imageFile);
        }
        
        // Manejar video
        const videoFile = formData.get('videos');
        console.log('Video file:', videoFile);
        if (videoFile && videoFile.size > 0) {
            console.log('Subiendo video...', videoFile.name, videoFile.size, 'bytes', videoFile.type);
            productData.videos = await uploadFile(videoFile);
            console.log('Video subido exitosamente:', productData.videos);
        } else {
            console.log('No hay video para subir');
        }
        
        if (currentEditingProduct) {
            // Actualizar producto existente
            await updateProductInDB(currentEditingProduct.firestoreId, productData);
            showNotification('Producto actualizado exitosamente');
        } else {
            // Crear nuevo producto
            productData.id = await generateSemanticId();
            await addProductToDB(productData);
            showNotification('Producto agregado exitosamente');
        }
        
        clearForm();
        currentEditingProduct = null;
        
    } catch (error) {
        console.error('Error en formulario:', error);
        showNotification('Error procesando producto: ' + error.message, 'error');
    }
}

// Función para manejar cambio de archivos
function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const fieldName = e.target.name;
    const infoElement = document.getElementById(fieldName + 'Info');
    const previewElement = document.getElementById(fieldName + 'Preview');
    
    if (infoElement) {
        infoElement.textContent = `Archivo seleccionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    }
    
    if (previewElement && fieldName === 'imagen') {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewElement.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 6px;">`;
        };
        reader.readAsDataURL(file);
    }
    
    if (previewElement && fieldName === 'videos') {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewElement.innerHTML = `
                <video controls style="max-width: 200px; max-height: 150px; border-radius: 6px;">
                    <source src="${e.target.result}" type="${file.type}">
                    Tu navegador no soporta el elemento video.
                </video>
                <p style="margin-top: 5px; font-size: 0.9rem; color: #666;">${file.name}</p>
            `;
        };
        reader.readAsDataURL(file);
    }
}

// Función para editar producto
window.editProduct = function(firestoreId) {
    console.log('Función editProduct llamada con ID:', firestoreId);
    const products = getCurrentProducts();
    console.log('Productos disponibles:', products.length);
    
    const product = products.find(p => p.firestoreId === firestoreId);
    console.log('Producto encontrado:', product);
    
    if (product) {
        currentEditingProduct = product;
        fillFormWithProduct(product);
        
        // Scroll al formulario
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    } else {
        console.error('Producto no encontrado para editar');
        showNotification('Error: Producto no encontrado', 'error');
    }
};

// Función para eliminar producto
window.deleteProduct = function(firestoreId) {
    console.log('Función deleteProduct llamada con ID:', firestoreId);
    
    try {
        showModal(
            'Confirmar Eliminación',
            '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
            async () => {
                try {
                    console.log('Confirmación de eliminación recibida');
                    const products = getCurrentProducts();
                    const product = products.find(p => p.firestoreId === firestoreId);
                    
                    if (product) {
                        // Eliminar archivos asociados
                        if (product.img) {
                            await deleteFile(product.img);
                        }
                        if (product.videos) {
                            await deleteFile(product.videos);
                        }
                    }
                    
                    // Eliminar de la base de datos
                    await deleteProductFromDB(firestoreId);
                    showNotification('Producto eliminado exitosamente');
                    
                } catch (error) {
                    console.error('Error eliminando producto:', error);
                    showNotification('Error eliminando producto: ' + error.message, 'error');
                }
            }
        );
    } catch (error) {
        console.error('Error mostrando modal:', error);
        showNotification('Error mostrando modal de confirmación', 'error');
    }
};

// Función para configurar manejadores de imágenes
function setupImageHandlers() {
    // Función global para manejar timeout de carga de imágenes
    window.setupImageTimeout = function(img) {
        const timeout = 10000; // 10 segundos
        img.timeoutId = setTimeout(() => {
            console.warn('Timeout cargando imagen:', img.src);
            const loadingElement = img.previousElementSibling;
            if (loadingElement) {
                loadingElement.textContent = 'Timeout cargando imagen...';
            }
            // Forzar error para activar el sistema de reintentos
            img.dispatchEvent(new Event('error'));
        }, timeout);
    };

    // Función global para manejar carga exitosa de imágenes
    window.handleImageLoad = function(img) {
        console.log('Imagen cargada exitosamente:', img.src);
        console.log('Dimensiones originales:', img.naturalWidth + 'x' + img.naturalHeight);
        console.log('Dimensiones mostradas:', img.width + 'x' + img.height);
        console.log('Tamaño del archivo:', img.src.length, 'caracteres en URL');
        
        const loadingElement = img.previousElementSibling;
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Limpiar timeout si existe
        if (img.timeoutId) {
            clearTimeout(img.timeoutId);
            img.timeoutId = null;
        }
    };

    // Función global para manejar errores de carga de imágenes
    window.handleImageError = function(img, originalUrl, retryCount = 0) {
        const maxRetries = 3;
        const retryDelay = 2000; // 2 segundos
        
        console.error(`Error cargando imagen (intento ${retryCount + 1}/${maxRetries + 1}):`, img.src);
        
        const loadingElement = img.previousElementSibling;
        if (loadingElement) {
            loadingElement.textContent = `Error cargando imagen... Reintentando (${retryCount + 1}/${maxRetries})`;
        }
        
        if (retryCount < maxRetries) {
            // Reintentar después de un delay
            setTimeout(() => {
                console.log(`Reintentando carga de imagen: ${originalUrl}`);
                img.src = originalUrl + '?retry=' + (retryCount + 1);
            }, retryDelay);
        } else {
            // Después de todos los reintentos, mostrar imagen de error
            console.error('Falló la carga de imagen después de', maxRetries, 'reintentos');
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIGltYWdlbjwvdGV4dD48L3N2Zz4=';
        }
    };
}

// Función para obtener productos actuales (necesaria para las funciones globales)
function getCurrentProducts() {
    // Obtener productos desde firebaseService
    return window.currentProducts || [];
}

// Función para actualizar el contador de productos
function updateProductCounter(count) {
    const counterElement = document.getElementById('productsCount');
    if (counterElement) {
        counterElement.textContent = `${count} productos`;
    }
}

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
    cleanup();
});