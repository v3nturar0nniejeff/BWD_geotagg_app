import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, useMap, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MapLayerSwitcher from "../components/MapLayerSwitcher";
import MapControls from "../components/MapControls";
import LayerSidebar from "../components/LayerSidebar";
import Coordinates from "../components/Coordinates";
import MeasureControl from "../components/MeasureControl";
import MapScreenshot from "../components/MapScreenshot";
import Navbar from "../components/Navbar";
import SearchConcessionaire from "../components/SearchConcessionaire";
import SearchByLayer from "../components/SearchByLayer";

// import LayerSidebar from "../components/LayerSidebar";

const ChangeLayer = ({ currentBaseLayer }) => {
  const map = useMap();
  const existingLayers = useRef(new Set());

  useEffect(() => {
    if (!map) return;

    // Store existing WMS layers before removing layers
    const wmsLayers = [];
    map.eachLayer((layer) => {
      if (layer.wmsParams) {
        wmsLayers.push({
          options: layer.options,
          zIndex: layer.options.zIndex,
          opacity: layer.options.opacity,
        });
        existingLayers.current.add(layer);
      }
    });

    // Remove only the tile layers (base maps)
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer && !layer.wmsParams) {
        map.removeLayer(layer);
      }
    });

    // Add new base layer
    if (currentBaseLayer === "OSM") {
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "BWD - GIS",
        maxNativeZoom: 19,
        maxZoom: 22,
        crossOrigin: "anonymous",
      }).addTo(map);
    } else if (currentBaseLayer === "HYBRID") {
      L.tileLayer("http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}", {
        attribution: "BWD - GIS",
        maxZoom: 22,
        crossOrigin: "anonymous",
      }).addTo(map);
    }

    // Restore WMS layers with their original options
    wmsLayers.forEach((wmsLayer) => {
      const layer = L.tileLayer.wms(
        "http://5.16.255.254:8080/geoserver/wms",
        wmsLayer.options
      );
      layer.setOpacity(wmsLayer.opacity);
      layer.setZIndex(wmsLayer.zIndex);
      layer.addTo(map);
    });
  }, [map, currentBaseLayer]);

  return null;
};

const WMSLayerManager = ({ onMapReady }) => {
  const map = useMap();
  const wmsLayersRef = useRef({});
  const baseZIndex = 250;

  useEffect(() => {
    if (map) {
      const baseUrl = "http://5.16.255.254:8080/geoserver/wms";

      const createWMSLayer = (layerName) => {
        return L.tileLayer.wms(baseUrl, {
          layers: layerName,
          format: "image/png",
          transparent: true,
          maxZoom: 22,
          version: "1.1.0",
          opacity: 1,
          zIndex: 250,
        });
      };

      const handleWMSRequest = (layerName, show, zIndex) => {
        const layers = wmsLayersRef.current;

        try {
          if (show) {
            if (!layers[layerName]) {
              // Create new layer
              const wmsLayer = createWMSLayer(layerName, zIndex);
              console.log("DEBUGGGGGG", wmsLayer);
              layers[layerName] = wmsLayer;
              if (layerName === "standpipe") {
                var standpipeId = wmsLayer[0].gid;
                const meter = createWMSDataFetcher(meter, standpipeId);
                console.log("DEBUGGGGGG", meter);
              }

              wmsLayer.addTo(map);
            } else {
              // Re-add existing layer with preserved zIndex
              layers[layerName].addTo(map);
            }
            // Always set zIndex when showing layer
            if (zIndex && layers[layerName]) {
              layers[layerName].setZIndex(zIndex);
            }
          } else {
            // Just remove from map but keep the layer instance and its zIndex
            if (layers[layerName]) {
              map.removeLayer(layers[layerName]);
              // Store the zIndex for when we show it again
              layers[layerName].options.zIndex = zIndex;
            }
          }
          return true;
        } catch (error) {
          console.error("Error in handleWMSRequest:", error);
          return false;
        }
      };

      const createWMSDataFetcher = (layerName, standpipeId) => {
        return async (latLng, map) => {
          // Get map dimensions and bounding box
          const bbox = map.getBounds().toBBoxString();
          const size = map.getSize();
          const point = map.latLngToContainerPoint(latLng);
          const x = Math.floor(point.x);
          const y = Math.floor(point.y);

          // Construct the GetFeatureInfo URL
          const url =
            `${baseUrl}?service=WMS&version=1.1.1&request=GetFeatureInfo` +
            `&layers=${layerName}&bbox=${bbox}&width=${size.x}&height=${size.y}` +
            `&srs=EPSG:4326&x=${x}&y=${y}&info_format=application/json` +
            `&CQL_FILTER=standpipe_id=${standpipeId}`;

          try {
            // Fetch data from WMS server
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error("Failed to fetch WMS feature info");
            }
            const data = await response.json();
            return data;
          } catch (error) {
            console.error("Error fetching WMS feature info:", error);
            return null;
          }
        };
      };

      const getLayers = () => wmsLayersRef.current;
      const handleOpacityChange = (layerName, opacityValue) => {
        const layers = wmsLayersRef.current;
        if (layers[layerName]) {
          layers[layerName].setOpacity(opacityValue);
        }
      };

      const updateLayerOrder = (orderedLayerNames) => {
        const layers = wmsLayersRef.current;

        orderedLayerNames.forEach((layerName, index) => {
          const zIndex = baseZIndex + (orderedLayerNames.length - index) * 10;
          if (layers[layerName]) {
            // Update zIndex for both visible and hidden layers
            layers[layerName].setZIndex(zIndex);
            // Store zIndex in options for hidden layers
            layers[layerName].options.zIndex = zIndex;
          }
        });
      };
      const wmsOperations = {
        removeLayer: (layerName) => {
          const layers = wmsLayersRef.current;
          if (layers[layerName]) {
            map.removeLayer(layers[layerName]);
            delete layers[layerName];
          }
        },

        updateOpacity: handleOpacityChange,
        updateLayerOrder,
        getLayers,

        updateZIndex: (layerName, zIndex) => {
          const layers = wmsLayersRef.current;
          if (layers[layerName]) {
            layers[layerName].setZIndex(zIndex);
          }
        },

        cleanup: () => {
          const layers = wmsLayersRef.current;
          Object.values(layers).forEach((layer) => {
            map.removeLayer(layer);
          });
          wmsLayersRef.current = {};
        },

        // getLayers: () => {
        //   return { ...wmsLayersRef.current };
        // },
      };

      map.wmsOperations = wmsOperations;
      map.handleWMSRequest = handleWMSRequest;
      map.handleOpacityChange = handleOpacityChange; // Expose opacity handler
      onMapReady(map);
    }

    return () => {
      if (map) {
        map.wmsOperations?.cleanup();
      }
    };
  }, [map, onMapReady]);

  return null;
};
const HomePage = () => {
  const [currentBaseLayer, setCurrentBaseLayer] = useState("OSM");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);
  const [wmsLayers, setWmsLayers] = useState({});
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    return () => {
      if (mapInstance?.cleanupWMSLayers) {
        mapInstance.cleanupWMSLayers();
      }
    };
  }, [mapInstance]);

  const handleBaseLayerChange = useCallback((newLayer) => {
    setCurrentBaseLayer(newLayer);
  }, []);

  const handleSidebarToggle = useCallback((collapsed) => {
    setIsSidebarCollapsed(collapsed);
  }, []);

  // handleOpacityChange handler
  const handleOpacityChange = useCallback(
    (layerId, opacity) => {
      if (mapInstance?.wmsOperations) {
        mapInstance.wmsOperations.updateOpacity(layerId, opacity / 100);
      }
    },
    [mapInstance]
  );

  // Initialize screenshot functionality
  const { captureScreenshot } = MapScreenshot({
    mapRef: map ? { current: map } : mapRef,
    bounds: mapBounds,
  });

  useEffect(() => {
    if (map) {
      // Access the map container
      const mapContainer = map.getContainer();

      // Add mouseover event to change cursor to pointer
      mapContainer.style.cursor = "pointer";

      // Cleanup function to reset the cursor style
      return () => {
        mapContainer.style.cursor = "";
      };
    }
  }, [map]);

  // Modify the map ready handler
  const handleMapReady = useCallback((mapInstance) => {
    setMap(mapInstance);
    setMapInstance(mapInstance);
    // Store initial bounds
    setMapBounds(mapInstance.getBounds());

    // Add bounds change listener
    mapInstance.on("moveend", () => {
      setMapBounds(mapInstance.getBounds());
    });

    // Change cursor to pointer when hovering over the map
    const mapContainer = mapInstance.getContainer();
    mapContainer.style.cursor = "pointer";

    // Cleanup cursor style on unmount
    return () => {
      mapContainer.style.cursor = "";
    };
  }, []);

  const handleScreenshot = useCallback(
    async (e) => {
      e?.preventDefault();
      if (isCapturing) return;

      try {
        setIsCapturing(true);
        console.log("Starting screenshot capture...");
        await captureScreenshot();
        console.log("Screenshot capture completed");
      } catch (error) {
        console.error("Error capturing screenshot:", error);
        alert("Failed to capture screenshot. Please try again.");
      } finally {
        setIsCapturing(false);
      }
    },
    [captureScreenshot, isCapturing]
  );

  const MapWrapper = useCallback(() => {
    const mapInstance = useMap();

    useEffect(() => {
      if (mapInstance) {
        handleMapReady(mapInstance);
      }
    }, [mapInstance]);

    return null;
  }, [handleMapReady]);

  const handleWMSLayerToggle = (layerName, show) => {
    if (mapInstance && mapInstance.handleWMSRequest) {
      mapInstance.handleWMSRequest(layerName, show);
    }
  };

  return (
    <div className="relative">
      <Navbar
        onScreenshot={handleScreenshot}
        mapRef={mapRef}
        useCaptureFeature={true}
        mapInstance={mapInstance}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      <LayerSidebar
        onToggle={handleSidebarToggle}
        onLayerToggle={handleWMSLayerToggle}
        mapInstance={mapInstance}
        onOpacityChange={handleOpacityChange}
      />
      <SearchConcessionaire map={mapInstance} />
      {/* <SearchByLayer map={mapInstance} /> */}

      <MapContainer
        center={[16.4, 120.596]}
        zoom={14.4}
        maxBounds={[
          [16.28735, 120.48277],
          [16.48541, 120.69735],
        ]}
        maxBoundsViscosity={1.0}
        minZoom={12}
        maxZoom={22}
        zoomControl={false}
        attributionControl={true}
        preferCanvas={false}
        style={{ height: "100vh", zIndex: 10 }}
        ref={mapRef}
        whenReady={(map) => {
          handleMapReady(map.target);
        }}
      >
        <MapWrapper />
        <ChangeLayer currentBaseLayer={currentBaseLayer} />
        <MapLayerSwitcher
          onBaseLayerChange={handleBaseLayerChange}
          currentBaseLayer={currentBaseLayer}
        />
        <MapControls isSidebarCollapsed={isSidebarCollapsed} />
        <MeasureControl />
        <Coordinates />

        <WMSLayerManager onMapReady={handleMapReady} />
      </MapContainer>
    </div>
  );
};

export default HomePage;
