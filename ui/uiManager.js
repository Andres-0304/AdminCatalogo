// Servicio para manipulación directa del DOM

// Función para renderizar productos
export function renderProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <p>No hay productos disponibles</p>
            </div>
        `;
        return;
    }
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Función para crear tarjeta de producto
export function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Crear galería unificada (imagen y video en el mismo espacio)
    let mediaContent = '';
    console.log('Producto:', product.nombre, 'Imagen URL:', product.img, 'Video URL:', product.videos);
    
    // Priorizar imagen si existe, sino mostrar video
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
        
        mediaContent = `
            <div class="media-item">
                <div class="image-container">
                    <div class="image-loading">Cargando imagen...</div>
                    <img src="${imageUrl}" alt="${product.nombre}" class="product-image" loading="lazy" 
                         onload="handleImageLoad(this)" 
                         onerror="handleImageError(this, '${imageUrl}')"
                         data-original-url="${imageUrl}"
                         onloadstart="setupImageTimeout(this)">
                </div>
                ${product.videos && product.videos.trim() !== '' ? `
                    <div class="media-indicator">
                        <span class="media-badge">VIDEO</span>
                    </div>
                ` : ''}
            </div>
        `;
    } else if (product.videos && product.videos.trim() !== '') {
        mediaContent = `
            <div class="media-item">
                <div class="video-container">
                    <video controls class="product-video">
                        <source src="${product.videos}" type="video/mp4">
                        <source src="${product.videos}" type="video/webm">
                        <source src="${product.videos}" type="video/ogg">
                        Tu navegador no soporta el elemento video.
                    </video>
                </div>
            </div>
        `;
    } else {
        // Si no hay imagen ni video, mostrar placeholder
        mediaContent = `
            <div class="media-placeholder">
                <div class="placeholder-icon">IMG</div>
                <div class="placeholder-text">Sin medios</div>
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="product-media-gallery">
            ${mediaContent}
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.nombre}</h3>
            <p class="product-id">ID: ${product.id}</p>
            <p class="product-price">${product.precio || 'S/. 0.00'}</p>
            <p class="product-desc">${product.desc}</p>
            <p class="product-includes">Incluye: ${product.incluye}</p>
            <div class="product-actions">
                <button class="btn btn-edit" onclick="editProduct('${product.firestoreId}')">Editar</button>
                <button class="btn btn-delete" onclick="deleteProduct('${product.firestoreId}')">Eliminar</button>
            </div>
        </div>
    `;
    
    return card;
}

// Función para mostrar modal de confirmación
export function showModal(title, message, confirmCallback, cancelCallback) {
    console.log('Función showModal llamada:', { title, message });
    
    const modal = document.getElementById('confirmModal');
    const modalTitle = modal ? modal.querySelector('h3') : null;
    const modalMessage = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelModalBtn');
    
    console.log('Elementos del modal encontrados:', {
        modal: !!modal,
        modalTitle: !!modalTitle,
        modalMessage: !!modalMessage,
        confirmBtn: !!confirmBtn,
        cancelBtn: !!cancelBtn
    });
    
    if (modal && modalTitle && modalMessage && confirmBtn && cancelBtn) {
        // Configurar contenido del modal
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        // Mostrar modal
        modal.style.display = 'block';
        console.log('Modal mostrado');
        
        // Configurar callbacks
        const handleConfirm = () => {
            if (confirmCallback) confirmCallback();
            hideModal();
        };
        
        const handleCancel = () => {
            if (cancelCallback) cancelCallback();
            hideModal();
        };
        
        // Remover event listeners anteriores
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        
        // Agregar nuevos event listeners
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
    } else {
        console.error('No se pudieron encontrar todos los elementos del modal');
    }
}

// Función para ocultar modal
export function hideModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Función para mostrar notificación
export function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    
    if (notification && notificationMessage) {
        notificationMessage.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// Función para limpiar formulario
export function clearForm() {
    const form = document.getElementById('productForm');
    if (form) {
        form.reset();
    }
    
    // Limpiar campos de archivos y previews
    clearFileFields();
    
    // Resetear estado de edición
    window.currentEditingProduct = null;
    
    // Cambiar texto del botón
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Agregar Producto';
    }
    
    // Restaurar labels originales
    const imageLabel = document.querySelector('label[for="productImage"]');
    const videoLabel = document.querySelector('label[for="productVideo"]');
    
    if (imageLabel) {
        imageLabel.textContent = 'Imagen del Producto';
    }
    if (videoLabel) {
        videoLabel.textContent = 'Video del Producto (Opcional)';
    }
}

// Función para limpiar previews
export function clearPreviews() {
    const imagePreview = document.getElementById('imagenPreview');
    const videoPreview = document.getElementById('videosPreview');
    const imageInfo = document.getElementById('imagenInfo');
    const videoInfo = document.getElementById('videosInfo');
    
    if (imagePreview) imagePreview.innerHTML = '';
    if (videoPreview) videoPreview.innerHTML = '';
    if (imageInfo) imageInfo.textContent = '';
    if (videoInfo) videoInfo.textContent = '';
}

// Función para limpiar campos de archivos
export function clearFileFields() {
    const imageInput = document.getElementById('productImage');
    const videoInput = document.getElementById('productVideo');
    
    if (imageInput) imageInput.value = '';
    if (videoInput) videoInput.value = '';
    
    clearPreviews();
}

// Función para mostrar preview de imagen
export function showImagePreview(imageUrl) {
    const preview = document.getElementById('imagenPreview');
    if (!preview) return;
    
    if (imageUrl && imageUrl.trim() !== '') {
        try {
            // Validar URL
            new URL(imageUrl);
            preview.innerHTML = `
                <div style="text-align: center;">
                    <img src="${imageUrl}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 6px; border: 2px solid #e9ecef;">
                    <p style="margin-top: 5px; font-size: 0.9rem; color: #666;">Imagen actual</p>
                </div>
            `;
        } catch (error) {
            preview.innerHTML = '<p style="color: #e74c3c;">URL de imagen inválida</p>';
        }
    } else {
        preview.innerHTML = '';
    }
}

// Función para mostrar preview de video
export function showVideoPreview(videoUrl) {
    const preview = document.getElementById('videosPreview');
    if (!preview) return;
    
    if (videoUrl && videoUrl.trim() !== '') {
        try {
            // Validar URL
            new URL(videoUrl);
            preview.innerHTML = `
                <div style="text-align: center;">
                    <video controls style="max-width: 200px; max-height: 150px; border-radius: 6px; border: 2px solid #e9ecef;">
                        <source src="${videoUrl}" type="video/mp4">
                        <source src="${videoUrl}" type="video/webm">
                        <source src="${videoUrl}" type="video/ogg">
                        Tu navegador no soporta el elemento video.
                    </video>
                    <p style="margin-top: 5px; font-size: 0.9rem; color: #666;">Video actual</p>
                    <p style="margin-top: 5px; font-size: 0.9rem; color: #666;">
                        <a href="${videoUrl}" target="_blank" style="color: #3498db; text-decoration: none;">Abrir video en nueva pestaña</a>
                    </p>
                </div>
            `;
        } catch (error) {
            preview.innerHTML = '<p style="color: #e74c3c;">URL de video inválida</p>';
        }
    } else {
        preview.innerHTML = '';
    }
}

// Función para llenar formulario con datos de producto
export function fillFormWithProduct(product) {
    document.getElementById('productName').value = product.nombre || '';
    document.getElementById('productDesc').value = product.desc || '';
    
    // Extraer solo el número del precio (remover "S/. " si existe)
    const precioValue = product.precio ? product.precio.replace('S/. ', '') : '';
    document.getElementById('productPrice').value = precioValue;
    
    document.getElementById('productIncludes').value = product.incluye || '';
    
    // Mostrar previews si existen
    if (product.img) {
        showImagePreview(product.img);
        // Mostrar información de la imagen existente
        const imageInfo = document.getElementById('imagenInfo');
        if (imageInfo) {
            imageInfo.textContent = `Imagen actual: ${product.img.split('/').pop()}`;
        }
    }
    if (product.videos) {
        showVideoPreview(product.videos);
        // Mostrar información del video existente
        const videoInfo = document.getElementById('videoInfo');
        if (videoInfo) {
            videoInfo.textContent = `Video actual: ${product.videos.split('/').pop()}`;
        }
    }
    
    // Cambiar texto del botón
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Actualizar Producto';
    }
    
    // Actualizar labels para indicar que son opcionales en modo edición
    const imageLabel = document.querySelector('label[for="productImage"]');
    const videoLabel = document.querySelector('label[for="productVideo"]');
    
    if (imageLabel) {
        imageLabel.textContent = 'Imagen del Producto (Opcional - mantiene la actual si no se selecciona)';
    }
    if (videoLabel) {
        videoLabel.textContent = 'Video del Producto (Opcional - mantiene el actual si no se selecciona)';
    }
}
