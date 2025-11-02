// src/components/cameras/CameraCard.js
import React from 'react';
import { useCameras } from '../../context/CameraContext';
import CameraStream from './CameraStream';

/**
 * Tarjeta individual para mostrar una cámara
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.camera - Datos de la cámara
 * @param {Function} props.onCameraClick - Función a ejecutar al hacer clic en la cámara
 */
const CameraCard = ({ camera, onCameraClick }) => {
  const { apiUrl } = useCameras();

  return (
    <div className="camera-card" onClick={() => onCameraClick(camera)}>
      <div className="camera-header">
        <div className="camera-title-container">
          <div className="camera-title">{camera.displayName || camera.name}</div>
          {camera.ip && (
            <div className="camera-ip-badge" title={`IP: ${camera.ip}`}>
              {camera.ip}
            </div>
          )}
        </div>
        <button
          className="zoom-button"
          onClick={(e) => {
            e.stopPropagation();
            onCameraClick(camera);
          }}
          aria-label="Ampliar cámara"
        >
          <span aria-hidden="true">??</span>
        </button>
      </div>
      <div className="camera-stream-container">
        <CameraStream
          streamUrl={`${apiUrl}${camera.hlsUrl}`}
          cameraName={camera.displayName || camera.name}
          cameraIp={camera.ip}
          fitToContainer={true}
        />
      </div>
    </div>
  );
};

export default CameraCard;