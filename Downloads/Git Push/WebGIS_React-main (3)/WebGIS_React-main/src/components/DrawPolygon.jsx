import React, { useState, useEffect, useCallback } from "react";
import L from "leaflet";
import "leaflet-draw";
import proj4 from "proj4";
import { FaDrawPolygon, FaTimes } from "react-icons/fa";
import { useAuth } from "../auth/AuthContext";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet/dist/leaflet.css";
import sendActivityLog from "../api/activityLogger";
import { ACTIVITY_TYPES } from "../constants/activityTypes";

const DrawPolygon = ({ map, isSidebarCollapsed }) => {
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(false);
  const [drawnItems, setDrawnItems] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [drawControl, setDrawControl] = useState(null);
  const { isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [concessionaires, setConcessionaires] = useState([]);

  const fetchConcessionaires = useCallback(async (polygonWKT) => {
    setIsLoading(true);
    const cqlFilter = `INTERSECTS(geom, ${polygonWKT})`;

    try {
      const response = await fetch(
        `http://5.16.255.254:8080/geoserver/wfs?service=WFS&version=1.1.0&request=GetFeature&typename=bwdgis:concessionaire&CQL_FILTER=${encodeURIComponent(
          cqlFilter
        )}&srsname=EPSG:4326&outputFormat=application/json`
      );

      const data = await response.json();
      setConcessionaires(data.features);
      console.log("Concessionaires:", concessionaires);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching concessionaires:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!map) return;

    // Add area measurement configuration
    L.GeometryUtil = L.extend(L.GeometryUtil || {}, {
      readableArea: function (area, isMetric, precision) {
        const areaStr = L.GeometryUtil.formattedNumber(area, precision || 2);
        return isMetric ? `${areaStr} m²` : `${areaStr} ft²`;
      },
      formattedNumber: function (num, precision) {
        return Number(num.toFixed(precision));
      },
    });

    // Add custom CSS for positioning
    const style = document.createElement("style");
    style.textContent = `
      .leaflet-draw.leaflet-control {
        position: absolute !important;
        top: 300px !important;
        left: ${isSidebarCollapsed ? "0px" : "330px"} !important;
        transition: left 0.3s ease-in-out;
      }
      .leaflet-draw-toolbar {
        margin-top: 0 !important;
      }
    `;
    document.head.appendChild(style);

    // Initialize feature group for drawn items
    const featureGroup = new L.FeatureGroup();
    map.addLayer(featureGroup);
    setDrawnItems(featureGroup);

    // Initialize draw control with custom positioning
    const control = new L.Control.Draw({
      position: "topleft",
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: "#e1e4e8",
            timeout: 1000,
          },
          shapeOptions: {
            color: "#3388ff",
            fillOpacity: 0.2,
            weight: 2,
          },
          showArea: true,
          metric: true,
          feet: false,
          precision: {
            km: 2,
            m: 2,
            cm: 2,
            mm: 2,
          },
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: featureGroup,
        remove: true,
      },
    });
    setDrawControl(control);

    // Handle draw created event
    const handleDrawCreated = async (e) => {
      const { layer } = e;
      featureGroup.addLayer(layer);

      const polygonCoords = layer.getLatLngs()[0];
      const polygonGeoJSON = {
        type: "Polygon",
        coordinates: [[]],
      };

      polygonGeoJSON.coordinates[0] = polygonCoords.map((coord) =>
        proj4("EPSG:4326", "EPSG:32651").forward([coord.lng, coord.lat])
      );

      polygonGeoJSON.coordinates[0].push(polygonGeoJSON.coordinates[0][0]);

      const polygonWKT = `POLYGON((${polygonGeoJSON.coordinates[0]
        .map((coord) => coord.join(" "))
        .join(",")}))`;

      fetchConcessionaires(polygonWKT);

      await sendActivityLog(ACTIVITY_TYPES.DRAW_POLYGON, "Drawing Created");
    };

    map.on("draw:created", handleDrawCreated);

    // Handle edit events
    map.on("draw:edited", (e) => {
      const layers = e.layers;
      layers.eachLayer((layer) => {
        const polygonCoords = layer.getLatLngs()[0];
        // Process edited polygon...
      });
    });

    // Handle delete events
    map.on("draw:deleted", () => {
      featureGroup.clearLayers();
    });

    return () => {
      map.removeLayer(featureGroup);
      map.off("draw:created", handleDrawCreated);
      map.off("draw:edited");
      map.off("draw:deleted");
      if (isDrawingEnabled) {
        map.removeControl(control);
      }
      document.head.removeChild(style);
    };
  }, [map, fetchConcessionaires, isSidebarCollapsed]);

  const toggleDrawing = useCallback(() => {
    if (!map || !drawControl) return;

    setIsDrawingEnabled((prev) => {
      if (!prev) {
        map.addControl(drawControl);
      } else {
        map.removeControl(drawControl);
        if (drawnItems) {
          drawnItems.clearLayers();
        }
      }
      return !prev;
    });
  }, [map, drawControl, drawnItems]);

  if (!map) return null;

  const ConcessionaireModal = () => {
    if (!showModal) return null;

    return (
      <div
        className="fixed right-0 top-[120px] w-[400px] shadow-lg overflow-hidden z-50 border rounded rounded-md opacity-90"
        style={{
          marginTop: "64px",
          height: "calc(100vh - 264px)", // Reduced height to leave space at bottom
          backgroundColor: "#2E3338",
        }}
      >
        <div className="p-2 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-white">
              Count of Selected Features: {concessionaires.length}{" "}
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-300 hover:text-white"
            >
              <FaTimes />
            </button>
          </div>

          <div className="space-y-2 overflow-auto pb-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-500">
            {concessionaires.map((feature) => (
              <div
                key={feature.id}
                className="p-3 border border-gray-600 rounded hover:bg-gray-500 hover:border-white text-gray-200"
              >
                <p className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Account Number: {feature.properties.account_2}
                  </span>
                  <span
                    className="text-xs ml-2 px-2 py-1 bg-gray-700 text-white rounded"
                    style={{ backgroundColor: "#0C1728" }}
                  >
                    ID: {feature.properties.id}
                  </span>
                </p>
                <p className="text-xs">
                  Standpipe: {feature.properties.standpipe}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <button
        className={`text-white hover:text-gray-300 ${
          isLoading ? "opacity-50" : ""
        }`}
        onClick={toggleDrawing}
        title="Click to Draw a Polygon"
        disabled={isLoading}
      >
        <FaDrawPolygon />
      </button>
      <ConcessionaireModal />
    </>
  );
};

export default DrawPolygon;
