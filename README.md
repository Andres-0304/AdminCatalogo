# Panel Administrador de Catálogo

Panel de administración para gestionar productos con Firebase Firestore y Cloudflare R2, desplegado en Vercel.

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