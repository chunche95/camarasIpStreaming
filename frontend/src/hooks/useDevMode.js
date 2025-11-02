// src/hooks/useDevMode.js
import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook personalizado para gestionar el modo desarrollador
 * @param {Object} options - Opciones de configuración
 * @param {string} options.triggerKey - Tecla que activa el modo (por defecto: 'd')
 * @param {number} options.requiredPresses - Número de pulsaciones requeridas (por defecto: 5)
 * @param {number} options.timeWindow - Ventana de tiempo en ms para las pulsaciones (por defecto: 2000)
 * @returns {Object} - Estado y funciones para gestionar el modo desarrollador
 */
const useDevMode = (options = {}) => {
  const {
    triggerKey = 'd',
    requiredPresses = 5,
    timeWindow = 2000
  } = options;

  const [devMode, setDevMode] = useState(false);
  const [counter, setCounter] = useState(0);
  const timeoutRef = useRef(null);

  const resetCounter = useCallback(() => {
    setCounter(0);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key.toLowerCase() === triggerKey.toLowerCase()) {
      setCounter(prev => {
        const newCount = prev + 1;
        
        // Limpiar timeout anterior
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Configurar nuevo timeout
        timeoutRef.current = setTimeout(() => {
          resetCounter();
        }, timeWindow);
        
        // Activar DevMode si se llega al número requerido
        if (newCount >= requiredPresses) {
          setDevMode(true);
          return 0;
        }
        
        return newCount;
      });
    }
  }, [triggerKey, requiredPresses, timeWindow, resetCounter]);

  const exitDevMode = useCallback(() => {
    setDevMode(false);
  }, []);

  // Efecto para añadir/quitar listener de teclado
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleKeyDown]);

  return {
    devMode,
    counter,
    exitDevMode
  };
};

export default useDevMode;