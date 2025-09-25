'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';

interface PerformanceContextType {
  isSlowConnection: boolean;
  isLowEndDevice: boolean;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export function PerformanceProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Detect slow connection
    const connection = (navigator as Navigator & { 
      connection?: { effectiveType?: string };
      mozConnection?: { effectiveType?: string };
      webkitConnection?: { effectiveType?: string };
    }).connection ?? 
    (navigator as Navigator & { mozConnection?: { effectiveType?: string } }).mozConnection ?? 
    (navigator as Navigator & { webkitConnection?: { effectiveType?: string } }).webkitConnection;
    
    if (connection) {
      const isSlowConnection = connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
      
      if (isSlowConnection) {
        // Reduce animations and effects for slow connections
        document.documentElement.style.setProperty('--animation-duration', '0.1s');
        document.documentElement.style.setProperty('--transition-duration', '0.1s');
      }
    }

    // Detect low-end devices
    const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
    
    if (isLowEndDevice) {
      // Reduce visual effects for low-end devices
      document.documentElement.classList.add('low-end-device');
    }

    // Preload critical resources
    const preloadCriticalResources = () => {
      // Preload fonts
      const fontLink = document.createElement('link');
      fontLink.rel = 'preload';
      fontLink.href = '/fonts/geist-sans.woff2';
      fontLink.as = 'font';
      fontLink.type = 'font/woff2';
      fontLink.crossOrigin = 'anonymous';
      document.head.appendChild(fontLink);
    };

    preloadCriticalResources();
  }, []);

  const contextValue: PerformanceContextType = {
    isSlowConnection: false, // This would be set based on connection detection
    isLowEndDevice: false,   // This would be set based on device detection
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
}

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};
