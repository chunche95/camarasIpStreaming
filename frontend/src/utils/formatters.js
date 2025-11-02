// src/utils/formatters.js

/**
 * Formatea una URL RTSP para ocultar credenciales
 * @param {string} rtspUrl - URL RTSP original
 * @returns {string} - URL RTSP con credenciales ocultas
 */
export const formatRtspUrl = (rtspUrl) => {
  if (!rtspUrl) return '';
  return rtspUrl.replace(/(rtsp:\/\/)[^@]+(@)/, '$1*****$2');
};

/**
 * Extrae la IP de una URL RTSP
 * @param {string} rtspUrl - URL RTSP
 * @returns {string|null} - Dirección IP o null si no se encuentra
 */
export const extractIpFromRtspUrl = (rtspUrl) => {
  if (!rtspUrl) return null;
  const matches = rtspUrl.match(/@([^:]+):/);
  return matches ? matches[1] : null;
};

/**
 * Genera un identificador único para una cámara basado en su IP
 * @param {string} ip - Dirección IP
 * @returns {string} - Identificador único
 */
export const generateCameraId = (ip) => {
  if (!ip) return null;
  return `cam_${ip.replace(/\./g, '_')}`;
};

/**
 * Formatea una fecha como string
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
};