import React, { useCallback } from "react";
import html2canvas from "html2canvas";
import sendActivityLog from "../api/activityLogger";
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";

const MapScreenshot = ({ mapRef }) => {
  const showLoadingIndicator = () => {
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "screenshot-loading-indicator";
    loadingDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px 30px;
      border-radius: 8px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      text-align: center;
    `;
    loadingDiv.innerHTML = `
      <div style="margin-bottom: 10px;">
        <div style="
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          margin: 0 auto 10px auto;
          animation: spin 1s linear infinite;
        "></div>
        <div style="font-size: 16px; font-weight: 500;">Capturing screenshot...</div>
        <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">Please wait while we process the map</div>
      </div>
    `;
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleSheet);
    document.body.appendChild(loadingDiv);
    return { loadingDiv, styleSheet };
  };

  const captureScreenshot = useCallback(async () => {
    let loadingElements = null;

    try {
      // Show the loading indicator
      loadingElements = showLoadingIndicator();

      const mapContainer = mapRef?.current?._container || mapRef?.current;
      if (!mapContainer) {
        throw new Error("Map container not found");
      }

      // Find and hide map controls and the Coordinates component
      const mapControls = mapContainer.querySelectorAll(
        ".leaflet-control-container, .leaflet-bottom, .leaflet-top, .coordinates-control, .input, .search-controls"
      );
      const coordinatesControl = mapContainer.querySelector(
        ".coordinates-control"
      );

      [...mapControls, coordinatesControl].forEach((el) => {
        if (el) el.style.display = "none";
      });

      // Use html2canvas to capture the map container
      const canvas = await html2canvas(mapContainer, {
        useCORS: true, // Handle cross-origin tiles
        logging: true,
        allowTaint: false,
        backgroundColor: null, // Keep transparent background
      });

      // Restore visibility of controls and the Coordinates component
      [...mapControls, coordinatesControl].forEach((el) => {
        if (el) el.style.display = "";
      });

      // Trigger the download of the screenshot
      const link = document.createElement("a");
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:]/g, "-");
      link.download = `map-screenshot-${timestamp}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Log successful screenshot

      await sendActivityLog(
        ACTIVITY_TYPES.TAKE_SCREENSHOT,
        "Camera Icon Clicked"
      );
    } catch (error) {
      console.error("Error capturing screenshot:", error);
    } finally {
      // Clean up the loading indicator
      if (loadingElements) {
        if (
          loadingElements.loadingDiv &&
          loadingElements.loadingDiv.parentNode
        ) {
          loadingElements.loadingDiv.parentNode.removeChild(
            loadingElements.loadingDiv
          );
        }
        if (
          loadingElements.styleSheet &&
          loadingElements.styleSheet.parentNode
        ) {
          loadingElements.styleSheet.parentNode.removeChild(
            loadingElements.styleSheet
          );
        }
      }
    }
  }, [mapRef]);

  return { captureScreenshot };
};

export default MapScreenshot;
