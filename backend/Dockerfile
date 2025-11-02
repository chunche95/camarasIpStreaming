# Dockerfile para backend
FROM node:18-alpine

# Instalar FFmpeg y herramientas necesarias
RUN apk add --no-cache ffmpeg

# Crear directorio de la aplicación
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Crear directorio para streams
RUN mkdir -p streams

# Crear directorio para logs
RUN mkdir -p logs

# Copiar el código fuente
COPY . .

# Exponer puerto
EXPOSE 3033

# Comando para iniciar en desarrollo
CMD ["npm", "run", "dev"]