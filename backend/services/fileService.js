// backend/services/fileService.js
/**
 * Servicio para gestión de archivos de cámaras
 */
const fs = require('fs').promises;
const { extractIpFromRtspUrl } = require('../utils/streamUtils');
const loggerUtil = require('../utils/loggerUtil');

/**
 * Lee el archivo de cámaras y lo procesa
 * @returns {Promise<Array>} - Lista de cámaras con información adicional
 */
async function readCamerasFile() {
  const CAMERAS_FILE = process.env.CAMERAS_FILE || './cameras.json';
  
  try {
    const data = await fs.readFile(CAMERAS_FILE, 'utf8');
    const cameras = JSON.parse(data);
    
    // Añadir información adicional a cada cámara
    return cameras.map(camera => {
      const ip = extractIpFromRtspUrl(camera.rtspUrl);
      return {
        ...camera,
        ip,
        // Generar nombre de visualización si no existe
        displayName: camera.displayName || camera.name
      };
    });
  } catch (error) {
    loggerUtil.error(`Error al leer el archivo de cámaras: ${error.message}`);
    return [];
  }
}

/**
 * Guarda la lista de cámaras en el archivo
 * @param {Array} cameras - Lista de cámaras a guardar
 * @returns {Promise<boolean>} - true si se guardó correctamente
 */
async function saveCamerasFile(cameras) {
  const CAMERAS_FILE = process.env.CAMERAS_FILE || './cameras.json';
  
  try {
    // Filtrar propiedades calculadas antes de guardar
    const camerasToSave = cameras.map(camera => {
      // Conservamos displayName para persistencia
      const { ipId, ...cameraData } = camera;
      return cameraData;
    });
    
    await fs.writeFile(
      CAMERAS_FILE,
      JSON.stringify(camerasToSave, null, 2)
    );
    return true;
  } catch (error) {
    loggerUtil.error(`Error al guardar el archivo de cámaras: ${error.message}`);
    return false;
  }
}

module.exports = {
  readCamerasFile,
  saveCamerasFile
};