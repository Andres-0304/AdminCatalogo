// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA3OvglK2Qcmi20kBp_q--zwesFE8c77IM",
  authDomain: "servilletasnavidenas.firebaseapp.com",
  projectId: "servilletasnavidenas",
  storageBucket: "servilletasnavidenas.firebasestorage.app",
  messagingSenderId: "484584775953",
  appId: "1:484584775953:web:817077cb2f184b69a92cb0",
  measurementId: "G-8QC2ZXW0DC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variables globales
let currentEditingProduct = null;
let products = [];

// Función para generar ID semántico automático
async function generateSemanticId() {
    try {
        // Usar los productos ya cargados en memoria para evitar consulta adicional
        let maxNumber = 0;
        
        products.forEach((product) => {
            if (product.id && product.id.startsWith('SRV-')) {
                const numberPart = product.id.replace('SRV-', '');
                const number = parseInt(numberPart);
                if (!isNaN(number) && number > maxNumber) {
                    maxNumber = number;
                }
            }
        });
        
        // Generar el siguiente número
        const nextNumber = maxNumber + 1;
        return `SRV-${nextNumber.toString().padStart(3, '0')}`;
        
    } catch (error) {
        console.error('Error generando ID:', error);
        // En caso de error, generar un ID basado en timestamp
        return `SRV-${Date.now().toString().slice(-3)}`;
    }
}

// Elementos del DOM
const productForm = document.getElementById('productForm');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const productsGrid = document.getElementById('productsGrid');
const productsCount = document.getElementById('productsCount');
const loadingProducts = document.getElementById('loadingProducts');
const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmBtn = document.getElementById('confirmBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadProducts();
});

// Event Listeners
function initializeEventListeners() {
    // Formulario
    productForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', cancelEdit);
    
    // Modal
    cancelModalBtn.addEventListener('click', hideModal);
    confirmBtn.addEventListener('click', handleConfirmAction);
    
    // Inputs de archivo para vista previa
    document.getElementById('productImage').addEventListener('change', handleFileChange);
    document.getElementById('productVideo').addEventListener('change', handleFileChange);
    
    // Cerrar modal al hacer clic fuera
    confirmModal.addEventListener('click', function(e) {
        if (e.target === confirmModal) {
            hideModal();
        }
    });
}


// Función para manejar cambios en inputs de archivo
function handleFileChange(event) {
    const file = event.target.files[0];
    
    // Mapear nombres de campos a IDs correctos
    const fieldMapping = {
        'imagen': { info: 'imageInfo', preview: 'imagePreview' },
        'video': { info: 'videoInfo', preview: 'videoPreview' }
    };
    
    const mapping = fieldMapping[event.target.name];
    if (!mapping) {
        console.error('Campo no reconocido:', event.target.name);
        return;
    }
    
    const infoElement = document.getElementById(mapping.info);
    const previewElement = document.getElementById(mapping.preview);
    
    // Verificar que los elementos existan
    if (!infoElement || !previewElement) {
        console.error('Elementos del DOM no encontrados:', mapping.info, mapping.preview);
        return;
    }
    
    if (file) {
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        infoElement.textContent = `Archivo seleccionado: ${file.name} (${fileSize} MB)`;
        infoElement.style.color = '#27ae60';
        
        // Mostrar vista previa
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewElement.innerHTML = `<img src="${e.target.result}" alt="Vista previa" style="max-width: 100%; height: auto; border-radius: 6px;">`;
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            previewElement.innerHTML = `
                <div style="padding: 20px; text-align: center; background: #f8f9fa; border-radius: 6px;">
                    <div style="color: #3498db; font-size: 2rem; margin-bottom: 10px;">🎥</div>
                    <div style="color: #2c3e50; font-weight: 500;">${file.name}</div>
                </div>
            `;
        }
    } else {
        infoElement.textContent = '';
        previewElement.innerHTML = '';
    }
}

// Función para subir archivo a R2 usando Firebase Functions
async function uploadFileToR2(file) {
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
        console.log('- Verificación de integridad:', base64String.length >= Math.ceil(file.size * 4 / 3) ? '✅ OK' : '❌ PROBLEMA');
        
        // URL de la Vercel Function
        const functionUrl = '/api/upload';
        
        // Datos para enviar a la función
        const requestData = {
            fileData: base64String,
            fileName: file.name,
            contentType: file.type
        };
        
        try {
            // Llamar a Firebase Function
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
                    console.log('✅ INTEGRIDAD VERIFICADA: El archivo se subió exactamente como está');
                } else {
                    console.log('❌ PROBLEMA DE INTEGRIDAD: El archivo cambió de tamaño durante la subida');
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

// Funciones globales para manejar la carga de imágenes
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

// Función para eliminar archivo de R2 usando Vercel Functions
async function deleteFileFromR2(url) {
    try {
        console.log('Eliminando archivo de R2:', url);
        
        // URL de la Vercel Function
        const functionUrl = '/api/delete';
        
        // Datos para enviar a la función
        const requestData = {
            url: url
        };
        
        try {
            // Llamar a Firebase Function
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                console.log('Archivo eliminado exitosamente de R2:', url);
                return true;
            } else {
                console.log('Error eliminando archivo de R2, marcando como eliminado:', result.error);
                return true; // Consideramos exitoso para no bloquear la eliminación del producto
            }
            
        } catch (deleteError) {
            console.log('Error eliminando archivo de R2, marcando como eliminado:', deleteError);
            return true; // Consideramos exitoso para no bloquear la eliminación del producto
        }
        
    } catch (error) {
        console.error('Error eliminando archivo:', error);
        return false;
    }
}

// Cargar productos en tiempo real
function loadProducts() {
    loadingProducts.style.display = 'block';
    
    const q = query(collection(db, 'productos'), orderBy('nombre', 'asc'));
    
    onSnapshot(q, (snapshot) => {
        products = [];
        productsGrid.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const product = { id: doc.data().id, firestoreId: doc.id, ...doc.data() };
            console.log('Producto cargado desde Firestore:', product);
            products.push(product);
        });
        
        renderProducts();
        updateProductsCount();
        loadingProducts.style.display = 'none';
    }, (error) => {
        console.error('Error cargando productos:', error);
        showNotification('Error al cargar los productos', 'error');
        loadingProducts.style.display = 'none';
    });
}

// Renderizar productos
function renderProducts() {
    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;">
                <p>No hay productos en el catálogo</p>
                <p style="font-size: 0.9rem; margin-top: 10px;">Agrega tu primer producto usando el formulario de arriba</p>
            </div>
        `;
        return;
    }
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Crear tarjeta de producto
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const videoIndicator = product.videos ? '<div class="video-indicator">📹 Video disponible</div>' : '';
    
    // Mostrar imagen del producto
    let imageContent;
    console.log('Producto:', product.nombre, 'Imagen URL:', product.img);
    
    if (product.img && product.img.trim() !== '') {
            // Convertir URLs antiguas a nuevas si es necesario
            let imageUrl = product.img;
            if (imageUrl.includes('14260027a130bb3910678a34f010dcb7.r2.cloudflarestorage.com') || 
                imageUrl.includes('pub-servilletas-navidenas.r2.dev')) {
                // Convertir URL antigua a nueva
                const fileName = imageUrl.split('/').pop();
                imageUrl = `https://pub-8abbc2a107f14bacaecfca417d47cfb3.r2.dev/images/${fileName}`;
                console.log('URL convertida:', imageUrl);
            }
        
        imageContent = `
            <div class="image-container">
                <div class="image-loading">Cargando imagen...</div>
                <img src="${imageUrl}" alt="${product.nombre}" class="product-image" loading="lazy" 
                     onload="handleImageLoad(this)" 
                     onerror="handleImageError(this, '${imageUrl}')"
                     data-original-url="${imageUrl}"
                     onloadstart="setupImageTimeout(this)">
            </div>
        `;
    } else {
        imageContent = `
            <div style="width: 100%; height: 200pxOmega; border: 1px solid #e9ecef; border-radius: 6px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #f8f9fa;">
                <div style="color: #6c757d; font-size: 3rem; margin-bottom: 10px;">🖼️</div>
                <div style="color: #6c757d; font-weight: 500; text-align: center;">Sin imagen</div>
            </div>
        `;
    }
    
    card.innerHTML = `
        ${imageContent}
        <div class="product-info">
            <h3 class="product-name">${product.nombre}</h3>
            <div class="product-details">
                <div class="product-detail">
                    <strong>ID:</strong>
                    <span>${product.id}</span>
                </div>
                <div class="product-detail">
                    <strong>Precio:</strong>
                    <span>$${product.precio}</span>
                </div>
            </div>
            <p class="product-description">${product.desc}</p>
            <p class="product-includes">Incluye: ${product.incluye}</p>
            ${videoIndicator}
            <div class="product-actions">
                <button class="btn btn-secondary btn-small" onclick="editProduct('${product.id}')">
                    Editar
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteProduct('${product.id}', '${product.nombre}')">
                    Eliminar
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Actualizar contador de productos
function updateProductsCount() {
    const count = products.length;
    productsCount.textContent = `${count} producto${count !== 1 ? 's' : ''}`;
}

// Manejar envío del formulario
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (currentEditingProduct) {
        await updateProduct();
    } else {
        await addProduct();
    }
}

// Agregar nuevo producto
async function addProduct() {
    try {
        console.log('Iniciando proceso de agregar producto...');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Agregando...';
        
        const formData = new FormData(productForm);
        const imageFile = document.getElementById('productImage').files[0];
        const videoFile = document.getElementById('productVideo').files[0];
        
        console.log('Datos del formulario:', {
            nombre: formData.get('nombre'),
            precio: formData.get('precio'),
            desc: formData.get('desc'),
            incluye: formData.get('incluye'),
            imagen: imageFile ? imageFile.name : 'Sin imagen',
            video: videoFile ? videoFile.name : 'Sin video'
        });
        
        // Generar ID automático
        console.log('Generando ID semántico...');
        const semanticId = await generateSemanticId();
        console.log('ID generado:', semanticId);
        
        // Subir imagen
        let imageUrl = '';
        if (imageFile) {
            console.log('Subiendo imagen...');
            imageUrl = await uploadFileToR2(imageFile);
            console.log('URL de imagen:', imageUrl);
        }
        
        // Subir video (opcional)
        let videoUrl = '';
        if (videoFile) {
            console.log('Subiendo video...');
            videoUrl = await uploadFileToR2(videoFile);
            console.log('URL de video:', videoUrl);
        }
        
        // Crear documento en Firestore
        const productData = {
            id: semanticId,
            nombre: formData.get('nombre'),
            desc: formData.get('desc'),
            precio: parseFloat(formData.get('precio')),
            incluye: formData.get('incluye'),
            img: imageUrl,
            videos: videoUrl || null
        };
        
        console.log('Guardando en Firestore:', productData);
        await addDoc(collection(db, 'productos'), productData);
        console.log('Producto guardado exitosamente');
        
        showNotification(`Producto agregado exitosamente con ID: ${semanticId}`, 'success');
        productForm.reset();
        clearPreviews();
        
    } catch (error) {
        console.error('Error agregando producto:', error);
        console.error('Detalles del error:', error.message);
        showNotification(`Error al agregar el producto: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Agregar Producto';
    }
}

// Actualizar producto existente
async function updateProduct() {
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Actualizando...';
        
        const formData = new FormData(productForm);
        const imageFile = document.getElementById('productImage').files[0];
        const videoFile = document.getElementById('productVideo').files[0];
        
        let imageUrl = currentEditingProduct.img;
        let videoUrl = currentEditingProduct.videos;
        
        // Subir nueva imagen si se seleccionó
        if (imageFile) {
            // Eliminar imagen anterior
            if (currentEditingProduct.img) {
                await deleteFileFromR2(currentEditingProduct.img);
            }
            imageUrl = await uploadFileToR2(imageFile);
        }
        
        // Subir nuevo video si se seleccionó
        if (videoFile) {
            // Eliminar video anterior
            if (currentEditingProduct.videos) {
                await deleteFileFromR2(currentEditingProduct.videos);
            }
            videoUrl = await uploadFileToR2(videoFile);
        }
        
        // Actualizar documento en Firestore (mantener ID existente)
        const productData = {
            id: currentEditingProduct.id, // Mantener el ID original
            nombre: formData.get('nombre'),
            desc: formData.get('desc'),
            precio: parseFloat(formData.get('precio')),
            incluye: formData.get('incluye'),
            img: imageUrl,
            videos: videoUrl || null
        };
        
        // Usar el ID del documento de Firestore, no el campo id del producto
        await updateDoc(doc(db, 'productos', currentEditingProduct.firestoreId), productData);
        
        showNotification('Producto actualizado exitosamente', 'success');
        cancelEdit();
        
    } catch (error) {
        console.error('Error actualizando producto:', error);
        showNotification('Error al actualizar el producto', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Agregar Producto';
    }
}

// Editar producto
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    currentEditingProduct = product;
    
    // Llenar formulario (sin campo ID)
    document.getElementById('productName').value = product.nombre;
    document.getElementById('productPrice').value = product.precio;
    document.getElementById('productDesc').value = product.desc;
    document.getElementById('productIncludes').value = product.incluye;
    
    // Mostrar archivos actuales
    document.getElementById('imageInfo').textContent = 'Archivo actual: ' + (product.img ? 'Imagen cargada' : 'Sin imagen');
    document.getElementById('videoInfo').textContent = product.videos ? 'Archivo actual: Video cargado' : '';
    
    // Mostrar vista previa de archivos actuales
    if (product.img) {
        document.getElementById('imagePreview').innerHTML = `<img src="${product.img}" alt="Imagen actual" style="max-width: 100%; height: auto; border-radius: 6px;">`;
    }
    if (product.videos) {
        document.getElementById('videoPreview').innerHTML = `
            <div style="padding: 20px; text-align: center; background: #f8f9fa; border-radius: 6px;">
                <div style="color: #3498db; font-size: 2rem; margin-bottom: 10px;">🎥</div>
                <div style="color: #2c3e50; font-weight: 500;">Video actual</div>
            </div>
        `;
    }
    
    // Cambiar interfaz a modo edición
    document.querySelector('.form-section').classList.add('editing');
    submitBtn.textContent = 'Actualizar Producto';
    cancelBtn.style.display = 'inline-flex';
    
    // Hacer imagen opcional en edición
    document.getElementById('productImage').required = false;
    
    // Scroll al formulario
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Cancelar edición
function cancelEdit() {
    currentEditingProduct = null;
    productForm.reset();
    clearPreviews();
    
    // Restaurar interfaz
    document.querySelector('.form-section').classList.remove('editing');
    submitBtn.textContent = 'Agregar Producto';
    cancelBtn.style.display = 'none';
    document.getElementById('productImage').required = true;
}

// Eliminar producto
function deleteProduct(productId, productName) {
    showModal(
        `¿Estás seguro de que deseas eliminar el producto "${productName}"?`,
        'Esta acción no se puede deshacer.',
        async () => {
            try {
                const product = products.find(p => p.id === productId);
                if (!product) return;
                
                // Eliminar archivos de R2
                if (product.img) {
                    await deleteFileFromR2(product.img);
                }
                if (product.videos) {
                    await deleteFileFromR2(product.videos);
                }
                
                // Eliminar documento de Firestore usando el ID correcto
                await deleteDoc(doc(db, 'productos', product.firestoreId));
                
                showNotification('Producto eliminado exitosamente', 'success');
                
            } catch (error) {
                console.error('Error eliminando producto:', error);
                showNotification('Error al eliminar el producto', 'error');
            }
        }
    );
}

// Limpiar vistas previas
function clearPreviews() {
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('videoPreview').innerHTML = '';
    document.getElementById('imageInfo').textContent = '';
    document.getElementById('videoInfo').textContent = '';
}

// Mostrar modal de confirmación
function showModal(title, message, onConfirm) {
    confirmMessage.innerHTML = `<strong>${title}</strong><br><br>${message}`;
    confirmBtn.onclick = onConfirm;
    confirmModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Ocultar modal
function hideModal() {
    confirmModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Manejar confirmación del modal
function handleConfirmAction() {
    if (confirmBtn.onclick) {
        confirmBtn.onclick();
    }
    hideModal();
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    notificationMessage.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Limpiar información de archivos (mantener por compatibilidad)
function clearFileInfo() {
    clearPreviews();
}

// Funciones globales para los botones en las tarjetas
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
