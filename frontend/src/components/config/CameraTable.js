// src/components/config/CameraTable.js
import React, { useState } from 'react';
import { useCameras } from '../../context/CameraContext';
import { toggleCameraActive, updateCameraDisplayName } from '../../services/cameraService';
import { formatRtspUrl } from '../../utils/formatters';
import ScanProgress from './ScanProgress';

/**
 * Tabla para configuración básica de cámaras
 */
const CameraTable = () => {
  const {
    allCameras,
    scanning,
    startScan,
    loadAllCameras,
    loadActiveCameras,
    apiUrl
  } = useCameras();

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleEditStart = (camera, idx) => {
    setEditingId(idx);
    setEditName(camera.displayName || camera.name);
  };

  const handleEditSave = async (id) => {
    try {
      await updateCameraDisplayName(apiUrl, id, editName);
      setEditingId(null);
      loadAllCameras();
      loadActiveCameras();
    } catch (error) {
      console.error('Error al actualizar nombre:', error);
      alert('Error al actualizar el nombre');
    }
  };

  const handleToggleActive = async (cameraIndex, active) => {
    try {
      await toggleCameraActive(apiUrl, cameraIndex, active);
      loadAllCameras();
      loadActiveCameras();
    } catch (error) {
      console.error('Error actualizando cámara:', error);
      alert('Error al cambiar estado de la cámara');
    }
  };

  return (
    <div className="camera-config-container">
      <div className="camera-config-header">
        <h2>Configuración de cámaras</h2>
        <button
          className={`scan-button ${scanning ? 'scanning' : ''}`}
          onClick={startScan}
          disabled={scanning}
        >
          {scanning ? 'Escaneando...' : 'Escanear cámaras'}
          {scanning && <span className="scan-spinner"></span>}
        </button>
      </div>

      {scanning && <ScanProgress />}

      {allCameras.length === 0 ? (
        <div className="no-cameras-found">
          <p>No se han encontrado cámaras. Haga clic en "Escanear cámaras" para buscar en la red.</p>
        </div>
      ) : (
        <div className="camera-list">
          <table className="camera-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Nombre</th>
                <th>Dirección IP</th>
                <th>URL RTSP</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {allCameras.map((cam, idx) => (
                <tr key={idx} className={cam.active ? 'camera-active' : 'camera-inactive'}>
                  <td>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={cam.active}
                        onChange={(e) => handleToggleActive(idx, e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </td>
                  <td>
                    {editingId === idx ? (
                      <div className="edit-name-container">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="edit-name-input"
                          autoFocus
                        />
                        <button 
                          className="save-edit-button"
                          onClick={() => handleEditSave(idx)}
                        >
                          ?
                        </button>
                        <button 
                          className="cancel-edit-button"
                          onClick={() => setEditingId(null)}
                        >
                          ?
                        </button>
                      </div>
                    ) : (
                      <div className="display-name-container">
                        <span>{cam.displayName || cam.name}</span>
                        <button
                          className="edit-button"
                          onClick={() => handleEditStart(cam, idx)}
                          title="Editar nombre"
                        >
                          ?
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="camera-ip">
                    {cam.ip || 'Desconocida'}
                  </td>
                  <td className="rtsp-url">{formatRtspUrl(cam.rtspUrl)}</td>
                  <td>
                    <button
                      className="camera-action-button"
                      onClick={() => handleToggleActive(idx, !cam.active)}
                    >
                      {cam.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="config-footer">
        <button className="save-button" onClick={() => window.location.reload()}>
          Guardar y Recargar
        </button>
      </div>
    </div>
  );
};

export default CameraTable;

// src/components/config/ScanProgress.js
export const ScanProgress = () => {
  return (
    <div className="scan-progress">
      <div className="scan-progress-bar">
        <div className="scan-progress-fill"></div>
      </div>
      <p>Buscando cámaras en la red. Esto puede tardar hasta 30 segundos...</p>
    </div>
  );
};

export default ScanProgress;