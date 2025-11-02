# Dockerfile para frontend (desarrollo)
FROM node:18-alpine

# Crear directorio de la aplicación
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Exponer puerto
EXPOSE 3000

# Iniciar servidor de desarrollo
CMD ["npm", "start"]