// backend/server.js - Versión mínima
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { promisify } = require('util');
const fsPromises = fs.promises;

// Inicializar la aplicación
const app = express();
const PORT = process.env.PORT || 3033;
const STREAMS_DIR = path.join(__dirname, 'streams');
const CAMERAS_FILE = process.env.CAMERAS_FILE || './data/cameras.json';

// Configurar middleware
app.use(cors());
app.use(express.json());

// Asegurar que el directorio de streams exista
if (!fs.existsSync(STREAMS_DIR)) {
  fs.mkdirSync(STREAMS_DIR, { recursive: true });
  console.log(`?? Directorio de streams creado en ${STREAMS_DIR}`);
}

// Asegurar que el directorio de datos exista
const dataDir = path.dirname(CAMERAS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`?? Directorio de datos creado en ${dataDir}`);
}

// Asegurar que el archivo de cámaras exista
if (!fs.existsSync(CAMERAS_FILE)) {
  fs.writeFileSync(CAMERAS_FILE, '[]');
  console.log(`?? Archivo de cámaras creado en ${CAMERAS_FILE}`);
}

// Servir archivos HLS
app.use('/streams', express.static(STREAMS_DIR));

// Array para mantener los procesos FFmpeg activos
let ffmpegProcesses = [];

// Función para leer el archivo de cámaras
async function readCamerasFile() {
  try {
    const data = await fsPromises.readFile(CAMERAS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`? Error al leer el archivo de cámaras: ${error.message}`);
    return [];
  }
}

// Función para guardar el archivo de cámaras
async function saveCamerasFile(cameras) {
  try {
    await fsPromises.writeFile(
      CAMERAS_FILE,
      JSON.stringify(cameras, null, 2)
    );
    return true;
  } catch (error) {
    console.error(`? Error al guardar el archivo de cámaras: ${error.message}`);
    return false;
  }
}

// Función para detener todos los procesos FFmpeg activos
function stopAllStreams() {
  console.log('?? Deteniendo todos los procesos FFmpeg...');
  ffmpegProcesses.forEach(process => {
    if (process && !process.killed) {
      process.kill('SIGTERM');
    }
  });
  ffmpegProcesses = [];
}

// Función para iniciar un proceso FFmpeg
function startFFmpeg(camera, index) {
  // Usar el streamId único o generar uno basado en el índice
  const streamId = `camera${index + 1}`;
  const streamPath = path.join(STREAMS_DIR, `${streamId}.m3u8`);
  const segmentPath = path.join(STREAMS_DIR, `${streamId}_%03d.ts`);

  console.log(`?? Iniciando streaming para '${camera.name}' (ID: ${streamId})...`);
  console.log(`   RTSP URL: ${camera.rtspUrl}`);
  console.log(`   Stream Path: ${streamPath}`);

  // Parámetros FFmpeg básicos
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

  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

  ffmpegProcess.stderr.on('data', (data) => {
    const output = data.toString();
    // Registrar mensajes clave para debugging
    if (output.includes('Error') || output.includes('error') || output.includes('fail')) {
      console.error(`?? [${camera.name}]:`, output.trim());
    }
  });

  ffmpegProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`? FFmpeg terminó con código ${code} para '${camera.name}'`);
      console.log(`?? Reiniciando streaming para '${camera.name}'...`);

      // Verificar si los archivos HLS existen y crearlos si no
      try {
        // Crear un archivo m3u8 vacío para evitar errores 404
        fs.writeFileSync(streamPath, '#EXTM3U\n#EXT-X-VERSION:3\n');
      } catch (error) {
        console.error(`Error creando archivo HLS temporal: ${error.message}`);
      }

      // Reintentar después de un breve retraso
      setTimeout(() => {
        const newProcess = startFFmpeg(camera, index);
        // Reemplazar el proceso en el array
        const procIndex = ffmpegProcesses.indexOf(ffmpegProcess);
        if (procIndex !== -1) {
          ffmpegProcesses[procIndex] = newProcess;
        }
      }, 5000);
    }
  });

  return ffmpegProcess;
}

// Función para iniciar streams basados en cámaras activas
async function startActiveStreams() {
  stopAllStreams(); // Detener streams existentes

  // Limpiar archivos de streams anteriores
  try {
    const files = fs.readdirSync(STREAMS_DIR);
    for (const file of files) {
      if (file.endsWith('.m3u8') || file.endsWith('.ts')) {
        fs.unlinkSync(path.join(STREAMS_DIR, file));
      }
    }
    console.log('?? Limpiados archivos de streams antiguos');
  } catch (error) {
    console.error('Error al limpiar archivos de streams:', error);
  }

  const cameras = await readCamerasFile();
  const activeCameras = cameras.filter(cam => cam.active === true);

  console.log(`?? Iniciando streaming para ${activeCameras.length} cámaras activas`);

  // Crear streams secuencialmente, no en paralelo
  ffmpegProcesses = [];

  for (let i = 0; i < activeCameras.length; i++) {
    const camera = activeCameras[i];
    const process = startFFmpeg(camera, i);
    ffmpegProcesses.push(process);

    // Pequeña pausa entre inicios de streams para evitar sobrecarga
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return activeCameras;
}

// ===== RUTAS API =====

// Obtener todas las cámaras (activas e inactivas)
app.get('/api/cameras/all', async (req, res) => {
  try {
    const cameras = await readCamerasFile();
    res.json(cameras);
  } catch (error) {
    res.status(500).json({ error: 'Error al leer las cámaras' });
  }
});

// Obtener solo cámaras activas para streaming
app.get('/api/cameras', async (req, res) => {
  try {
    const cameras = await readCamerasFile();
    const activeCameras = cameras
      .filter(cam => cam.active === true)
      .map((cam, i) => ({
        id: i,
        name: cam.name,
        displayName: cam.displayName || cam.name,
        ip: cam.ip || cam.rtspUrl.match(/@([^:]+):/) ? cam.rtspUrl.match(/@([^:]+):/)[1] : null,
        hlsUrl: `/streams/camera${i + 1}.m3u8`,
        rtspUrl: cam.rtspUrl
      }));

    res.json(activeCameras);
  } catch (error) {
    res.status(500).json({ error: 'Error al leer las cámaras activas' });
  }
});

// Iniciar un escaneo de cámaras en la red
app.post('/api/cameras/scan', async (req, res) => {
  try {
    // Opciones de escaneo
    const scanOptions = {
      startIp: process.env.START_IP || '192.168.1.1',
      endIp: process.env.END_IP || '192.168.1.254',
      concurrency: parseInt(process.env.SCAN_CONCURRENCY || '5', 10),
      timeout: parseInt(process.env.RTSP_TIMEOUT_MS || '500', 10),
      username: process.env.VIEWER_USER || 'admin',
      password: process.env.VIEWER_PASS || 'admin123'
    };

    // Responder inmediatamente y simular "escaneo" 
    res.json({ message: 'Escaneo iniciado', scanOptions });

    // En una implementación real, aquí llamaríamos a un servicio de escaneo
    // Por ahora, añadir una cámara de ejemplo tras un retraso
    setTimeout(async () => {
      const cameras = await readCamerasFile();
      
      // Añadir solo si no existe ya
      if (!cameras.some(c => c.rtspUrl.includes('192.168.1.100'))) {
        cameras.push({
          name: 'Cámara Ejemplo',
          rtspUrl: `rtsp://${scanOptions.username}:${scanOptions.password}@192.168.1.100:554/h264Preview_01_main`,
          active: true,
          ip: '192.168.1.100'
        });
        
        await saveCamerasFile(cameras);
      }
      
      await startActiveStreams();
    }, 5000);
  } catch (error) {
    console.error('? Error en escaneo:', error);
  }
});

// Actualizar estado de las cámaras (activar/desactivar)
app.put('/api/cameras/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({ error: 'El campo "active" debe ser un booleano' });
    }

    const cameras = await readCamerasFile();
    const index = cameras.findIndex((cam, idx) => idx.toString() === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Cámara no encontrada' });
    }

    // Actualizar estado
    cameras[index].active = active;

    // Guardar cambios
    await saveCamerasFile(cameras);

    // Reiniciar streams para aplicar cambios
    await startActiveStreams();

    res.json({ message: 'Cámara actualizada correctamente', camera: cameras[index] });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la cámara' });
  }
});

// Actualizar nombre de cámara
app.put('/api/cameras/:id/display-name', async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName } = req.body;

    if (!displayName || typeof displayName !== 'string') {
      return res.status(400).json({ error: 'Se requiere un nombre válido' });
    }

    const cameras = await readCamerasFile();
    const index = cameras.findIndex((cam, idx) => idx.toString() === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Cámara no encontrada' });
    }

    // Actualizar nombre
    cameras[index].displayName = displayName;

    // Guardar cambios
    await saveCamerasFile(cameras);

    res.json({ message: 'Nombre de cámara actualizado', camera: cameras[index] });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el nombre de la cámara' });
  }
});

// Endpoint para reiniciar los streams (útil para debugging)
app.post('/api/cameras/restart-streams', async (req, res) => {
  try {
    console.log('?? Reiniciando todos los streams...');

    // Forzar la recreación de todos los streams
    const activeCameras = await startActiveStreams();

    res.json({
      message: `Streams reiniciados correctamente. ${activeCameras.length} cámaras activas.`,
      activeCameras: activeCameras.map(cam => cam.name)
    });
  } catch (error) {
    console.error('Error al reiniciar streams:', error);
    res.status(500).json({ error: 'Error al reiniciar los streams de vídeo' });
  }
});

// Añadir una cámara
app.post('/api/cameras/add', async (req, res) => {
  try {
    const { name, rtspUrl, active } = req.body;
    
    if (!name || !rtspUrl) {
      return res.status(400).json({ error: 'El nombre y la URL RTSP son obligatorios' });
    }
    
    // Leer cámaras existentes
    const cameras = await readCamerasFile();
    
    // Verificar si la URL ya existe
    const existingCamera = cameras.find(cam => cam.rtspUrl === rtspUrl);
    if (existingCamera) {
      return res.status(400).json({ error: 'Ya existe una cámara con esa URL RTSP' });
    }
    
    // Extraer IP de la URL RTSP
    const ipMatch = rtspUrl.match(/@([^:]+):/);
    const ip = ipMatch ? ipMatch[1] : null;
    
    // Añadir nueva cámara
    const newCamera = {
      name,
      rtspUrl,
      active: active !== undefined ? active : true,
      ip
    };
    
    cameras.push(newCamera);
    
    // Guardar cambios
    await saveCamerasFile(cameras);
    
    // Reiniciar streams si la cámara está activa
    if (newCamera.active) {
      await startActiveStreams();
    }
    
    res.status(201).json({ 
      message: 'Cámara añadida correctamente', 
      camera: newCamera 
    });
  } catch (error) {
    console.error('Error al añadir cámara:', error);
    res.status(500).json({ error: 'Error interno al añadir cámara' });
  }
});

// Eliminar una cámara
app.delete('/api/cameras/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const index = parseInt(id, 10);
    
    const cameras = await readCamerasFile();
    
    if (isNaN(index) || index < 0 || index >= cameras.length) {
      return res.status(404).json({ error: 'Cámara no encontrada' });
    }
    
    // Guardamos una referencia de si estaba activa
    const wasActive = cameras[index].active;
    
    // Eliminar cámara
    const deletedCamera = cameras.splice(index, 1)[0];
    
    // Guardar cambios
    await saveCamerasFile(cameras);
    
    // Reiniciar streams si la cámara estaba activa
    if (wasActive) {
      await startActiveStreams();
    }
    
    res.json({ 
      message: 'Cámara eliminada correctamente', 
      deletedCamera 
    });
  } catch (error) {
    console.error('Error al eliminar cámara:', error);
    res.status(500).json({ error: 'Error interno al eliminar cámara' });
  }
});

// Servir archivos estáticos (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Manejar la terminación de la aplicación
process.on('SIGINT', () => {
  console.log('?? Deteniendo todos los procesos FFmpeg...');
  stopAllStreams();
  process.exit(0);
});

// Iniciar streams al arrancar
startActiveStreams().then(cameras => {
  console.log(`? Streaming iniciado para ${cameras.length} cámaras`);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`?? Servidor streaming iniciado en http://localhost:${PORT}`);
});