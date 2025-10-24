// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getFirebaseConfig } from './configService.js';

// Variables globales para Firebase
let app = null;
let db = null;

// Función para inicializar Firebase con configuración segura
async function initializeFirebase() {
    if (app && db) {
        return { app, db };
    }
    
    try {
        const firebaseConfig = await getFirebaseConfig();
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        return { app, db };
    } catch (error) {
        console.error('Error inicializando Firebase:', error);
        throw error;
    }
}

// Variables globales
let products = [];
let unsubscribe = null;

// Función para cargar productos desde Firestore
export async function loadProducts(callback) {
    try {
        const { db } = await initializeFirebase();
        const productsRef = collection(db, 'productos');
        const q = query(productsRef, orderBy('fechaCreacion', 'desc'));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
            products = [];
            snapshot.forEach((doc) => {
                const product = {
                    id: doc.data().id,
                    firestoreId: doc.id,
                    ...doc.data()
                };
                products.push(product);
                console.log('Producto cargado desde Firestore:', product);
            });
            
            // Notificar al callback con los nuevos datos
            if (callback) {
                callback(products);
            }
        }, (error) => {
            console.error('Error cargando productos:', error);
        });
        
    } catch (error) {
        console.error('Error inicializando productos:', error);
    }
}

// Función para agregar producto a la base de datos
export async function addProductToDB(productData) {
    try {
        const { db } = await initializeFirebase();
        const productsRef = collection(db, 'productos');
        const docRef = await addDoc(productsRef, productData);
        console.log('Producto guardado exitosamente');
        return docRef.id;
    } catch (error) {
        console.error('Error guardando producto:', error);
        throw error;
    }
}

// Función para actualizar producto en la base de datos
export async function updateProductInDB(firestoreId, productData) {
    try {
        const { db } = await initializeFirebase();
        const productRef = doc(db, 'productos', firestoreId);
        await updateDoc(productRef, productData);
        console.log('Producto actualizado exitosamente');
    } catch (error) {
        console.error('Error actualizando producto:', error);
        throw error;
    }
}

// Función para eliminar producto de la base de datos
export async function deleteProductFromDB(firestoreId) {
    try {
        const { db } = await initializeFirebase();
        const productRef = doc(db, 'productos', firestoreId);
        await deleteDoc(productRef);
        console.log('Producto eliminado exitosamente');
    } catch (error) {
        console.error('Error eliminando producto:', error);
        throw error;
    }
}

// Función para generar ID semántico automático
export async function generateSemanticId() {
    try {
        // Usar los productos ya cargados en memoria para evitar consulta adicional
        let maxNumber = 0;
        
        products.forEach((product) => {
            if (product.id && product.id.startsWith('SRV-')) {
                const number = parseInt(product.id.split('-')[1]);
                if (!isNaN(number) && number > maxNumber) {
                    maxNumber = number;
                }
            }
        });
        
        const nextNumber = maxNumber + 1;
        const semanticId = `SRV-${nextNumber.toString().padStart(3, '0')}`;
        
        console.log('ID generado:', semanticId);
        return semanticId;
    } catch (error) {
        console.error('Error generando ID semántico:', error);
        throw error;
    }
}

// Función para limpiar la suscripción
export function cleanup() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
}

// Función para obtener productos actuales
export function getCurrentProducts() {
    return products;
}
