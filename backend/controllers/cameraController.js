// backend/controllers/cameraController.js
/**
 * Controlador para gestión de cámaras
 */
const Camera = require('../models/Camera');
const ffmpegService = require('../services/ffmpegService');
const scannerService = require('../services/scannerService');

/**
 * Obtiene todas las cámaras 
 */
const getAllCameras = async (req, res) => {
  try {
    const cameras = await Camera.findAll();
    res.json(cameras);
  } catch (error) {
    res.status(500).json({ error: 'Error al leer las cámaras' });
  }
};

/**
 * Obtiene sólo las cámaras activas
 */
const getActiveCameras = async (req, res) => {
  try {
    const cameras = await Camera.findAll({ active: true });
    const activeCameras = cameras.map((cam, i) => ({
      id: i,
      name: cam.name,
      displayName: cam.displayName,
      ip: cam.ip,
      hlsUrl: `/streams/camera${i + 1}.m3u8`,
      rtspUrl: cam.rtspUrl
    }));

    res.json(activeCameras);
  } catch (error) {
    res.status(500).json({ error: 'Error al leer las cámaras activas' });
  }
};

/**
 * Inicia el escaneo de cámaras en la red
 */
const scanCameras = async (req, res) => {
  try {
    const scanOptions = {
      startIp: process.env.START_IP || '192.168.1.1',
      endIp: process.env.END_IP || '192.168.1.254',
      concurrency: parseInt(process.env.SCAN_CONCURRENCY || '5', 10),
      timeout: parseInt(process.env.RTSP_TIMEOUT_MS || '500', 50),
      username: process.env.VIEWER_USER || 'admin',
      password: process.env.VIEWER_PASS || 'admin123',
      camerasFile: process.env.CAMERAS_FILE || './cameras.json'
    };

    // Responder inmediatamente y hacer el escaneo en segundo plano
    res.json({ message: 'Escaneo iniciado', scanOptions });

    // Ejecutar el escaneo
    console.log('?? Iniciando escaneo de cámaras en la red...');
    await scannerService.scanNetworkForCameras(scanOptions);

    // Reiniciar los streams después del escaneo
    await ffmpegService.startActiveStreams();
  } catch (error) {
    console.error('? Error en escaneo:', error);
  }
};

/**
 * Actualiza el estado de una cámara
 */
const updateCameraStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({ error: 'El campo "active" debe ser un booleano' });
    }

    const result = await Camera.update(id, { active });
    if (!result) {
      return res.status(404).json({ error: 'Cámara no encontrada' });
    }

    // Reiniciar streams para aplicar cambios
    await ffmpegService.startActiveStreams();

    res.json({ message: 'Cámara actualizada correctamente', camera: result });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la cámara' });
  }
};

/**
 * Actualiza el nombre de visualización de una cámara
 */
const updateCameraDisplayName = async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName } = req.body;

    if (!displayName || typeof displayName !== 'string') {
      return res.status(400).json({ error: 'Se requiere un nombre válido' });
    }

    const result = await Camera.update(id, { displayName });
    if (!result) {
      return res.status(404).json({ error: 'Cámara no encontrada' });
    }

    res.json({ message: 'Nombre de cámara actualizado', camera: result });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el nombre de la cámara' });
  }
};

/**
 * Añade una nueva cámara
 */
const addCamera = async (req, res) => {
  try {
    const { name, rtspUrl, active } = req.body;
    
    if (!name || !rtspUrl) {
      return res.status(400).json({ error: 'El nombre y la URL RTSP son obligatorios' });
    }
    
    // Verificar si la URL ya existe
    const existingCamera = await Camera.findByRtspUrl(rtspUrl);
    if (existingCamera) {
      return res.status(400).json({ error: 'Ya existe una cámara con esa URL RTSP' });
    }
    
    // Añadir nueva cámara
    const newCamera = await Camera.create({
      name,
      rtspUrl,
      active: active !== undefined ? active : true
    });
    
    // Reiniciar streams si la cámara está activa
    if (newCamera.active) {
      await ffmpegService.startActiveStreams();
    }
    
    res.status(201).json({ 
      message: 'Cámara añadida correctamente', 
      camera: newCamera 
    });
  } catch (error) {
    console.error('Error al añadir cámara:', error);
    res.status(500).json({ error: 'Error interno al añadir cámara' });
  }
};

/**
 * Actualiza todos los datos de una cámara
 */
const updateCamera = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rtspUrl, active } = req.body;
    
    if (!name || !rtspUrl) {
      return res.status(400).json({ error: 'El nombre y la URL RTSP son obligatorios' });
    }
    
    // Obtener cámara actual
    const currentCamera = await Camera.findById(id);
    if (!currentCamera) {
      return res.status(404).json({ error: 'Cámara no encontrada' });
    }
    
    // Guardar estado anterior
    const wasActive = currentCamera.active;
    
    // Actualizar cámara
    const updatedCamera = await Camera.update(id, {
      name,
      rtspUrl,
      active: active !== undefined ? active : currentCamera.active
    });
    
    // Reiniciar streams si cambió el estado o URL
    if (wasActive !== updatedCamera.active || updatedCamera.active) {
      await ffmpegService.startActiveStreams();
    }
    
    res.json({ 
      message: 'Cámara actualizada correctamente', 
      camera: updatedCamera
    });
  } catch (error) {
    console.error('Error al actualizar cámara:', error);
    res.status(500).json({ error: 'Error interno al actualizar cámara' });
  }
};

/**
 * Elimina una cámara
 */
const deleteCamera = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si cámara existe
    const camera = await Camera.findById(id);
    if (!camera) {
      return res.status(404).json({ error: 'Cámara no encontrada' });
    }
    
    // Guardar estado
    const wasActive = camera.active;
    
    // Eliminar cámara
    await Camera.delete(id);
    
    // Reiniciar streams si era activa
    if (wasActive) {
      await ffmpegService.startActiveStreams();
    }
    
    res.json({ 
      message: 'Cámara eliminada correctamente', 
      deletedCamera: camera 
    });
  } catch (error) {
    console.error('Error al eliminar cámara:', error);
    res.status(500).json({ error: 'Error interno al eliminar cámara' });
  }
};

/**
 * Reinicia todos los streams de cámaras
 */
const restartStreams = async (req, res) => {
  try {
    console.log('?? Reiniciando todos los streams...');
    const activeCameras = await ffmpegService.startActiveStreams();

    res.json({
      message: `Streams reiniciados correctamente. ${activeCameras.length} cámaras activas.`,
      activeCameras: activeCameras.map(cam => cam.name)
    });
  } catch (error) {
    console.error('Error al reiniciar streams:', error);
    res.status(500).json({ error: 'Error al reiniciar los streams de vídeo' });
  }
};

module.exports = {
  getAllCameras,
  getActiveCameras,
  scanCameras,
  updateCameraStatus,
  updateCameraDisplayName,
  addCamera,
  updateCamera,
  deleteCamera,
  restartStreams
};