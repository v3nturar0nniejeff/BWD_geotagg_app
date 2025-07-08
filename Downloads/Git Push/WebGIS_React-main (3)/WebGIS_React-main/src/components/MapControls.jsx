import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { useAuth } from "../auth/AuthContext";

const MapControls = ({ isSidebarCollapsed }) => {
  const map = useMap();
  const zoomControlRef = useRef(null);
  const measureControlRef = useRef(null);
  const scaleControlRef = useRef(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!map || !isAuthenticated) return;

    // Initialize Geoman controls first
    map.pm.addControls({
      position: "topleft",
      drawCircle: false,
      drawCircleMarker: false,
      drawRectangle: false,
      drawPolyline: false,
      drawMarker: false,
      cutPolygon: false,
      dragMode: false,
      editMode: false,
      removalMode: false,
      rotateMode: false,
      drawText: false,
    });

    // Add custom styling with ruler icon
    const style = document.createElement("style");
    style.innerHTML = `
      .leaflet-pm-toolbar .control-icon.leaflet-pm-icon-polygon {
  background-image: url("data:image/png;base64,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") !important;
  background-size: 17px 17px !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
}

      
      .leaflet-pm-toolbar .control-icon.leaflet-pm-icon-polygon.active {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 13h20'/%3E%3Cpath d='M3 7h18'/%3E%3Cpath d='M3 19h18'/%3E%3Cpath d='M4 13v-2'/%3E%3Cpath d='M8 13v-3'/%3E%3Cpath d='M12 13v-2'/%3E%3Cpath d='M16 13v-3'/%3E%3Cpath d='M20 13v-2'/%3E%3C/svg%3E") !important;
      }
    `;
    document.head.appendChild(style);

    // Update tooltip with longer delay and more specific selector
    setTimeout(() => {
      const polygonButton = document.querySelector(
        ".leaflet-pm-toolbar .button-container .leaflet-buttons-control-button"
      );
      if (polygonButton) {
        polygonButton.setAttribute("title", "Measure distances and areas");
        console.log("Tooltip updated"); // Debug log
      } else {
        console.log("Button not found"); // Debug log
      }
    }, 100);

    // Zoom Control
    zoomControlRef.current = L.control.zoom({ position: "topleft" });
    map.addControl(zoomControlRef.current);

    // Scale Control
    scaleControlRef.current = L.control.scale({
      position: "bottomright",
      metric: false,
      imperial: true,
    });
    map.addControl(scaleControlRef.current);

    // Move the scale control higher
    const scaleControlElement = document.querySelector(
      ".leaflet-control-scale"
    );
    if (scaleControlElement) {
      scaleControlElement.style.bottom = "35px";
    }

    return () => {
      if (zoomControlRef.current) map.removeControl(zoomControlRef.current);
      if (scaleControlRef.current) map.removeControl(scaleControlRef.current);
      map.pm.removeControls();
      document.head.removeChild(style);
    };
  }, [map, isAuthenticated]);

  // Update control positions based on sidebar state
  useEffect(() => {
    if (!isAuthenticated) return;

    const updateControlPositions = () => {
      const zoomControl = document.querySelector(".leaflet-control-zoom");
      const measureControl = document.querySelector(".leaflet-pm-toolbar");

      if (zoomControl) {
        zoomControl.style.position = "absolute";
        zoomControl.style.top = "170px";
        zoomControl.style.left = isSidebarCollapsed ? "0px" : "330px";
        zoomControl.style.zIndex = "1000";
        zoomControl.style.transition = "left 0.3s ease-in-out";
      }

      if (measureControl) {
        measureControl.style.position = "absolute";
        measureControl.style.top = "250px"; // Position below zoom control
        measureControl.style.left = isSidebarCollapsed ? "0px" : "330px";
        measureControl.style.zIndex = "1000";
        measureControl.style.transition = "left 0.3s ease-in-out";
      }
    };

    updateControlPositions();

    // Add event listener for when measurement starts
    const measureHandler = () => {
      if (map) {
        map.dragging.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
      }
    };

    const measureEndHandler = () => {
      if (map) {
        map.dragging.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
      }
    };

    map.on("pm:drawstart", measureHandler);
    map.on("pm:drawend", measureEndHandler);

    return () => {
      map.off("pm:drawstart", measureHandler);
      map.off("pm:drawend", measureEndHandler);
    };
  }, [isSidebarCollapsed, isAuthenticated, map]);

  return null;
};

export default MapControls;
