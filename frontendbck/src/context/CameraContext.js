// src/context/CameraContext.js
import React, { createContext, useContext, useState, useEffect, useReducer } from 'react';
import { fetchCameras, fetchAllCameras, scanNetwork, restartStreams } from '../services/cameraService';

// Definir el estado inicial
const initialState = {
  cameras: [],
  allCameras: [],
  loading: true,
  error: null,
  scanning: false,
  layout: 'grid'
};

// Crear acciones para el reducer
const ACTIONS = {
  SET_CAMERAS: 'SET_CAMERAS',
  SET_ALL_CAMERAS: 'SET_ALL_CAMERAS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SCANNING: 'SET_SCANNING',
  SET_LAYOUT: 'SET_LAYOUT'
};

// Crear reducer para manejar actualizaciones de estado
function cameraReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CAMERAS:
      return { ...state, cameras: action.payload };
    case ACTIONS.SET_ALL_CAMERAS:
      return { ...state, allCameras: action.payload };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.SET_SCANNING:
      return { ...state, scanning: action.payload };
    case ACTIONS.SET_LAYOUT:
      return { ...state, layout: action.payload };
    default:
      return state;
  }
}

// Crear contexto
const CameraContext = createContext(null);

// Proveedor del contexto
export const CameraProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cameraReducer, initialState);
  const [modalCamera, setModalCamera] = useState(null);
  const [showCameraSelector, setShowCameraSelector] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || '';

  // Cargar cámaras activas
  const loadActiveCameras = async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const data = await fetchCameras(apiUrl);
      dispatch({ type: ACTIONS.SET_CAMERAS, payload: data });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    } catch (error) {
      console.error('Error obteniendo cámaras:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'No se pudieron cargar las cámaras' });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Cargar todas las cámaras
  const loadAllCameras = async () => {
    try {
      const data = await fetchAllCameras(apiUrl);
      dispatch({ type: ACTIONS.SET_ALL_CAMERAS, payload: data });
    } catch (error) {
      console.error('Error obteniendo todas las cámaras:', error);
    }
  };

  // Iniciar escaneo de red
  const startScan = async () => {
    dispatch({ type: ACTIONS.SET_SCANNING, payload: true });
    try {
      await scanNetwork(apiUrl);
      
      // Programar actualización de datos
      setTimeout(() => {
        loadAllCameras();
      }, 5000);

      setTimeout(() => {
        loadAllCameras();
      }, 15000);

      setTimeout(() => {
        dispatch({ type: ACTIONS.SET_SCANNING, payload: false });
        loadAllCameras();
        loadActiveCameras();
      }, 30000);
    } catch (error) {
      console.error('Error iniciando escaneo:', error);
      dispatch({ type: ACTIONS.SET_SCANNING, payload: false });
    }
  };

  // Cambiar disposición de cámaras
  const changeLayout = (layout) => {
    dispatch({ type: ACTIONS.SET_LAYOUT, payload: layout });
  };

  // Reiniciar streams
  const handleRestartStreams = async () => {
    try {
      const response = await restartStreams(apiUrl);
      return response;
    } catch (error) {
      console.error('Error reiniciando streams:', error);
      throw error;
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadActiveCameras();
    loadAllCameras();
  }, [apiUrl]);

  // Valor proporcionado por el contexto
  const value = {
    cameras: state.cameras,
    allCameras: state.allCameras,
    loading: state.loading,
    error: state.error,
    scanning: state.scanning,
    layout: state.layout,
    modalCamera,
    showCameraSelector,
    loadActiveCameras,
    loadAllCameras,
    startScan,
    changeLayout,
    setModalCamera,
    setShowCameraSelector,
    handleRestartStreams,
    apiUrl
  };

  return <CameraContext.Provider value={value}>{children}</CameraContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useCameras = () => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCameras debe ser usado dentro de un CameraProvider');
  }
  return context;
};