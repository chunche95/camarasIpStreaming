// backend/utils/loggerUtil.js
/**
 * Utilidad para logging estructurado
 */
const fs = require('fs');
const path = require('path');

// Configuración
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_DIR = process.env.LOG_DIR || './logs';
const LOG_TO_CONSOLE = process.env.LOG_TO_CONSOLE !== 'false';

// Niveles de log en orden de severidad
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
};

// Asegurar que el directorio de logs exista
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Genera el nombre del archivo de log basado en la fecha actual
 * @returns {string} Ruta completa al archivo de log
 */
function getLogFilePath() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(LOG_DIR, `app-${dateStr}.log`);
}

/**
 * Añade una entrada al log
 * @param {string} level - Nivel de log ('debug', 'info', 'warn', 'error', 'fatal')
 * @param {string} message - Mensaje a registrar
 * @param {Object} [metadata] - Metadatos adicionales
 */
function log(level, message, metadata = {}) {
  // Verificar si el nivel actual permite este log
  if (LOG_LEVELS[level] < LOG_LEVELS[LOG_LEVEL]) {
    return;
  }
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...metadata
  };
  
  const logString = JSON.stringify(logEntry);
  
  // Log a consola
  if (LOG_TO_CONSOLE) {
    const consoleMethod = level === 'error' || level === 'fatal' ? 'error' : 
                          level === 'warn' ? 'warn' : 'log';
    
    // Aplicar colores en consola
    let coloredLevel = level.toUpperCase();
    switch (level) {
      case 'debug': coloredLevel = `\x1b[36m${coloredLevel}\x1b[0m`; break; // Cyan
      case 'info': coloredLevel = `\x1b[32m${coloredLevel}\x1b[0m`; break; // Green
      case 'warn': coloredLevel = `\x1b[33m${coloredLevel}\x1b[0m`; break; // Yellow
      case 'error': coloredLevel = `\x1b[31m${coloredLevel}\x1b[0m`; break; // Red
      case 'fatal': coloredLevel = `\x1b[35m${coloredLevel}\x1b[0m`; break; // Magenta
    }
    
    console[consoleMethod](`[${timestamp}] ${coloredLevel}: ${message}`);
    
    // Si hay metadatos, mostrarlos
    if (Object.keys(metadata).length > 0) {
      console[consoleMethod]('Metadata:', metadata);
    }
  }
  
  // Log a archivo
  try {
    const logFilePath = getLogFilePath();
    fs.appendFileSync(logFilePath, logString + '\n');
  } catch (error) {
    console.error(`Error writing to log file: ${error.message}`);
  }
}

// Métodos para cada nivel de log
const logger = {
  debug: (message, metadata) => log('debug', message, metadata),
  info: (message, metadata) => log('info', message, metadata),
  warn: (message, metadata) => log('warn', message, metadata),
  error: (message, metadata) => log('error', message, metadata),
  fatal: (message, metadata) => log('fatal', message, metadata)
};

module.exports = logger;