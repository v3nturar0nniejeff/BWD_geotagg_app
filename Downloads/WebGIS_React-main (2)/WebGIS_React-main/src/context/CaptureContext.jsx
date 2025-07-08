import React, { createContext, useContext, useState } from 'react';

const CaptureContext = createContext();

export function CaptureProvider({ children }) {
  const [isCapturing, setIsCapturing] = useState(false);

  return (
    <CaptureContext.Provider value={{ isCapturing, setIsCapturing }}>
      {children}
    </CaptureContext.Provider>
  );
}

export function useCapture() {
  const context = useContext(CaptureContext);
  if (!context) {
    throw new Error('useCapture must be used within a CaptureProvider');
  }
  return context;
}