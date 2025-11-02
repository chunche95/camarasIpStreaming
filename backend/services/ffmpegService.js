// backend/services/ffmpegService.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/loggerUtil');
const Camera = require('../models/Camera');

// Array para mantener los procesos FFmpeg activos
let ffmpegProcesses = [];

// Directorio para los streams
const STREAMS_DIR = path.join(__dirname, '../streams');

/**
 * Detiene todos los procesos FFmpeg activos
 */
function stopAllStreams() {
  logger.info('Deteniendo todos los procesos FFmpeg...');
  ffmpegProcesses.forEach(process => {
    if (process && !process.killed) {
      process.kill('SIGTERM');
    }
  });
  ffmpegProcesses = [];
}

/**
 * Inicia un proceso FFmpeg para una cámara
 * @param {Object} camera - Cámara a transmitir
 * @param {number} index - Índice de la cámara
 * @returns {Object} - Proceso FFmpeg
 */
function startFFmpeg(camera, index) {
  // Usar el streamId único o generar uno basado en el índice
  const streamId = `camera${index + 1}`;
  const streamPath = path.join(STREAMS_DIR, `${streamId}.m3u8`);
  const segmentPath = path.join(STREAMS_DIR, `${streamId}_%03d.ts`);

  logger.info(`Iniciando streaming para '${camera.name}' (ID: ${streamId})...`, {
    rtspUrl: camera.rtspUrl.replace(/(rtsp:\/\/)[^@]+(@)/, '$1*****$2'),
    streamPath
  });

  // Intentar con configuración avanzada primero
  try {
    return startAdvancedFFmpeg(camera, streamId, streamPath, segmentPath);
  } catch (error) {
    logger.warn(`Error con configuración avanzada para ${camera.name}: ${error.message}`);
    // Si falla, usar configuración simple
    return startSimpleFFmpeg(camera, streamId, streamPath, segmentPath);
  }
}

/**
 * Inicia FFmpeg con configuración avanzada
 * @private
 */
function startAdvancedFFmpeg(camera, streamId, streamPath, segmentPath) {
  // Parámetros FFmpeg avanzados
  const ffmpegArgs = [
    // Timeout para conexión
    '-timeout', '5000000',
    // Configuraciones de entrada
    '-rtsp_transport', 'tcp',
    '-i', camera.rtspUrl,
    // Buffer de entrada
    '-rtbufsize', '5M',
    // Escalar video para reducir tamaño
    '-vf', 'scale=720:-1',
    // Configuraciones de códec
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',
    '-profile:v', 'baseline',
    '-level', '3.0',
    '-pix_fmt', 'yuv420p',
    '-r', '15',
    '-g', '30',
    '-b:v', '2M',
    '-maxrate', '2.2M',
    '-bufsize', '2M',
    '-an',
    '-max_delay', '50000',
    // Configuraciones HLS
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '5',
    '-hls_flags', 'delete_segments+append_list+discont_start',
    '-hls_segment_filename', segmentPath,
    streamPath
  ];

  return launchFFmpeg(camera, streamId, ffmpegArgs);
}

/**
 * Inicia FFmpeg con configuración simple (fallback)
 * @private
 */
function startSimpleFFmpeg(camera, streamId, streamPath, segmentPath) {
  logger.info(`Intentando streaming simplificado para '${camera.name}' (ID: ${streamId})...`);

  // Parámetros FFmpeg simples
  const ffmpegArgs = [
    '-rtsp_transport', 'tcp',
    '-i', camera.rtspUrl,
    '-c:v', 'copy',
    '-an',
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '5',
    '-hls_flags', 'delete_segments',
    '-hls_segment_filename', segmentPath,
    streamPath
  ];

  return launchFFmpeg(camera, streamId, ffmpegArgs, '[Simple]');
}

/**
 * Ejecuta el proceso FFmpeg con los argumentos dados
 * @private
 */
function launchFFmpeg(camera, streamId, ffmpegArgs, logPrefix = '') {
  const logTag = `[${camera.name}]${logPrefix}`;
  logger.debug(`Comando FFmpeg: ${['ffmpeg', ...ffmpegArgs].join(' ')}`);

  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

  ffmpegProcess.stderr.on('data', (data) => {
    const output = data.toString();
    // Registrar mensajes clave para debugging
    if (output.includes('Error') || output.includes('error') || output.includes('fail')) {
      logger.error(`${logTag}: ${output.trim()}`);
    }
    // Log detallado solo en modo debug
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug(`${logTag}: ${output.trim()}`);
    }
  });

  ffmpegProcess.on('close', (code) => {
    if (code !== 0) {
      logger.error(`FFmpeg terminó con código ${code} para '${camera.name}'`);
      logger.info(`Reiniciando streaming para '${camera.name}'...`);

      // Verificar si los archivos HLS existen y crearlos si no
      try {
        // Crear un archivo m3u8 vacío para evitar errores 404
        fs.writeFileSync(streamPath, '#EXTM3U\n#EXT-X-VERSION:3\n');
      } catch (error) {
        logger.error(`Error creando archivo HLS temporal: ${error.message}`);
      }

      // Reintentar después de un breve retraso
      setTimeout(() => {
        try {
          const newProcess = startFFmpeg(camera, parseInt(streamId.replace('camera', '')) - 1);
          // Reemplazar el proceso en el array
          const procIndex = ffmpegProcesses.indexOf(ffmpegProcess);
          if (procIndex !== -1) {
            ffmpegProcesses[procIndex] = newProcess;
          }
        } catch (error) {
          logger.error(`Error al reiniciar stream para ${camera.name}: ${error.message}`);
        }
      }, 5000);
    }
  });

  return ffmpegProcess;
}

/**
 * Inicia streams para todas las cámaras activas
 * @returns {Promise<Array>} - Lista de cámaras activas
 */
async function startActiveStreams() {
  // Detener streams existentes
  stopAllStreams();

  // Limpiar archivos de streams anteriores
  try {
    const files = fs.readdirSync(STREAMS_DIR);
    for (const file of files) {
      if (file.endsWith('.m3u8') || file.endsWith('.ts')) {
        fs.unlinkSync(path.join(STREAMS_DIR, file));
      }
    }
    logger.info('Limpiados archivos de streams antiguos');
  } catch (error) {
    logger.error('Error al limpiar archivos de streams:', error);
  }

  // Obtener cámaras activas
  const cameras = await Camera.findAll({ active: true });
  logger.info(`Iniciando streaming para ${cameras.length} cámaras activas`);

  // Crear streams secuencialmente, no en paralelo
  ffmpegProcesses = [];

  for (let i = 0; i < cameras.length; i++) {
    const camera = cameras[i];
    try {
      const process = startFFmpeg(camera, i);
      ffmpegProcesses.push(process);
      
      // Pequeña pausa entre inicios de streams para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error(`Error iniciando stream para ${camera.name}: ${error.message}`);
    }
  }

  return cameras;
}

module.exports = {
  startActiveStreams,
  stopAllStreams
};