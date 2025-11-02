// src/services/cameraService.js
/**
 * Servicio para gestionar operaciones relacionadas con cámaras
 */

/**
 * Obtiene las cámaras activas
 * @param {string} apiUrl - URL base de la API
 * @returns {Promise<Array>} - Lista de cámaras activas
 */
export const fetchCameras = async (apiUrl) => {
  const response = await fetch(`${apiUrl}/api/cameras`);
  if (!response.ok) {
    throw new Error('Error en la respuesta del servidor');
  }
  return response.json();
};

/**
 * Obtiene todas las cámaras (activas e inactivas)
 * @param {string} apiUrl - URL base de la API
 * @returns {Promise<Array>} - Lista de todas las cámaras
 */
export const fetchAllCameras = async (apiUrl) => {
  const response = await fetch(`${apiUrl}/api/cameras/all`);
  if (!response.ok) {
    throw new Error('Error en la respuesta del servidor');
  }
  return response.json();
};

/**
 * Inicia un escaneo de cámaras en la red
 * @param {string} apiUrl - URL base de la API
 * @returns {Promise<Object>} - Resultado del escaneo
 */
export const scanNetwork = async (apiUrl) => {
  const response = await fetch(`${apiUrl}/api/cameras/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

/**
 * Reinicia todos los streams de cámaras
 * @param {string} apiUrl - URL base de la API
 * @returns {Promise<Object>} - Resultado del reinicio
 */
export const restartStreams = async (apiUrl) => {
  const response = await fetch(`${apiUrl}/api/cameras/restart-streams`, {
    method: 'POST'
  });
  return response.json();
};

/**
 * Cambia el estado activo/inactivo de una cámara
 * @param {string} apiUrl - URL base de la API
 * @param {number} cameraId - ID de la cámara
 * @param {boolean} active - Estado activo (true) o inactivo (false)
 * @returns {Promise<Object>} - Resultado de la actualización
 */
export const toggleCameraActive = async (apiUrl, cameraId, active) => {
  const response = await fetch(`${apiUrl}/api/cameras/${cameraId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ active })
  });
  return response.json();
};

/**
 * Actualiza el nombre personalizado de una cámara
 * @param {string} apiUrl - URL base de la API
 * @param {number} cameraId - ID de la cámara
 * @param {string} displayName - Nuevo nombre de visualización
 * @returns {Promise<Object>} - Resultado de la actualización
 */
export const updateCameraDisplayName = async (apiUrl, cameraId, displayName) => {
  const response = await fetch(`${apiUrl}/api/cameras/${cameraId}/display-name`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ displayName })
  });
  return response.json();
};

/**
 * Añade una nueva cámara
 * @param {string} apiUrl - URL base de la API
 * @param {Object} cameraData - Datos de la cámara
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const addCamera = async (apiUrl, cameraData) => {
  const response = await fetch(`${apiUrl}/api/cameras/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cameraData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al añadir cámara');
  }
  return response.json();
};

/**
 * Actualiza una cámara existente
 * @param {string} apiUrl - URL base de la API
 * @param {number} cameraId - ID de la cámara
 * @param {Object} cameraData - Datos actualizados de la cámara
 * @returns {Promise<Object>} - Resultado de la actualización
 */
export const updateCamera = async (apiUrl, cameraId, cameraData) => {
  const response = await fetch(`${apiUrl}/api/cameras/${cameraId}/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cameraData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al actualizar cámara');
  }
  return response.json();
};

/**
 * Elimina una cámara
 * @param {string} apiUrl - URL base de la API
 * @param {number} cameraId - ID de la cámara
 * @returns {Promise<Object>} - Resultado de la eliminación
 */
export const deleteCamera = async (apiUrl, cameraId) => {
  const response = await fetch(`${apiUrl}/api/cameras/${cameraId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al eliminar cámara');
  }
  return response.json();
};