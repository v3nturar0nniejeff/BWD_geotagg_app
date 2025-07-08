import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import sendActivityLog from "../api/activityLogger";
import { ACTIVITY_TYPES } from "../constants/activityTypes";

const MapLayerSwitcher = ({
  onBaseLayerChange = () => {},
  initialBaseLayer = "OSM",
}) => {
  const [currentBaseLayer, setCurrentBaseLayer] = useState(initialBaseLayer);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setCurrentBaseLayer(initialBaseLayer);
  }, [initialBaseLayer]);

  const handleOptionChange = async (layerType) => {
    if (currentBaseLayer === layerType) return;
    setCurrentBaseLayer(layerType);
    onBaseLayerChange(layerType);
    await sendActivityLog(
      ACTIVITY_TYPES.CHANGE_BASEMAP,
      `Current Basemap: ${layerType}`
    );
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-row absolute rounded-md bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-9 text-white z-40 shadow-lg">
      {["OSM", "HYBRID"].map((layer) => (
        <div
          key={layer}
          className={`flex justify-center items-center w-[70px] cursor-pointer transition-all duration-200 ease-in-out  
            ${layer === "OSM" ? "rounded-l-md" : "rounded-r-md"} ${
            layer === currentBaseLayer
              ? "bg-[#262626]"
              : "bg-[#3C3C3C] hover:bg-gray-500 border border-transparent hover:border-solid hover:border-1 hover:border-white"
          }`}
        >
          <input
            type="radio"
            className="hidden"
            name="options"
            id={layer}
            checked={currentBaseLayer === layer}
            onChange={() => handleOptionChange(layer)}
          />
          <label
            className="cursor-pointer text-xs font-medium w-full h-full flex items-center justify-center capitalize"
            htmlFor={layer}
          >
            {layer}
          </label>
        </div>
      ))}
    </div>
  );
};

export default MapLayerSwitcher;
