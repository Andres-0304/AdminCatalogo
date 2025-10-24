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
            <div style="width: 100%; height: 200px; border: 1px solid #e9ecef; border-radius: 6px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #f8f9fa;">
                <div style="color: #6c757d; font-size: 3rem; margin-bottom: 10px;">🖼️</div>
                <div style="color: #6c757d; font-weight: 500; text-align: center;">Sin imagen</div>
            </div>
        `;
    }
    
    card.innerHTML = `
        ${imageContent}
        <div class="product-info">
            <h3 class="product-name">${product.nombre}</h3>
            <p class="product-id">ID: ${product.id}</p>
            <p class="product-price">${product.precio}</p>
            <p class="product-desc">${product.desc}</p>
            <p class="product-includes">Incluye: ${product.incluye}</p>
            ${videoIndicator}
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
    
    // Limpiar previews
    clearPreviews();
    
    // Resetear estado de edición
    window.currentEditingProduct = null;
    
    // Cambiar texto del botón
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Agregar Producto';
    }
}

// Función para limpiar previews
export function clearPreviews() {
    const imagePreview = document.getElementById('imagePreview');
    const videoPreview = document.getElementById('videoPreview');
    const imageInfo = document.getElementById('imagenInfo');
    const videoInfo = document.getElementById('videoInfo');
    
    if (imagePreview) imagePreview.innerHTML = '';
    if (videoPreview) videoPreview.innerHTML = '';
    if (imageInfo) imageInfo.textContent = '';
    if (videoInfo) videoInfo.textContent = '';
}

// Función para mostrar preview de imagen
export function showImagePreview(imageUrl) {
    const preview = document.getElementById('imagePreview');
    if (!preview) return;
    
    if (imageUrl && imageUrl.trim() !== '') {
        try {
            // Validar URL
            new URL(imageUrl);
            preview.innerHTML = `<img src="${imageUrl}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 6px;">`;
        } catch (error) {
            preview.innerHTML = '<p style="color: #e74c3c;">URL de imagen inválida</p>';
        }
    } else {
        preview.innerHTML = '';
    }
}

// Función para mostrar preview de video
export function showVideoPreview(videoUrl) {
    const preview = document.getElementById('videoPreview');
    if (!preview) return;
    
    if (videoUrl && videoUrl.trim() !== '') {
        try {
            // Validar URL
            new URL(videoUrl);
            preview.innerHTML = `<a href="${videoUrl}" target="_blank" style="color: #3498db; text-decoration: none;">Ver video</a>`;
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
    document.getElementById('productPrice').value = product.precio || '';
    document.getElementById('productIncludes').value = product.incluye || '';
    
    // Mostrar previews si existen
    if (product.img) {
        showImagePreview(product.img);
    }
    if (product.videos) {
        showVideoPreview(product.videos);
    }
    
    // Cambiar texto del botón
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Actualizar Producto';
    }
}
