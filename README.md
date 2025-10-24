# Panel Administrador de Catálogo

Panel de administración para gestionar productos con Firebase Firestore y Cloudflare R2, desplegado en Vercel.

## 🏗️ Arquitectura del Proyecto

Este proyecto sigue una arquitectura **Cliente-Servidor Serverless (Jamstack)** con las siguientes características:

### **Frontend (Cliente)**
- **Responsabilidad**: Mostrar la interfaz y comunicarse con los servicios de backend
- **Tecnologías**: HTML, CSS, JavaScript puro
- **Archivos**: `index.html`, `style.css`, `admin.js`

### **Backend (Servicios Serverless)**
- **Responsabilidad**: Manejar tareas específicas y seguras que no pueden hacerse en el cliente
- **Tecnologías**: Vercel Functions (Node.js)
- **Archivos**: `/api/*.js`

### **Servicios de Terceros**
- **Base de Datos**: Firebase Firestore (tiempo real)
- **Almacenamiento**: Cloudflare R2 (archivos multimedia)

## 📁 Estructura del Proyecto

```
AdminCatalogo/
├── index.html              # Estructura visual de la aplicación
├── style.css               # Estilos visuales
├── admin.js                # Punto de entrada principal del frontend
├── login.html              # Página de autenticación
├── api/                    # Funciones serverless (backend)
│   ├── upload.js           # Función para subir archivos a R2
│   ├── delete.js           # Función para eliminar archivos de R2
│   ├── auth.js             # Función de autenticación
│   ├── verify.js           # Función para verificar tokens
│   └── test.js             # Función de prueba
├── services/               # Servicios del frontend
│   ├── firebaseService.js  # Comunicación con Firebase Firestore
│   └── apiClient.js        # Comunicación con funciones serverless
├── ui/                     # Gestión de la interfaz de usuario
│   └── uiManager.js        # Manipulación del DOM
├── js/                     # Utilidades del frontend
│   └── authService.js      # Servicio de autenticación
├── tests/                  # Pruebas unitarias
│   ├── generateSemanticId.test.js
│   └── upload.test.js
├── package.json            # Dependencias y scripts
└── vercel.json             # Configuración de despliegue
```

## 🔐 Sistema de Autenticación

- **Usuario autorizado**: `entretablas@gmail.com`
- **Contraseña**: `DFY@H6SFquXhBYJ`
- **Seguridad**: Contraseñas encriptadas con bcrypt y tokens JWT
- **Sesión**: Tokens con expiración de 24 horas

## 🔒 Configuración de Seguridad

### **Variables de Entorno Requeridas**

Para un despliegue seguro, configura las siguientes variables de entorno en Vercel:

#### **Cloudflare R2**
- `R2_ACCESS_KEY_ID`: Tu access key de R2
- `R2_SECRET_ACCESS_KEY`: Tu secret key de R2
- `R2_ENDPOINT`: Tu endpoint de R2
- `R2_BUCKET_NAME`: Nombre de tu bucket

#### **JWT Authentication**
- `JWT_SECRET`: Clave secreta para firmar tokens JWT

#### **Firebase (Opcional - para mayor seguridad)**
- `FIREBASE_API_KEY`: Tu API key de Firebase
- `FIREBASE_AUTH_DOMAIN`: Tu dominio de autenticación
- `FIREBASE_PROJECT_ID`: ID de tu proyecto
- `FIREBASE_STORAGE_BUCKET`: Bucket de almacenamiento
- `FIREBASE_MESSAGING_SENDER_ID`: ID del remitente de mensajes
- `FIREBASE_APP_ID`: ID de tu aplicación
- `FIREBASE_MEASUREMENT_ID`: ID de medición

### **Configuración en Vercel**

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a Settings > Environment Variables
3. Agrega todas las variables de entorno necesarias
4. Redeploy tu proyecto

### **Seguridad Implementada**

- ✅ **Credenciales de R2** protegidas en variables de entorno
- ✅ **Credenciales de Firebase** protegidas en variables de entorno
- ✅ **Tokens JWT** con claves secretas seguras
- ✅ **Contraseñas encriptadas** con bcrypt
- ✅ **Configuración dinámica** desde el servidor

## Características

- ✅ CRUD completo de productos
- ✅ Subida de imágenes y videos a Cloudflare R2
- ✅ Almacenamiento de datos en Firebase Firestore
- ✅ IDs automáticos con formato SRV-XXX
- ✅ Interfaz formal y fácil de usar
- ✅ Tiempo real con Firestore
- ✅ Deploy en Vercel con Serverless Functions

## Estructura del Proyecto

```
AdminCatalogo/
├── index.html          
├── style.css           
├── admin.js           
├── api/                
│   ├── upload.js       
│   └── delete.js       
├── package.json        
└── Rvercel.json        
```

## Instalación y Uso

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Firebase
- Crear proyecto en Firebase Console
- Configurar Firestore Database
- Obtener configuración de Firebase

### 3. Configurar Cloudflare R2
- Crear bucket en Cloudflare R2
- Obtener credenciales de acceso
- Configurar variables de entorno en Vercel

### 4. Ejecutar localmente
```bash
npm start
```

### 5. Deploy en Vercel
```bash
npm run deploy
```

## Configuración

### Firebase Firestore
- Colección: `productos`
- Estructura: `id`, `nombre`, `desc`, `precio`, `img`, `incluye`, `videos`

### Cloudflare R2
- Bucket: `servilletas-navidenas`
- Endpoint: `https://14260027a130bb3910678a34f010dcb7.r2.cloudflarestorage.com`

### Variables de Entorno en Vercel
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_ENDPOINT`
- `R2_BUCKET_NAME`

## Tecnologías

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Vercel Serverless Functions
- **Base de datos**: Firebase Firestore
- **Almacenamiento**: Cloudflare R2
- **Deploy**: Vercel

## Licencia

MIT