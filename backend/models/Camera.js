// backend/models/Camera.js
/**
 * Modelo para manipulación de datos de cámaras
 */
const fileService = require('../services/fileService');
const { extractIpFromRtspUrl } = require('../utils/streamUtils');

/**
 * Clase que representa el modelo de cámaras
 */
class Camera {
  /**
   * Obtiene todas las cámaras
   * @param {Object} options - Opciones de búsqueda
   * @returns {Promise<Array>} - Lista de cámaras
   */
  static async findAll(options = {}) {
    try {
      const cameras = await fileService.readCamerasFile();
      
      // Filtrar por estado activo si se especifica
      if (options.active !== undefined) {
        return cameras.filter(cam => cam.active === options.active);
      }
      
      return cameras;
    } catch (error) {
      console.error('Error al leer cámaras:', error);
      return [];
    }
  }
  
  /**
   * Encuentra una cámara por su ID
   * @param {number|string} id - ID de la cámara (índice en el array)
   * @returns {Promise<Object|null>} - Cámara encontrada o null
   */
  static async findById(id) {
    try {
      const cameras = await fileService.readCamerasFile();
      const index = parseInt(id, 10);
      
      if (isNaN(index) || index < 0 || index >= cameras.length) {
        return null;
      }
      
      return cameras[index];    
    } catch (error) {
      console.error('Error al buscar cámara por ID:', error);
      return null;
    }
  }
  
  /**
   * Encuentra una cámara por su URL RTSP
   * @param {string} rtspUrl - URL RTSP a buscar
   * @returns {Promise<Object|null>} - Cámara encontrada o null
   */
  static async findByRtspUrl(rtspUrl) {
    try {
      const cameras = await fileService.readCamerasFile();
      return cameras.find(camera => camera.rtspUrl === rtspUrl) || null;
    } catch (error) {
      console.error('Error al buscar cámara por URL RTSP:', error);
      return null;
    }
  }
  
  /**
   * Crea una nueva cámara
   * @param {Object} cameraData - Datos de la cámara
   * @returns {Promise<Object|null>} - Cámara creada o null en caso de error
   */
  static async create(cameraData) {
    try {
      const cameras = await fileService.readCamerasFile();
      
      // Extraer IP de la URL RTSP
      const ip = extractIpFromRtspUrl(cameraData.rtspUrl);
      
      // Crear objeto de cámara con IP
      const newCamera = {
        ...cameraData,
        ip,
        displayName: cameraData.displayName || cameraData.name
      };
      
      // Añadir a la lista
      cameras.push(newCamera);
      
      // Guardar cambios
      await fileService.saveCamerasFile(cameras);
      
      return newCamera;
    } catch (error) {
      console.error('Error al crear cámara:', error);
      return null;
    }
  }
  
  /**
   * Actualiza una cámara
   * @param {number|string} id - ID de la cámara
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object|null>} - Cámara actualizada o null
   */
  static async update(id, updateData) {
    try {
      const cameras = await fileService.readCamerasFile();
      const index = parseInt(id, 10);
      
      if (isNaN(index) || index < 0 || index >= cameras.length) {
        return null;
      }
      
      // Si se actualiza la URL RTSP, recalcular la IP
      if (updateData.rtspUrl) {
        updateData.ip = extractIpFromRtspUrl(updateData.rtspUrl);
      }
      
      // Actualizar cámara
      cameras[index] = {
        ...cameras[index],
        ...updateData
      };
      
      // Guardar cambios
      await fileService.saveCamerasFile(cameras);
      
      return cameras[index];
    } catch (error) {
      console.error('Error al actualizar cámara:', error);
      return null;
    }
  }
  
  /**
   * Elimina una cámara
   * @param {number|string} id - ID de la cámara
   * @returns {Promise<boolean>} - true si se eliminó correctamente
   */
  static async delete(id) {
    try {
      const cameras = await fileService.readCamerasFile();
      const index = parseInt(id, 10);
      
      if (isNaN(index) || index < 0 || index >= cameras.length) {
        return false;
      }
      
      // Eliminar cámara
      cameras.splice(index, 1);
      
      // Guardar cambios
      await fileService.saveCamerasFile(cameras);
      
      return true;
    } catch (error) {
      console.error('Error al eliminar cámara:', error);
      return false;
    }
  }
}

module.exports = Camera;