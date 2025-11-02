#!/bin/bash

# Crear la estructura de directorios para el proyecto
mkdir -p backend/controllers
mkdir -p backend/models
mkdir -p backend/routes
mkdir -p backend/services
mkdir -p backend/utils
mkdir -p backend/middleware
mkdir -p backend/config
mkdir -p backend/public

mkdir -p frontend/src/components/common
mkdir -p frontend/src/components/cameras
mkdir -p frontend/src/components/config
mkdir -p frontend/src/components/dev
mkdir -p frontend/src/hooks
mkdir -p frontend/src/services
mkdir -p frontend/src/utils
mkdir -p frontend/src/context
mkdir -p frontend/public

# Archivos en la raíz del proyecto (nuevo)
touch docker-compose.yml               # Configuración para desarrollo local
touch .env.example                     # Variables de entorno de ejemplo
touch .dockerignore                    # Archivos a ignorar en build de Docker
touch README.md                        # Documentación del proyecto

# Archivos en el directorio backend
touch backend/Dockerfile               # Configuración para construir la imagen
touch backend/package.json             # Dependencias y scripts
touch backend/.env                     # Variables de entorno (no commitear)
touch backend/server.js                # Punto de entrada

# Archivos dentro de backend/controllers
touch backend/controllers/cameraController.js
touch backend/controllers/systemController.js

# Archivos dentro de backend/models
touch backend/models/Camera.js

# Archivos dentro de backend/routes
touch backend/routes/cameraRoutes.js
touch backend/routes/systemRoutes.js

# Archivos dentro de backend/services
touch backend/services/ffmpegService.js
touch backend/services/scannerService.js
touch backend/services/fileService.js

# Archivos dentro de backend/utils
touch backend/utils/loggerUtil.js
touch backend/utils/streamUtils.js

# Archivos dentro de backend/middleware
touch backend/middleware/errorHandler.js

# Archivos dentro de backend/config
touch backend/config/config.js

# Archivos dentro de frontend
touch frontend/Dockerfile              # Configuración para construir la imagen
touch frontend/.env                    # Variables de entorno (no commitear)
touch frontend/.env.example            # Variables de entorno de ejemplo
touch frontend/package.json            # Dependencias y scripts

# Archivos dentro de frontend/public
touch frontend/public/index.html
touch frontend/public/favicon.ico

# Archivos dentro de frontend/src
touch frontend/src/index.js           # Punto de entrada
touch frontend/src/App.js             # Componente principal
touch frontend/src/App.css            # Estilos principales

# Archivos dentro de frontend/src/components
mkdir -p frontend/src/components/common
mkdir -p frontend/src/components/cameras
mkdir -p frontend/src/components/config
mkdir -p frontend/src/components/dev

# Archivos dentro de frontend/src/components/common
touch frontend/src/components/common/Button.js
touch frontend/src/components/common/Modal.js
touch frontend/src/components/common/StatusBadge.js

# Archivos dentro de frontend/src/components/cameras
touch frontend/src/components/cameras/CameraCard.js
touch frontend/src/components/cameras/CameraStream.js
touch frontend/src/components/cameras/CameraGrid.js
touch frontend/src/components/cameras/CameraDetail.js

# Archivos dentro de frontend/src/components/config
touch frontend/src/components/config/CameraTable.js
touch frontend/src/components/config/CameraForm.js
touch frontend/src/components/config/ScanProgress.js

# Archivos dentro de frontend/src/components/dev
touch frontend/src/components/dev/DevMode.js
touch frontend/src/components/dev/DevCameraTable.js
touch frontend/src/components/dev/DevTools.js
touch frontend/src/components/dev/SystemInfo.js

# Archivos dentro de frontend/src/hooks
touch frontend/src/hooks/useDevMode.js
touch frontend/src/hooks/useCameras.js
touch frontend/src/hooks/useStreamControl.js

# Archivos dentro de frontend/src/services
touch frontend/src/services/apiService.js
touch frontend/src/services/cameraService.js
touch frontend/src/services/streamService.js

# Archivos dentro de frontend/src/utils
touch frontend/src/utils/formatters.js
touch frontend/src/utils/validators.js

# Archivos dentro de frontend/src/context
touch frontend/src/context/CameraContext.js

# Archivos dentro de frontend/src (otros)
touch frontend/src/App.js
touch frontend/src/index.js

echo "Estructura de archivos creada con éxito."
