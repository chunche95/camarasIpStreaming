# Sistema de Monitorización de Cámaras IP

Sistema modular para la monitorización y gestión de cámaras IP desarrollado como parte del TFG "Sistema de Monitorización de Video para un Living Lab".

## Características

- Descubrimiento automático de cámaras en la red
- Streaming de vídeo de múltiples cámaras en tiempo real
- Interfaz web responsive
- Gestión centralizada de cámaras
- Modo desarrollador para diagnóstico avanzado

## Requisitos

- Node.js >= 16.x
- FFmpeg
- Docker y Docker Compose (opcional)

## Estructura del proyecto

El proyecto sigue una arquitectura modular con separación clara entre backend y frontend:

```
/
+-- backend/         # API y servicios de streaming (Node.js/Express)
+-- frontend/        # Interfaz de usuario (React)
+-- docker-compose.yml    # Configuración para desarrollo
+-- docker-compose.prod.yml  # Configuración para producción
```

## Instalación y configuración

### Usando Docker (recomendado)

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/example/camera-monitoring-system.git
   cd camera-monitoring-system
   ```

2. Configurar las variables de entorno:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
   
3. Editar los archivos `.env` para configurar:
   - Rango de IPs para escaneo
   - Credenciales por defecto para cámaras RTSP
   - Puertos y configuración del sistema

4. Iniciar el sistema con Docker Compose:
   ```bash
   docker-compose up -d
   ```

5. Acceder a la aplicación:
   - Frontend: http://localhost:3000
   - API Backend: http://localhost:3033

### Instalación manual

#### Backend

1. Instalar dependencias:
   ```bash
   cd backend
   npm install
   ```

2. Iniciar el servidor:
   ```bash
   npm run dev
   ```

#### Frontend

1. Instalar dependencias:
   ```bash
   cd frontend
   npm install
   ```

2. Iniciar el servidor de desarrollo:
   ```bash
   npm start
   ```

## Despliegue en producción

1. Configurar variables de entorno para producción:
   ```bash
   cp backend/.env.example backend/.env.prod
   # Modificar las variables según el entorno
   ```

2. Construir y desplegar con Docker Compose:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Modo Desarrollador

El sistema incluye un modo desarrollador oculto para diagnóstico y gestión avanzada:

1. Acceder a la interfaz web
2. Ir a "Configurar cámaras"
3. Presionar la tecla "D" cinco veces consecutivas
4. El panel de desarrollador aparecerá con opciones avanzadas:
   - Gestión CRUD completa de cámaras
   - Diagnóstico de conexión
   - Reinicio de streams
   - Logs del sistema

## API REST

La API incluye endpoints para:

- `GET /api/cameras` - Obtener cámaras activas
- `GET /api/cameras/all` - Obtener todas las cámaras
- `POST /api/cameras/scan` - Iniciar escaneo de red
- `PUT /api/cameras/:id` - Actualizar estado de una cámara
- `PUT /api/cameras/:id/display-name` - Actualizar nombre de visualización
- `POST /api/cameras/add` - Añadir cámara manualmente
- `DELETE /api/cameras/:id` - Eliminar cámara
- `POST /api/cameras/restart-streams` - Reiniciar todos los streams

## Arquitectura

### Backend

Estructura modular basada en principios SOLID y Clean Architecture:

- **Controladores**: Manejan las peticiones HTTP
- **Modelos**: Abstracción de datos
- **Servicios**: Lógica de negocio
- **Utilidades**: Funciones auxiliares

### Frontend

Arquitectura basada en componentes React con:

- **Context API**: Gestión centralizada de estado
- **Hooks personalizados**: Lógica reutilizable
- **Componentes atómicos**: UI modular y reutilizable

## Licencia

Este proyecto es privado y para uso exclusivo como parte del TFG "Sistema de Monitorización de Video para un Living Lab".

## Autor

Paulino Esteban Bermúdez Rodríguez