// import React, { useEffect, useRef } from "react";
// import { useMap } from "react-leaflet";
// import L from "leaflet";
// import "@geoman-io/leaflet-geoman-free";
// import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
// import sendActivityLog from "../api/activityLogger";
// import { ACTIVITY_TYPES } from "../constants/activityTypes";

// const MeasureControl = () => {
//   const map = useMap();
//   const measureLayerRef = useRef(null);

//   useEffect(() => {
//     // Initialize Geoman controls with only polygon drawing
//     map.pm.addControls({
//       position: "topleft",
//       drawCircle: false,
//       drawCircleMarker: false,
//       drawRectangle: false,
//       drawPolyline: false,
//       drawMarker: false,
//       cutPolygon: false,
//       dragMode: false,
//       editMode: false,
//       removalMode: false,
//       rotateMode: false,
//       drawText: false,
//     });

//     // Custom styling
//     map.pm.setGlobalOptions({
//       pathOptions: {
//         color: "#FF6B6B",
//         fillColor: "#FF6B6B",
//         fillOpacity: 0.3,
//       },
//     });

//     // Create a feature group for measurements
//     measureLayerRef.current = new L.FeatureGroup().addTo(map);

//     // Handle measurement display
//     map.on("pm:create", async (e) => {
//       const layer = e.layer;
//       measureLayerRef.current.addLayer(layer);

//       // Calculate measurements
//       const latlngs = layer.getLatLngs()[0];
//       const area = L.GeometryUtil.geodesicArea(latlngs);
//       const perimeter = calculatePerimeter(latlngs);

//       try {
//         await sendActivityLog(
//           ACTIVITY_TYPES.MEASURE_DISTANCE,
//           `Measurement made: ${formatArea(area)}, Perimeter: ${formatLength(
//             perimeter
//           )}`
//         );
//       } catch (error) {
//         console.error("Failed to log measurement:", error);
//       }

//       // Create popup content
//       const popupContent = L.DomUtil.create("div", "measure-popup");

//       // Add title
//       const titleDiv = L.DomUtil.create("div", "popup-title", popupContent);
//       titleDiv.innerHTML = "Area measurement";
//       titleDiv.style.fontWeight = "bold";
//       titleDiv.style.marginBottom = "8px";
//       titleDiv.style.fontSize = "16px";
//       titleDiv.style.paddingBottom = "8px";
//       titleDiv.style.borderBottom = "1px solid #eee";

//       // Add measurements
//       const measurementsDiv = L.DomUtil.create(
//         "div",
//         "measurements",
//         popupContent
//       );
//       measurementsDiv.innerHTML = `${formatArea(area)}<br>${formatLength(
//         perimeter
//       )}`;
//       measurementsDiv.style.margin = "8px 0";
//       measurementsDiv.style.fontSize = "14px";
//       measurementsDiv.style.paddingBottom = "8px";
//       measurementsDiv.style.borderBottom = "1px solid #eee";

//       // Create button container
//       const buttonContainer = L.DomUtil.create(
//         "div",
//         "button-container",
//         popupContent
//       );
//       buttonContainer.style.display = "flex";
//       buttonContainer.style.gap = "8px";
//       buttonContainer.style.marginTop = "8px";

//       // Add center button with icon
//       const centerButton = L.DomUtil.create(
//         "button",
//         "center-btn",
//         buttonContainer
//       );
//       centerButton.innerHTML = `
//         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: text-bottom; margin-right: 4px;">
//           <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
//           <path d="M12 8v8"/>
//           <path d="M8 12h8"/>
//         </svg>
//         <span style="color: #777DD4; font-size: 12px;">Center on this area</span>
//       `;
//       centerButton.style.padding = "4px 8px";
//       centerButton.style.backgroundColor = "#ffffff";
//       centerButton.style.border = "1px solid #ccc";
//       centerButton.style.borderRadius = "3px";
//       centerButton.style.cursor = "pointer";
//       centerButton.style.display = "flex";
//       centerButton.style.alignItems = "center";

//       // Add delete button with icon
//       const deleteButton = L.DomUtil.create(
//         "button",
//         "delete-btn",
//         buttonContainer
//       );
//       deleteButton.innerHTML = `
//         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: text-bottom; margin-right: 4px;">
//           <path d="M3 6h18"/>
//           <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
//         </svg>
//         <span style="color: #777DD4; font-size: 12px;">Delete</span>
//       `;
//       deleteButton.style.padding = "4px 8px";
//       deleteButton.style.backgroundColor = "#ffffff";
//       deleteButton.style.border = "1px solid #ccc";
//       deleteButton.style.borderRadius = "3px";
//       deleteButton.style.cursor = "pointer";
//       deleteButton.style.display = "flex";
//       deleteButton.style.alignItems = "center";

//       // Add button event listeners
//       L.DomEvent.on(centerButton, "click", () => {
//         map.fitBounds(layer.getBounds());
//       });

//       L.DomEvent.on(deleteButton, "click", () => {
//         measureLayerRef.current.removeLayer(layer);
//         map.closePopup();
//       });

//       // Bind popup to layer
//       layer.bindPopup(popupContent, {
//         className: "measure-popup",
//         closeButton: true,
//       });

//       // Open popup
//       layer.openPopup();
//     });

//     // Disable map dragging while drawing
//     map.on("pm:drawstart", () => {
//       map.dragging.disable();
//     });

//     map.on("pm:drawend", () => {
//       map.dragging.enable();
//     });

//     function calculatePerimeter(points) {
//       let perimeter = 0;
//       for (let i = 0; i < points.length; i++) {
//         const j = (i + 1) % points.length;
//         perimeter += points[i].distanceTo(points[j]);
//       }
//       return perimeter;
//     }

//     function formatArea(area) {
//       if (area >= 1000000) {
//         return `${(area / 1000000).toFixed(2)} Square Kilometers`;
//       }
//       return `${Math.round(area)} Square Meters`;
//     }

//     function formatLength(length) {
//       if (length >= 1000) {
//         return `${(length / 1000).toFixed(2)} Kilometers (${(
//           length / 1609.34
//         ).toFixed(2)} Miles) Perimeter`;
//       }
//       return `${Math.round(length)} Meters (${(length / 1609.34).toFixed(
//         2
//       )} Miles) Perimeter`;
//     }

//     // Add custom CSS for the popup
//     const style = document.createElement("style");
//     style.innerHTML = `
//     .leaflet-pm-icon-polygon {
//       background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIxIiB5PSIxIiB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHJ4PSIxIi8+PHBhdGggZD0iTTUgNmgxTTggNmgyTTExIDZoMk0xNCA2aDJNNSA5aDFNOCA5aDJNMTEgOWgyTTMgMTJ2MU00IDEyaDFNNyAxMnYxTTkgMTJ2MU0xMiAxMnYxTTExIDE1aDFNOSAxNXYyTTggMTV2Mkg2IDE3di0yTTMgMTh2MU00IDE4aDFNNyAxOHYxTTkgMTh2MU0xMiAxOHYxIi8+PC9zdmc+');
//       background-size: contain;
//       background-repeat: no-repeat;
//       background-position: center;
//     }
//     `;
//     document.head.appendChild(style);

//     // Get the polygon button element and update its tooltip
//     setTimeout(() => {
//       const polygonButton = document.querySelector(".leaflet-pm-draw-polygon");
//       if (polygonButton) {
//         polygonButton.setAttribute("title", "Measure distances and areas");
//       }
//     }, 100);

//     return () => {
//       // Cleanup
//       if (measureLayerRef.current) {
//         map.removeLayer(measureLayerRef.current);
//       }
//       map.pm.removeControls();
//       map.dragging.enable();
//       document.head.removeChild(style);
//     };
//   }, [map]);

//   return null;
// };

// export default MeasureControl;

import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import sendActivityLog from "../api/activityLogger";
import { ACTIVITY_TYPES } from "../constants/activityTypes";

const MeasureControl = () => {
  const map = useMap();
  const measureLayerRef = useRef(null);

  useEffect(() => {
    // Initialize Geoman controls with only polygon drawing
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

    // Custom styling
    map.pm.setGlobalOptions({
      pathOptions: {
        color: "#FF6B6B",
        fillColor: "#FF6B6B",
        fillOpacity: 0.3,
      },
    });

    // Create a feature group for measurements
    measureLayerRef.current = new L.FeatureGroup().addTo(map);

    function calculatePerimeter(points) {
      let perimeter = 0;
      for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        perimeter += points[i].distanceTo(points[j]);
      }
      return perimeter;
    }

    function formatArea(area) {
      if (area >= 1000000) {
        return `${(area / 1000000).toFixed(2)} Square Kilometers`;
      }
      return `${Math.round(area)} Square Meters`;
    }

    function formatLength(length) {
      if (length >= 1000) {
        return `${(length / 1000).toFixed(2)} Kilometers (${(
          length / 1609.34
        ).toFixed(2)} Miles) Perimeter`;
      }
      return `${Math.round(length)} Meters (${(length / 1609.34).toFixed(
        2
      )} Miles) Perimeter`;
    }

    // Handle measurement display
    const handleMeasurement = async (e) => {
      const layer = e.layer;
      measureLayerRef.current.addLayer(layer);

      // Calculate measurements
      const latlngs = layer.getLatLngs()[0];
      const area = L.GeometryUtil.geodesicArea(latlngs);
      const perimeter = calculatePerimeter(latlngs);

      // Log the measurement only once
      try {
        await sendActivityLog(
          ACTIVITY_TYPES.MEASURE_DISTANCE,
          `Measurement made: ${formatArea(area)}, Perimeter: ${formatLength(
            perimeter
          )}`
        );
      } catch (error) {
        console.error("Failed to log measurement:", error);
      }

      // Create popup content
      const popupContent = L.DomUtil.create("div", "measure-popup");

      // Add title
      const titleDiv = L.DomUtil.create("div", "popup-title", popupContent);
      titleDiv.innerHTML = "Area measurement";
      titleDiv.style.fontWeight = "bold";
      titleDiv.style.marginBottom = "8px";
      titleDiv.style.fontSize = "16px";
      titleDiv.style.paddingBottom = "8px";
      titleDiv.style.borderBottom = "1px solid #eee";

      // Add measurements
      const measurementsDiv = L.DomUtil.create(
        "div",
        "measurements",
        popupContent
      );
      measurementsDiv.innerHTML = `${formatArea(area)}<br>${formatLength(
        perimeter
      )}`;
      measurementsDiv.style.margin = "8px 0";
      measurementsDiv.style.fontSize = "14px";
      measurementsDiv.style.paddingBottom = "8px";
      measurementsDiv.style.borderBottom = "1px solid #eee";

      // Create button container
      const buttonContainer = L.DomUtil.create(
        "div",
        "button-container",
        popupContent
      );
      buttonContainer.style.display = "flex";
      buttonContainer.style.gap = "8px";
      buttonContainer.style.marginTop = "8px";

      // Add center button with icon
      const centerButton = L.DomUtil.create(
        "button",
        "center-btn",
        buttonContainer
      );
      centerButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: text-bottom; margin-right: 4px;">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
          <path d="M12 8v8"/>
          <path d="M8 12h8"/>
        </svg>
        <span style="color: #777DD4; font-size: 12px;">Center on this area</span>
      `;
      centerButton.style.padding = "4px 8px";
      centerButton.style.backgroundColor = "#ffffff";
      centerButton.style.border = "1px solid #ccc";
      centerButton.style.borderRadius = "3px";
      centerButton.style.cursor = "pointer";
      centerButton.style.display = "flex";
      centerButton.style.alignItems = "center";

      // Add delete button with icon
      const deleteButton = L.DomUtil.create(
        "button",
        "delete-btn",
        buttonContainer
      );
      deleteButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: text-bottom; margin-right: 4px;">
          <path d="M3 6h18"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        <span style="color: #777DD4; font-size: 12px;">Delete</span>
      `;
      deleteButton.style.padding = "4px 8px";
      deleteButton.style.backgroundColor = "#ffffff";
      deleteButton.style.border = "1px solid #ccc";
      deleteButton.style.borderRadius = "3px";
      deleteButton.style.cursor = "pointer";
      deleteButton.style.display = "flex";
      deleteButton.style.alignItems = "center";

      // Add button event listeners
      L.DomEvent.on(centerButton, "click", () => {
        map.fitBounds(layer.getBounds());
      });

      L.DomEvent.on(deleteButton, "click", () => {
        measureLayerRef.current.removeLayer(layer);
        map.closePopup();
      });

      // Bind popup to layer
      layer.bindPopup(popupContent, {
        className: "measure-popup",
        closeButton: true,
      });

      // Open popup
      layer.openPopup();
    };

    // Add event listener for measurement creation
    map.on("pm:create", handleMeasurement);

    // Disable map dragging while drawing
    map.on("pm:drawstart", () => {
      map.dragging.disable();
    });

    map.on("pm:drawend", () => {
      map.dragging.enable();
    });

    // Add custom CSS for the popup
    const style = document.createElement("style");
    style.innerHTML = `
    .leaflet-pm-icon-polygon {
      background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIxIiB5PSIxIiB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHJ4PSIxIi8+PHBhdGggZD0iTTUgNmgxTTggNmgyTTExIDZoMk0xNCA2aDJNNSA5aDFNOCA5aDJNMTEgOWgyTTMgMTJ2MU00IDEyaDFNNyAxMnYxTTkgMTJ2MU0xMiAxMnYxTTExIDE1aDFNOSAxNXYyTTggMTV2Mkg2IDE3di0yTTMgMTh2MU00IDE4aDFNNyAxOHYxTTkgMTh2MU0xMiAxOHYxIi8+PC9zdmc+');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
    `;
    document.head.appendChild(style);

    // Get the polygon button element and update its tooltip
    setTimeout(() => {
      const polygonButton = document.querySelector(".leaflet-pm-draw-polygon");
      if (polygonButton) {
        polygonButton.setAttribute("title", "Measure distances and areas");
      }
    }, 100);

    return () => {
      // Cleanup
      if (measureLayerRef.current) {
        map.removeLayer(measureLayerRef.current);
      }
      map.off("pm:create", handleMeasurement);
      map.pm.removeControls();
      map.dragging.enable();
      document.head.removeChild(style);
    };
  }, [map]);

  return null;
};

export default MeasureControl;
