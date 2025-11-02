// frontend/src/App.js - Versión mínima
import React, { useEffect, useState } from 'react';
import './App.css';

// Componente para streams de cámaras
const CameraStream = ({ streamUrl, cameraName, cameraIp, fitToContainer = true }) => {
  const videoRef = React.useRef(null);
  const [status, setStatus] = useState('loading'); // loading, playing, error, offline

  useEffect(() => {
    let hls = null;
    
    const initPlayer = () => {
      // Verificar si el navegador es compatible con HLS.js
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);
        
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          setStatus('playing');
          videoRef.current.play().catch(e => console.error('Error al reproducir:', e));
        });
        
        hls.on(window.Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setStatus('error');
          }
        });
      } 
      // Safari tiene soporte nativo para HLS
      else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = streamUrl;
        videoRef.current.addEventListener('loadedmetadata', () => {
          setStatus('playing');
          videoRef.current.play().catch(e => console.error('Error al reproducir:', e));
        });
        
        videoRef.current.addEventListener('error', () => {
          setStatus('error');
        });
      } else {
        setStatus('error');
      }
    };

    // Inicializar el reproductor
    initPlayer();
    
    // Limpiar al desmontar
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamUrl, cameraName]);

  return (
    <div className={`video-container ${fitToContainer ? 'fit-mode' : 'natural-mode'}`}>
      {status === 'loading' && (
        <div className="video-overlay loading">
          <div className="video-spinner"></div>
          <div className="connection-status">CONECTANDO</div>
        </div>
      )}
      
      {status === 'error' && (
        <div className="video-overlay error">
          <div className="error-message">
            <p>No se puede conectar al stream</p>
            <button onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        </div>
      )}
      
      {cameraIp && (
        <div className="connection-info">
          <div className={`connection-status-indicator ${status === 'error' ? 'error' : ''}`}></div>
          <span className="ip">{cameraIp}</span>
        </div>
      )}
      
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline 
        className={status === 'playing' ? 'video-playing' : ''}
      ></video>
    </div>
  );
};

// Componente principal
function App() {
  const [cameras, setCameras] = useState([]);
  const [allCameras, setAllCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [layout, setLayout] = useState('grid');
  const [modalCamera, setModalCamera] = useState(null);
  const [showCameraSelector, setShowCameraSelector] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  // Contador para modo desarrollador (presionar D cinco veces)
  const [devModeCounter, setDevModeCounter] = useState(0);
  const [devMode, setDevMode] = useState(false);
  const devModeTimeout = React.useRef(null);

  const apiUrl = process.env.REACT_APP_API_URL || '';

  // Handler para activar DevMode (5 pulsaciones de "D")
  const handleKeyDown = React.useCallback((e) => {
    if (e.key.toLowerCase() === 'd') {
      setDevModeCounter(prev => {
        const newCount = prev + 1;
        
        // Limpiar timeout anterior
        if (devModeTimeout.current) {
          clearTimeout(devModeTimeout.current);
        }
        
        // Configurar nuevo timeout (2 segundos)
        devModeTimeout.current = setTimeout(() => {
          setDevModeCounter(0);
        }, 2000);
        
        // Activar DevMode si se llega a 5
        if (newCount >= 5) {
          setDevMode(true);
          return 0;
        }
        
        return newCount;
      });
    }
  }, []);

  // Efecto para añadir/quitar listener de teclado
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Cargar cámaras activas
  const loadActiveCameras = () => {
    setLoading(true);
    fetch(`${apiUrl}/api/cameras`)
      .then(res => {
        if (!res.ok) throw new Error('Error en la respuesta del servidor');
        return res.json();
      })
      .then(data => {
        setCameras(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error obteniendo cámaras:', err);
        setError('No se pudieron cargar las cámaras');
        setLoading(false);
      });
  };

  // Cargar todas las cámaras (activas e inactivas)
  const loadAllCameras = () => {
    fetch(`${apiUrl}/api/cameras/all`)
      .then(res => {
        if (!res.ok) throw new Error('Error en la respuesta del servidor');
        return res.json();
      })
      .then(data => {
        setAllCameras(data);
      })
      .catch(err => {
        console.error('Error obteniendo todas las cámaras:', err);
      });
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadActiveCameras();
    loadAllCameras();
    
    // Cargar script de HLS.js
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, [apiUrl]);

  // Iniciar escaneo de cámaras
  const startScan = () => {
    setScanning(true);
    fetch(`${apiUrl}/api/cameras/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        // Programar una secuencia de actualizaciones para mostrar progreso
        setTimeout(() => {
          loadAllCameras(); // Cargar primera actualización después de 5 segundos
        }, 5000);

        setTimeout(() => {
          loadAllCameras(); // Actualizar después de 15 segundos
        }, 15000);

        setTimeout(() => {
          // Finalizar escaneo tras 30 segundos
          setScanning(false);
          loadAllCameras();
          loadActiveCameras();
        }, 30000);
      })
      .catch(err => {
        console.error('Error iniciando escaneo:', err);
        setScanning(false);
      });
  };

  // Cambiar estado activo de una cámara
  const toggleCameraActive = (cameraIndex, active) => {
    fetch(`${apiUrl}/api/cameras/${cameraIndex}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ active })
    })
      .then(res => res.json())
      .then(data => {
        loadAllCameras();
        loadActiveCameras();
      })
      .catch(err => {
        console.error('Error actualizando cámara:', err);
      });
  };

  // Calcular el grid óptimo basado en el número de cámaras
  const gridConfig = React.useMemo(() => {
    const count = cameras.length;
    if (count <= 1) return { cols: 1, rows: 1 };
    if (count <= 2) return { cols: 2, rows: 1 };
    if (count <= 4) return { cols: 2, rows: 2 };
    if (count <= 6) return { cols: 3, rows: 2 };
    if (count <= 9) return { cols: 3, rows: 3 };
    return { cols: 4, rows: 3 };
  }, [cameras.length]);

  // Manejar el cambio de layout
  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
  };

  // Abrir cámara en modal
  const openModal = (camera) => {
    setModalCamera(camera);
  };

  // Cerrar modal
  const closeModal = () => {
    setModalCamera(null);
  };

  // Abrir/cerrar selector de cámaras
  const toggleCameraSelector = () => {
    setShowCameraSelector(!showCameraSelector);
    if (!showCameraSelector) {
      loadAllCameras();
    }
  };

  // Manejar actualización de displayName
  const handleUpdateDisplayName = (id, displayName) => {
    fetch(`${apiUrl}/api/cameras/${id}/display-name`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ displayName })
    })
      .then(res => res.json())
      .then(() => {
        loadAllCameras();
        loadActiveCameras();
      })
      .catch(err => {
        console.error('Error actualizando nombre:', err);
      });
  };

  // Componente CRUD para modo desarrollador
  const DevModeCRUD = () => {
    const [newCamera, setNewCamera] = useState({
      name: '',
      rtspUrl: '',
      active: true
    });
    
    const [editingCamera, setEditingCamera] = useState(null);
    
    // Función para añadir cámara
    const addCamera = () => {
      // Validación básica
      if (!newCamera.name || !newCamera.rtspUrl) {
        alert('El nombre y la URL RTSP son obligatorios');
        return;
      }
      
      fetch(`${apiUrl}/api/cameras/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCamera)
      })
        .then(res => {
          if (!res.ok) throw new Error('Error al añadir cámara');
          return res.json();
        })
        .then(() => {
          // Resetear formulario
          setNewCamera({
            name: '',
            rtspUrl: '',
            active: true
          });
          loadAllCameras();
          loadActiveCameras();
        })
        .catch(err => {
          console.error('Error:', err);
          alert(`Error: ${err.message}`);
        });
    };
    
    // Función para eliminar cámara
    const deleteCamera = (id) => {
      if (!window.confirm('¿Estás seguro de eliminar esta cámara?')) return;
      
      fetch(`${apiUrl}/api/cameras/${id}`, {
        method: 'DELETE'
      })
        .then(res => res.json())
        .then(() => {
          loadAllCameras();
          loadActiveCameras();
        })
        .catch(err => {
          console.error('Error eliminando cámara:', err);
        });
    };
    
    return (
      <div className="dev-mode-container">
        <div className="dev-mode-header">
          <h3>?? Modo Desarrollador</h3>
          <button className="dev-mode-close" onClick={() => setDevMode(false)}>×</button>
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
            
            <button className="dev-form-button" onClick={addCamera}>Añadir Cámara</button>
          </div>
        </div>
        
        <div className="dev-mode-section">
          <h4>Herramientas Avanzadas</h4>
          <div className="dev-tools">
            <button 
              className="dev-tool-button"
              onClick={startScan}
            >
              Forzar Escaneo de Red
            </button>
            
            <button 
              className="dev-tool-button"
              onClick={() => {
                fetch(`${apiUrl}/api/cameras/restart-streams`, { method: 'POST' })
                  .then(res => res.json())
                  .then(data => {
                    alert(`Streams reiniciados: ${data.message}`);
                  })
                  .catch(err => {
                    alert('Error al reiniciar streams');
                  });
              }}
            >
              Reiniciar Todos los Streams
            </button>
          </div>
        </div>
        
        <div className="dev-mode-section">
          <h4>Tabla de Cámaras (CRUD)</h4>
          <table className="dev-mode-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>URL RTSP</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {allCameras.map((camera, idx) => (
                <tr key={idx} className={camera.active ? 'camera-active' : 'camera-inactive'}>
                  <td>{idx}</td>
                  <td>{camera.name}</td>
                  <td className="rtsp-url-container">
                    {camera.rtspUrl.replace(/(rtsp:\/\/)[^@]+(@)/, '$1*****$2')}
                  </td>
                  <td>
                    <span className={`status-badge ${camera.active ? 'active' : 'inactive'}`}>
                      {camera.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="action-cell">
                    <button 
                      className="edit-button" 
                      onClick={() => toggleCameraActive(idx, !camera.active)}
                      title={camera.active ? "Desactivar" : "Activar"}
                    >
                      {camera.active ? '??' : '??'}
                    </button>
                    <button 
                      className="delete-button" 
                      onClick={() => deleteCamera(idx)}
                      title="Eliminar"
                    >
                      ???
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Tabla de configuración de cámaras
  const CameraConfigTable = () => {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    const handleEditStart = (camera, idx) => {
      setEditingId(idx);
      setEditName(camera.displayName || camera.name);
    };

    const handleEditSave = (id) => {
      handleUpdateDisplayName(id, editName);
      setEditingId(null);
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

        {scanning && (
          <div className="scan-progress">
            <div className="scan-progress-bar">
              <div className="scan-progress-fill"></div>
            </div>
            <p>Buscando cámaras en la red. Esto puede tardar hasta 30 segundos...</p>
          </div>
        )}

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
                          onChange={(e) => toggleCameraActive(idx, e.target.checked)}
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
                      {cam.ip || (cam.rtspUrl.match(/@([^:]+):/) ? cam.rtspUrl.match(/@([^:]+):/)[1] : 'Desconocida')}
                    </td>
                    <td className="rtsp-url">
                      {cam.rtspUrl.replace(/(rtsp:\/\/)[^@]+(@)/, '$1*****$2')}
                    </td>
                    <td>
                      <button
                        className="camera-action-button"
                        onClick={() => toggleCameraActive(idx, !cam.active)}
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
          <button className="save-button" onClick={toggleCameraSelector}>
            Volver al monitor
          </button>
        </div>
      </div>
    );
  };

  if (loading && !showCameraSelector) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando cámaras...</p>
      </div>
    );
  }

  if (error && !showCameraSelector) {
    return (
      <div className="error-container">
        <div className="error-icon">?</div>
        <p>{error}</p>
        <button className="retry-button" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <p>Sistema de Monitorización de cámaras IP</p>

        <div className="controls">
          <button
            className="action-button"
            onClick={toggleCameraSelector}
            aria-label="Configurar cámaras"
          >
            {showCameraSelector ? 'Volver' : 'Configurar cámaras'}
          </button>

          {!showCameraSelector && (
            <div className="layout-controls">
              <button
                className={`layout-button ${layout === 'grid' ? 'active' : ''}`}
                onClick={() => handleLayoutChange('grid')}
                aria-label="Vista en cuadrícula"
              >
                <span className="layout-icon">?</span>
              </button>
              <button
                className={`layout-button ${layout === 'horizontal' ? 'active' : ''}`}
                onClick={() => handleLayoutChange('horizontal')}
                aria-label="Vista horizontal"
              >
                <span className="layout-icon">?</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Vista del selector de cámaras */}
      {showCameraSelector ? (
        <>
          <CameraConfigTable />
          {devMode && <DevModeCRUD />}
        </>
      ) : (
        /* Vista de monitorización de cámaras */
        <>
          {cameras.length === 0 ? (
            <div className="no-cameras">
              <p>No hay cámaras disponibles</p>
              <button className="action-button" onClick={toggleCameraSelector}>
                Configurar cámaras
              </button>
            </div>
          ) : (
            <div
              className={`camera-layout camera-layout-${layout}`}
              style={{
                '--grid-columns': layout === 'grid' ? gridConfig.cols : 1,
                '--grid-rows': layout === 'grid' ? gridConfig.rows : cameras.length
              }}
            >
              {cameras.map((cam, i) => (
                <div key={i} className="camera-card" onClick={() => openModal(cam)}>
                  <div className="camera-header">
                    <div className="camera-title-container">
                      <div className="camera-title">{cam.displayName || cam.name}</div>
                      {cam.ip && (
                        <div className="camera-ip-badge" title={`IP: ${cam.ip}`}>
                          {cam.ip}
                        </div>
                      )}
                    </div>
                    <button
                      className="zoom-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(cam);
                      }}
                      aria-label="Ampliar cámara"
                    >
                      <span aria-hidden="true">??</span>
                    </button>
                  </div>
                  <div className="camera-stream-container">
                    <CameraStream
                      streamUrl={`${apiUrl}${cam.hlsUrl}`}
                      cameraName={cam.displayName || cam.name}
                      cameraIp={cam.ip}
                      fitToContainer={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de cámara */}
      {modalCamera && (
        <div className="camera-modal-overlay" onClick={closeModal}>
          <div className="camera-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalCamera.displayName || modalCamera.name}</h2>
              <button className="close-modal-button" onClick={closeModal} aria-label="Cerrar">?</button>
            </div>
            <div className="modal-body">
              <CameraStream
                streamUrl={`${apiUrl}${modalCamera.hlsUrl}`}
                cameraName={modalCamera.displayName || modalCamera.name}
                cameraIp={modalCamera.ip}
                fitToContainer={false}
              />
            </div>
          </div>
        </div>
      )}

      <div className="footer">
        © 2025 Sistema de Monitorización de Video para Living Lab - TFG Paulino Esteban Bermúdez
      </div>
    </div>
  );
}

export default App;