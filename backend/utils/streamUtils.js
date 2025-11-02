// backend/utils/streamUtils.js
/**
 * Utilidades para manejo de streams y URLs RTSP
 */

/**
 * Extrae la dirección IP de una URL RTSP
 * @param {string} rtspUrl - URL RTSP
 * @returns {string|null} - Dirección IP extraída o null si no se encuentra
 */
function extractIpFromRtspUrl(rtspUrl) {
  if (!rtspUrl) return null;
  const matches = rtspUrl.match(/@([^:]+):/);
  return matches ? matches[1] : null;
}

/**
 * Oculta las credenciales en una URL RTSP
 * @param {string} rtspUrl - URL RTSP original
 * @returns {string} - URL RTSP con credenciales ocultas
 */
function maskRtspCredentials(rtspUrl) {
  if (!rtspUrl) return '';
  return rtspUrl.replace(/(rtsp:\/\/)[^@]+(@)/, '$1*****$2');
}

/**
 * Genera un identificador único para streams basado en la IP
 * @param {string} ip - Dirección IP de la cámara
 * @param {number} index - Índice de la cámara en la lista
 * @returns {string} - Identificador único para el stream
 */
function generateStreamId(ip, index) {
  if (!ip) return `camera${index + 1}`;
  return `cam_${ip.replace(/\./g, '_')}`;
}

/**
 * Verifica si una URL RTSP es válida
 * @param {string} rtspUrl - URL RTSP a verificar
 * @returns {boolean} - true si la URL parece válida
 */
function isValidRtspUrl(rtspUrl) {
  if (!rtspUrl) return false;
  // Formato básico de URL RTSP: rtsp://[usuario:contraseña@]ip:puerto/ruta
  const rtspPattern = /^rtsp:\/\/([^@]+@)?([^:]+):(\d+)\/(.+)$/;
  return rtspPattern.test(rtspUrl);
}

/**
 * Construye una URL RTSP a partir de componentes
 * @param {Object} components - Componentes para construir la URL
 * @param {string} components.username - Nombre de usuario
 * @param {string} components.password - Contraseña
 * @param {string} components.ip - Dirección IP
 * @param {string|number} components.port - Puerto
 * @param {string} components.path - Ruta del stream
 * @returns {string} - URL RTSP completa
 */
function buildRtspUrl(components) {
  const { username, password, ip, port, path } = components;
  
  if (!ip || !port || !path) {
    throw new Error('IP, puerto y ruta son obligatorios para construir una URL RTSP');
  }
  
  const credentials = username && password
    ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`
    : '';
    
  return `rtsp://${credentials}${ip}:${port}/${path}`;
}

module.exports = {
  extractIpFromRtspUrl,
  maskRtspCredentials,
  generateStreamId,
  isValidRtspUrl,
  buildRtspUrl
};