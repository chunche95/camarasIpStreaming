// src/components/dev/DevMode.js
import React, { useState } from 'react';
import { useCameras } from '../../context/CameraContext';
import { addCamera, updateCamera, deleteCamera } from '../../services/cameraService';
import { formatRtspUrl } from '../../utils/formatters';
import DevCameraTable from './DevCameraTable';
import DevTools from './DevTools';
import SystemInfo from './SystemInfo';

/**
 * Componente de modo desarrollador con herramientas avanzadas
 */
const DevMode = () => {
  const {
    allCameras,
    apiUrl,
    loadAllCameras,
    loadActiveCameras
  } = useCameras();

  const [newCamera, setNewCamera] = useState({
    name: '',
    rtspUrl: '',
    active: true
  });

  const [editingCamera, setEditingCamera] = useState(null);

  /**
   * Añade una nueva cámara
   */
  const handleAddCamera = async () => {
    try {
      // Validación básica
      if (!newCamera.name || !newCamera.rtspUrl) {
        alert('El nombre y la URL RTSP son obligatorios');
        return;
      }
      
      await addCamera(apiUrl, newCamera);
      
      // Resetear formulario y recargar cámaras
      setNewCamera({
        name: '',
        rtspUrl: '',
        active: true
      });
      
      loadAllCameras();
      loadActiveCameras();
    } catch (error) {
      console.error('Error añadiendo cámara:', error);
      alert(`Error: ${error.message}`);
    }
  };
  
  /**
   * Actualiza una cámara existente
   */
  const handleUpdateCamera = async (id, cameraData) => {
    try {
      await updateCamera(apiUrl, id, cameraData);
      setEditingCamera(null);
      await loadAllCameras();
      await loadActiveCameras();
    } catch (error) {
      console.error('Error actualizando cámara:', error);
      alert(`Error: ${error.message}`);
    }
  };
  
  /**
   * Elimina una cámara
   */
  const handleDeleteCamera = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta cámara?')) return;
    
    try {
      await deleteCamera(apiUrl, id);
      await loadAllCameras();
      await loadActiveCameras();
    } catch (error) {
      console.error('Error eliminando cámara:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="dev-mode-container">
      <div className="dev-mode-header">
        <h3>?? Modo Desarrollador</h3>
        {/* No incluimos botón de cierre aquí ya que se maneja desde el padre */}
      </div>
      
      <div className="dev-mode-section">
        <h4>Añadir Nueva Cámara</h4>
        <div className="dev-form">
          <div className="dev-form-group">
            <label>Nombre:</label>
            <input 
              type="text" 
              value={newCamera.name} 
              onChange={e => setNewCamera({...newCamera, name: e.target.value})}
              placeholder="Ej: Cámara Entrada"
            />
          </div>
          
          <div className="dev-form-group">
            <label>URL RTSP:</label>
            <input 
              type="text" 
              value={newCamera.rtspUrl} 
              onChange={e => setNewCamera({...newCamera, rtspUrl: e.target.value})}
              placeholder="rtsp://usuario:contraseña@ip:puerto/path"
            />
          </div>
          
          <div className="dev-form-group">
            <label>
              <input 
                type="checkbox" 
                checked={newCamera.active} 
                onChange={e => setNewCamera({...newCamera, active: e.target.checked})}
              />
              Activa
            </label>
          </div>
          
          <button className="dev-form-button" onClick={handleAddCamera}>Añadir Cámara</button>
        </div>
      </div>
      
      <DevTools />
      
      <div className="dev-mode-section">
        <h4>Tabla de Cámaras (CRUD)</h4>
        <DevCameraTable 
          cameras={allCameras}
          editingId={editingCamera}
          setEditingId={setEditingCamera}
          onUpdate={handleUpdateCamera}
          onDelete={handleDeleteCamera}
          formatRtspUrl={formatRtspUrl}
        />
      </div>
      
      <SystemInfo />
    </div>
  );
};

export default DevMode;

// src/components/dev/DevTools.js
export const DevTools = () => {
  const { apiUrl, startScan, handleRestartStreams } = useCameras();

  const handleScanClick = () => {
    startScan();
    alert('Escaneo de cámaras iniciado');
  };

  const handleRestartClick = async () => {
    try {
      const data = await handleRestartStreams();
      alert(`Streams reiniciados: ${data.message}`);
    } catch (error) {
      alert('Error al reiniciar streams');
    }
  };

  return (
    <div className="dev-mode-section">
      <h4>Herramientas Avanzadas</h4>
      <div className="dev-tools">
        <button 
          className="dev-tool-button"
          onClick={handleScanClick}
        >
          Forzar Escaneo de Red
        </button>
        
        <button 
          className="dev-tool-button"
          onClick={handleRestartClick}
        >
          Reiniciar Todos los Streams
        </button>
      </div>
    </div>
  );
};

// src/components/dev/SystemInfo.js
export const SystemInfo = () => {
  const { cameras, allCameras, apiUrl } = useCameras();

  return (
    <div className="dev-mode-section">
      <h4>Información del Sistema</h4>
      <div className="system-info">
        <div><strong>API URL:</strong> {apiUrl}</div>
        <div><strong>Cámaras Activas:</strong> {cameras.length}</div>
        <div><strong>Total Cámaras:</strong> {allCameras.length}</div>
        <div><strong>Fecha:</strong> {new Date().toLocaleString()}</div>
      </div>
    </div>
  );
};

// src/components/dev/DevCameraTable.js
export const DevCameraTable = ({ 
  cameras, 
  editingId, 
  setEditingId, 
  onUpdate, 
  onDelete,
  formatRtspUrl
}) => {
  const [editedCamera, setEditedCamera] = useState(null);

  // Inicializar cámara editada cuando cambia el ID
  React.useEffect(() => {
    if (editingId !== null) {
      setEditedCamera({...cameras[editingId]});
    } else {
      setEditedCamera(null);
    }
  }, [editingId, cameras]);

  // Si no hay datos de cámaras, mostrar mensaje
  if (!cameras || cameras.length === 0) {
    return <p>No hay cámaras configuradas.</p>;
  }

  return (
    <table className="dev-mode-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>IP</th>
          <th>URL RTSP</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {cameras.map((camera, idx) => (
          <tr key={idx} className={camera.active ? 'camera-active' : 'camera-inactive'}>
            <td>{idx}</td>
            <td>
              {editingId === idx && editedCamera ? (
                <input 
                  type="text" 
                  value={editedCamera.name} 
                  onChange={e => setEditedCamera({...editedCamera, name: e.target.value})}
                />
              ) : (
                camera.name
              )}
            </td>
            <td>
              {camera.ip || camera.rtspUrl.match(/@([^:]+):/) ?
                camera.ip || camera.rtspUrl.match(/@([^:]+):/)[1] : 
                'Desconocida'}
            </td>
            <td>
              {editingId === idx && editedCamera ? (
                <input 
                  type="text" 
                  value={editedCamera.rtspUrl} 
                  onChange={e => setEditedCamera({...editedCamera, rtspUrl: e.target.value})}
                  className="rtsp-url-input"
                />
              ) : (
                <div className="rtsp-url-container">
                  {formatRtspUrl(camera.rtspUrl)}
                </div>
              )}
            </td>
            <td>
              {editingId === idx && editedCamera ? (
                <select
                  value={editedCamera.active ? 'true' : 'false'}
                  onChange={e => setEditedCamera({...editedCamera, active: e.target.value === 'true'})}
                >
                  <option value="true">Activa</option>
                  <option value="false">Inactiva</option>
                </select>
              ) : (
                <span className={`status-badge ${camera.active ? 'active' : 'inactive'}`}>
                  {camera.active ? 'Activa' : 'Inactiva'}
                </span>
              )}
            </td>
            <td className="action-cell">
              {editingId === idx ? (
                <>
                  <button 
                    className="save-button" 
                    onClick={() => onUpdate(idx, editedCamera)}
                    title="Guardar cambios"
                  >
                    ??
                  </button>
                  <button 
                    className="cancel-button" 
                    onClick={() => setEditingId(null)}
                    title="Cancelar"
                  >
                    ?
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="edit-button" 
                    onClick={() => setEditingId(idx)}
                    title="Editar"
                  >
                    ??
                  </button>
                  // Continuación de src/components/dev/DevCameraTable.js
                  <button 
                    className="delete-button" 
                    onClick={() => onDelete(idx)}
                    title="Eliminar"
                  >
                    ???
                  </button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DevCameraTable;