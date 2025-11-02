// backend/routes/cameraRoutes.js
const express = require('express');
const cameraController = require('../controllers/cameraController');

const router = express.Router();

// Rutas para gestión de cámaras
router.get('/all', cameraController.getAllCameras);
router.get('/', cameraController.getActiveCameras);
router.post('/scan', cameraController.scanCameras);
router.put('/:id', cameraController.updateCameraStatus);
router.put('/:id/display-name', cameraController.updateCameraDisplayName);
router.post('/add', cameraController.addCamera);
router.put('/:id/update', cameraController.updateCamera);
router.delete('/:id', cameraController.deleteCamera);
router.post('/restart-streams', cameraController.restartStreams);

module.exports = router;

// backend/routes/systemRoutes.js
const express = require('express');
const systemController = require('../controllers/systemController');

const router = express.Router();

// Rutas para información del sistema
router.get('/info', systemController.getSystemInfo);
router.get('/logs', systemController.getSystemLogs);
router.post('/restart', systemController.restartSystem);

module.exports = router;

// backend/controllers/systemController.js
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/loggerUtil');

/**
 * Obtiene información del sistema
 */
const getSystemInfo = (req, res) => {
  const systemInfo = {
    hostname: os.hostname(),
    platform: os.platform(),
    uptime: os.uptime(),
    memory: {
      total: os.totalmem(),
      free: os.freemem()
    },
    cpus: os.cpus().length,
    nodeVersion: process.version,
    time: new Date().toISOString()
  };
  
  res.json(systemInfo);
};

/**
 * Obtiene los últimos logs del sistema
 */
const getSystemLogs = async (req, res) => {
  try {
    const LOG_DIR = process.env.LOG_DIR || './logs';
    const files = await fs.readdir(LOG_DIR);
    
    // Obtener el archivo de log más reciente
    const logFiles = files
      .filter(file => file.endsWith('.log'))
      .sort()
      .reverse();
    
    if (logFiles.length === 0) {
      return res.json({ logs: [] });
    }
    
    const logFile = path.join(LOG_DIR, logFiles[0]);
    const content = await fs.readFile(logFile, 'utf8');
    
    // Limitar a las últimas 100 líneas
    const lines = content.split('\n').filter(Boolean);
    const lastLines = lines.slice(-100);
    
    // Parsear los logs JSON
    const logs = lastLines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return { timestamp: '', level: 'ERROR', message: line };
      }
    });
    
    res.json({ logs });
  } catch (error) {
    logger.error(`Error al leer logs: ${error.message}`);
    res.status(500).json({ error: 'Error al leer logs del sistema' });
  }
};

/**
 * Reinicia el servicio (para desarrollo)
 * Nota: Esto solo funcionará si se ejecuta con PM2 o similar
 */
const restartSystem = (req, res) => {
  logger.info('Reinicio del sistema solicitado');
  res.json({ message: 'Reinicio iniciado' });
  
  // Programar reinicio después de responder
  setTimeout(() => {
    process.exit(0);
  }, 1000);
};

module.exports = {
  getSystemInfo,
  getSystemLogs,
  restartSystem
};

// backend/middleware/errorHandler.js
const logger = require('../utils/loggerUtil');

/**
 * Middleware para manejo centralizado de errores
 */
function errorHandler(err, req, res, next) {
  // Registrar el error
  logger.error(err.message, {
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // Determinar el código de estado
  const statusCode = err.statusCode || 500;
  
  // Respuesta al cliente
  res.status(statusCode).json({
    error: err.message || 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;