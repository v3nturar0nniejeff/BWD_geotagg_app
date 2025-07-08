import React, { useState, useEffect, useCallback, useRef } from "react";
import { FaCaretLeft, FaCaretRight, FaLayerGroup } from "react-icons/fa";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import DraggableLayer from "./DraggableLayer";
import { useAuth } from "../auth/AuthContext";
import { getUserLayers } from "../api/layers";
import MapWithFeatureInfo from "./MapWithFeatureInfo";
import sendActivityLog from "../api/activityLogger";
import { ACTIVITY_TYPES } from "../constants/activityTypes";
import { formatLayerName } from "../utils/tblnameFormatter";

const LayerSidebar = ({
  onToggle,
  onLayerToggle,
  mapInstance,
  onOpacityChange,
}) => {
  const { isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userLayerData, setUserLayerData] = useState(null);
  const [activeLayers, setActiveLayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const mapRef = useRef(mapInstance);
  const operationInProgress = useRef(false);

  const activeWmsLayersRef = useRef(new Set());
  const baseZIndex = 250;

  useEffect(() => {
    mapRef.current = mapInstance;
  }, [mapInstance]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getUserLayers();
        setUserLayerData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      onToggle(newState);
      return newState;
    });
  };

  const addWmsLayer = useCallback((layerName) => {
    if (!mapRef.current?.handleWMSRequest) {
      console.error("Map instance or handleWMSRequest not available");
      return false;
    }

    try {
      console.log("Adding WMS layer:", layerName);
      mapRef.current.handleWMSRequest(layerName, true);
      activeWmsLayersRef.current.add(layerName);
      return true;
    } catch (error) {
      console.error("Error adding WMS layer:", error);
      return false;
    }
  }, []);

  const removeWmsLayer = useCallback((layerName) => {
    if (!mapRef.current?.handleWMSRequest) {
      console.error("Map instance or handleWMSRequest not available");
      return false;
    }

    try {
      console.log("Removing WMS layer:", layerName);

      mapRef.current.handleWMSRequest(layerName, false);

      if (mapRef.current.map) {
        mapRef.current.map.eachLayer((layer) => {
          if (layer.options && layer.options.layers === layerName) {
            console.log("Forcefully removing layer:", layerName);
            mapRef.current.map.removeLayer(layer);
          }
        });
      }

      activeWmsLayersRef.current.delete(layerName);
      return true;
    } catch (error) {
      console.error("Error removing WMS layer:", error);
      return false;
    }
  }, []);

  const removeAllWmsLayers = useCallback(() => {
    // Remove tracked layers
    activeWmsLayersRef.current.forEach((layerName) => {
      removeWmsLayer(layerName);
    });

    if (mapRef.current?.map) {
      mapRef.current.map.eachLayer((layer) => {
        if (layer.wmsParams || (layer.options && layer.options.layers)) {
          console.log(
            "Forcefully removing leftover layer:",
            layer.options?.layers
          );
          mapRef.current.map.removeLayer(layer);
        }
      });
    }

    activeWmsLayersRef.current.clear();
  }, [removeWmsLayer]);

  //cleanup effect
  useEffect(() => {
    return () => {
      removeAllWmsLayers();
    };
  }, [removeAllWmsLayers]);

  // Add an effect to handle map instance changes
  useEffect(() => {
    if (mapInstance && mapInstance !== mapRef.current) {
      // Clean up layers from old instance if it exists
      removeAllWmsLayers();
      mapRef.current = mapInstance;
    }
  }, [mapInstance, removeAllWmsLayers]);

  // Add a force cleanup function
  const forceCleanupLayers = useCallback(() => {
    console.log("Forcing cleanup of all WMS layers");
    removeAllWmsLayers();

    // Reset active layers state
    setActiveLayers([]);
  }, [removeAllWmsLayers]);

  const handleLayerClick = useCallback(
    (layerItem) => {
      if (operationInProgress.current) {
        console.log("Operation in progress, skipping...");
        return;
      }

      const layerName = layerItem.layer.layer_name;
      console.log("Layer click:", layerName);

      operationInProgress.current = true;

      try {
        const isLayerActive = activeLayers.some(
          (layer) => layer.name === layerName
        );

        if (isLayerActive) {
          // Handle deactivation
          const success = removeWmsLayer(layerName);
          if (success) {
            // Log deactivation only after successful removal
            sendActivityLog(
              ACTIVITY_TYPES.ACTIVATE_LAYER,
              `Deactivated layer: ${layerName}`
            ).catch(console.error);

            setActiveLayers((prev) => {
              // Remove associated photo layer if it exists
              let photoLayerName = "";
              if (layerName.toLowerCase() === "pipeline") {
                photoLayerName = "2030 Pipeline photos";
              } else {
                photoLayerName = `${layerName} photos`;
              }

              const photoLayerToRemove = prev.find(
                (layer) =>
                  layer.name.toLowerCase() === photoLayerName.toLowerCase()
              );

              if (photoLayerToRemove) {
                removeWmsLayer(photoLayerToRemove.name);
                onLayerToggle?.(photoLayerToRemove.name, false);
              }

              onLayerToggle?.(layerName, false);

              return prev.filter(
                (layer) =>
                  layer.name !== layerName &&
                  layer.name.toLowerCase() !== photoLayerName.toLowerCase()
              );
            });
          }
        } else {
          // Handle activation
          const success = addWmsLayer(layerName);
          if (success) {
            // Log activation only after successful addition
            sendActivityLog(
              ACTIVITY_TYPES.ACTIVATE_LAYER,
              `Activated layer: ${layerName}`
            ).catch(console.error);

            setActiveLayers((prev) => {
              const newLayer = {
                id: String(layerItem.layer.id || Date.now()),
                name: layerName,
                visible: true,
                opacity: 100,
                hasPhotos: layerItem.layer.layer_with_photos,
              };

              onLayerToggle?.(layerName, true);

              const updatedLayers = [newLayer, ...prev];

              if (mapRef.current?.wmsOperations?.updateLayerOrder) {
                const orderedLayerNames = updatedLayers.map(
                  (layer) => layer.name
                );
                mapRef.current.wmsOperations.updateLayerOrder(
                  orderedLayerNames
                );
              }

              return updatedLayers;
            });
          }
        }
      } finally {
        operationInProgress.current = false;
      }
    },
    [activeLayers, addWmsLayer, removeWmsLayer, onLayerToggle]
  );

  const handleRemoveLayer = useCallback(
    (layerId) => {
      if (operationInProgress.current) {
        console.log("Operation in progress, skipping...");
        return;
      }

      operationInProgress.current = true;

      try {
        const layerToRemove = activeLayers.find(
          (layer) => layer.id === layerId
        );
        if (!layerToRemove) {
          console.log("Layer not found:", layerId);
          return;
        }

        const success = removeWmsLayer(layerToRemove.name);
        if (success) {
          // Log removal only after successful removal
          sendActivityLog(
            ACTIVITY_TYPES.ACTIVATE_LAYER,
            `Deactivated layer: ${layerToRemove.name}`
          ).catch(console.error);

          setActiveLayers((prev) => {
            // Determine photo layer name
            const photoLayerName =
              layerToRemove.name.toLowerCase() === "pipeline"
                ? "2030 Pipeline photos"
                : `${layerToRemove.name} photos`;

            // Remove the photo layer if it exists
            removeWmsLayer(photoLayerName);
            onLayerToggle?.(photoLayerName, false);
            onLayerToggle?.(layerToRemove.name, false);

            // Force cleanup of all layers
            if (mapRef.current?.map) {
              mapRef.current.map.eachLayer((layer) => {
                if (
                  layer.options &&
                  (layer.options.layers?.toLowerCase() ===
                    layerToRemove.name.toLowerCase() ||
                    layer.options.layers?.toLowerCase() ===
                      photoLayerName.toLowerCase())
                ) {
                  mapRef.current.map.removeLayer(layer);
                }
              });
            }

            return prev.filter(
              (layer) =>
                layer.id !== layerId &&
                layer.name.toLowerCase() !== photoLayerName.toLowerCase()
            );
          });
        }
      } finally {
        operationInProgress.current = false;
      }
    },
    [activeLayers, removeWmsLayer, onLayerToggle]
  );

  // Add this function to your component and expose it through a ref if needed
  useEffect(() => {
    if (mapRef.current?.map && activeLayers.length === 0) {
      // Force cleanup when all active layers are removed
      forceCleanupLayers();
    }
  }, [activeLayers.length, forceCleanupLayers]);

  const handleLayerToggle = useCallback(
    (layerId, isVisible) => {
      if (operationInProgress.current) {
        console.log("Operation in progress, skipping...");
        return;
      }

      operationInProgress.current = true;
      console.log("Toggling layer visibility:", layerId, isVisible);

      setActiveLayers((prev) => {
        const layer = prev.find((l) => l.id === layerId);
        if (!layer) {
          console.log("Layer not found for toggle:", layerId);
          operationInProgress.current = false;
          return prev;
        }

        // Calculate correct zIndex based on layer position
        const layerIndex = prev.findIndex((l) => l.id === layerId);
        const zIndex = baseZIndex + (prev.length - layerIndex) * 10;

        // Toggle visibility while maintaining z-index
        const success = mapRef.current?.handleWMSRequest(
          layer.name,
          isVisible,
          zIndex
        );

        if (!success) {
          console.log("Failed to toggle layer visibility");
          operationInProgress.current = false;
          return prev;
        }

        // Always update z-indices for all visible layers to maintain order
        if (mapRef.current?.wmsOperations?.updateLayerOrder) {
          const orderedLayerNames = prev.map((l) => l.name);
          mapRef.current.wmsOperations.updateLayerOrder(orderedLayerNames);
        }

        onLayerToggle?.(layer.name, isVisible);
        operationInProgress.current = false;

        return prev.map((l) =>
          l.id === layerId ? { ...l, visible: isVisible } : l
        );
      });
    },
    [onLayerToggle]
  );

  const onDragEnd = (result) => {
    if (!result.destination) return;

    setActiveLayers((prev) => {
      const newLayers = Array.from(prev);
      const [reorderedItem] = newLayers.splice(result.source.index, 1);
      newLayers.splice(result.destination.index, 0, reorderedItem);

      // Get ordered layer names and update z-indices
      const orderedLayerNames = newLayers.map((layer) => layer.name);

      // Update layer order in the map if mapInstance is available
      if (mapRef.current?.wmsOperations?.updateLayerOrder) {
        mapRef.current.wmsOperations.updateLayerOrder(orderedLayerNames);
      }
      return newLayers;
    });
  };

  // Modified to handle opacity changes properly
  const handleLayerOpacityChange = useCallback(
    (layerId, opacity) => {
      setActiveLayers((prev) => {
        const updatedLayers = prev.map((layer) =>
          layer.id === layerId ? { ...layer, opacity } : layer
        );

        // Find the layer name from the active layers
        const layer = prev.find((l) => l.id === layerId);
        if (layer) {
          // Call the opacity change handler with the layer name and opacity
          onOpacityChange?.(layer.name, opacity);
        }

        return updatedLayers;
      });
    },
    [onOpacityChange]
  );

  // Filter layers
  const filteredLayers = userLayerData?.layers?.filter((item) =>
    item.layer.layer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) return null;
  return (
    <div className="relative">
      <div
        className={`fixed inset-y-0 left-0 bg-white shadow-lg w-80 pt-14 flex flex-col z-40 transition-transform duration-300 ease-in-out ${
          isCollapsed ? "-translate-x-80" : "translate-x-0"
        }`}
      >
        {/* Layer Search Section */}
        <div className="h-75">
          <div className="flex items-center bg-[#138FCF] p-2 text-white">
            <FaLayerGroup className="ml-1" />
            <input
              type="text"
              placeholder="Search layer"
              className="p-1 w-80 ml-3 text-black rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Available Layers Section */}
          <div className="bg-[#2E3338]">
            <div className="h-8">
              <h2 className="text-lg ml-2 text-white">Layers</h2>
            </div>
            <hr />
            <div className="h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-500">
              <ul className="list-none text-white">
                {filteredLayers?.map((item, index) => (
                  <li
                    key={`${item.layer.layer_name}-${index}`}
                    className={`text-muted-foreground cursor-pointer h-7 pl-6 hover:bg-[#428BCA] flex items-center justify-between ${
                      activeLayers.some(
                        (layer) => layer.name === item.layer.layer_name
                      )
                        ? "bg-[#428BCA]"
                        : ""
                    }`}
                    onClick={() => handleLayerClick(item)}
                  >
                    <span>{formatLayerName(item.layer.layer_name)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Active Layers Section */}
        <div className="flex items-center bg-[#138FCF] text-white h-30">
          <FaLayerGroup className="ml-1 p-2" />
          <h2 className="text-md ml-1 h-8 p-0.5 pt-1">Active Layer(s)</h2>
        </div>

        <div className="flex-grow bg-[#2E3338] p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-500">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="layers">
              {(provided) => (
                <ul
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="list-group list-group-light list-unstyled"
                >
                  {activeLayers.map((layer, index, hasPhotos) => (
                    <Draggable
                      key={layer.id}
                      draggableId={layer.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <DraggableLayer
                          layer={layer}
                          ref={provided.innerRef}
                          draggableProps={provided.draggableProps}
                          dragHandleProps={provided.dragHandleProps}
                          snapshot={snapshot}
                          onToggleVisibility={handleLayerToggle}
                          onRemoveLayer={handleRemoveLayer}
                          mapInstance={mapInstance}
                          onOpacityChange={handleLayerOpacityChange}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Collapse Toggle Button */}
      <div
        className={`fixed top-12 mt-[7px] z-40 transition-transform duration-300 ease-in-out ${
          isCollapsed ? "translate-x-0" : "translate-x-80"
        }`}
      >
        <div className="group relative">
          <div
            className="text-xl text-white bg-[#138FCF] w-6 h-[50px] flex items-center justify-center border-[#2E3338] border cursor-pointer"
            onClick={toggleCollapse}
          >
            {isCollapsed ? <FaCaretRight /> : <FaCaretLeft />}
          </div>

          <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-700 text-white text-xs rounded-lg py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            {isCollapsed ? "Expand Side Panel" : "Collapse Side Panel"}
          </div>
        </div>
      </div>
      <MapWithFeatureInfo map={mapInstance} orderedLayers={activeLayers} />
    </div>
  );
};

export default LayerSidebar;
