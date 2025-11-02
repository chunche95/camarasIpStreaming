# Guía de Despliegue para DevOps

Este documento proporciona instrucciones detalladas para el despliegue del Sistema de Monitorización de Cámaras en entornos de preproducción y producción.

## Preparación del entorno

### Requisitos de servidor
- Ubuntu Server 20.04 LTS o superior
- Docker 20.10 o superior
- Docker Compose v2.0 o superior
- Mínimo 2GB RAM, 2 vCPUs
- 20GB espacio en disco
- Acceso a la red donde se encuentran las cámaras IP

### Configuración de red
- Puerto 80 abierto para acceso web
- Puerto 3033 abierto internamente para comunicación entre servicios
- Acceso a puertos RTSP (generalmente 554) de las cámaras

## Pasos de despliegue

### 1. Clonar el repositorio

```bash
git clone https://github.com/example/camera-monitoring-system.git
cd camera-monitoring-system
```

### 2. Configuración de entorno

#### Preproducción
```bash
cp backend/.env.example backend/.env.preprod
cp frontend/.env.example frontend/.env.preprod

# Editar las variables de entorno según el entorno de preproducción
# Especialmente:
# - Rango de IPs para escaneo
# - Credenciales de cámaras
# - URLs de servicios
```

#### Producción
```bash
cp backend/.env.example backend/.env.prod
cp frontend/.env.example frontend/.env.prod

# Configurar variables para producción con valores adecuados
```

### 3. Construcción y despliegue

#### Preproducción

```bash
# Construir y desplegar en preproducción
docker-compose -f docker-compose.prod.yml --env-file backend/.env.preprod up -d --build
```

#### Producción

```bash
# Construir las imágenes
docker-compose -f docker-compose.prod.yml build

# Etiquetar imágenes para registro privado (opcional)
docker tag camera-monitoring-backend:latest registry.example.com/camera-monitoring-backend:1.0.0
docker tag camera-monitoring-frontend:latest registry.example.com/camera-monitoring-frontend:1.0.0

# Subir imágenes al registro (opcional)
docker push registry.example.com/camera-monitoring-backend:1.0.0
docker push registry.example.com/camera-monitoring-frontend:1.0.0

# Desplegar en producción
docker-compose -f docker-compose.prod.yml --env-file backend/.env.prod up -d
```

### 4. Verificación de despliegue

```bash
# Verificar que los contenedores están en ejecución
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f

# Verificar disponibilidad del servicio
curl -I http://localhost
curl -I http://localhost/api/system/info
```

## Gestión de logs

Los logs se almacenan en volúmenes Docker:

```bash
# Ver logs del backend
docker exec -it camera-backend-prod cat /app/logs/app-$(date +%Y-%m-%d).log | tail -100

# Ver logs del frontend (Nginx)
docker exec -it camera-frontend-prod cat /var/log/nginx/access.log
docker exec -it camera-frontend-prod cat /var/log/nginx/error.log
```

## Backups

### Backup de configuración de cámaras

```bash
# Crear backup de datos de cámaras
docker exec -it camera-backend-prod cat /app/data/cameras.json > cameras_backup_$(date +%Y%m%d).json
```

### Restauración de backups

```bash
# Restaurar desde backup
docker cp cameras_backup_20241010.json camera-backend-prod:/app/data/cameras.json
docker-compose -f docker-compose.prod.yml restart backend
```

## Actualización del sistema

```bash
# Detener los servicios
docker-compose -f docker-compose.prod.yml down

# Obtener últimos cambios
git pull

# Reconstruir contenedores
docker-compose -f docker-compose.prod.yml build

# Reiniciar servicios con nuevas imágenes
docker-compose -f docker-compose.prod.yml up -d
```

## Monitorización

Considerar la integración con sistemas de monitorización:

- Prometheus + Grafana para métricas
- Docker healthchecks (ya configurados)
- Alertas por correo o Slack en caso de fallos

## Solución de problemas comunes

### Los streams no funcionan correctamente

1. Verificar que FFmpeg está instalado correctamente en el contenedor:
   ```bash
   docker exec -it camera-backend-prod ffmpeg -version
   ```

2. Comprobar logs específicos de FFmpeg:
   ```bash
   docker exec -it camera-backend-prod grep "FFmpeg" /app/logs/app-$(date +%Y-%m-%d).log
   ```

3. Verificar acceso a las cámaras desde el contenedor:
   ```bash
   docker exec -it camera-backend-prod ping 192.168.1.100
   ```

### El escaneo de cámaras no encuentra dispositivos

1. Verificar el rango de IPs configurado
2. Comprobar credenciales por defecto
3. Asegurar que el contenedor tiene acceso a la red de cámaras

### Problemas de rendimiento

1. Monitorizar uso de CPU/RAM:
   ```bash
   docker stats
   ```

2. Ajustar parámetros de FFmpeg para reducir carga:
   - Modificar calidad de stream
   - Reducir frecuencia de cuadros
   - Ajustar resolución

## Notas de seguridad

- Cambiar credenciales por defecto
- Limitar acceso a la aplicación solo a redes autorizadas
- Configurar HTTPS en producción con certificados válidos
- Considerar la adición de autenticación para acceso a la aplicación web