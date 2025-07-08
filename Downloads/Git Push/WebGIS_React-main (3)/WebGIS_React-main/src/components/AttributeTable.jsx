import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FaTableList } from "react-icons/fa6";
import { getGeoServerFeatures } from "../api/geoserverClient";
import AttributeTableModal from "./AttributeTableModal";

const AttributeTable = ({ atrTableLayerName, map }) => {
  const [openModals, setOpenModals] = useState({}); // Tracks open modals
  const [tableData, setTableData] = useState({}); // Stores data for each layer

  const fetchData = async (layerName) => {
    if (tableData[layerName]) return; // Skip fetching if already exists

    try {
      const response = await getGeoServerFeatures(layerName);
      console.log("Fetched data:", response.data.features); // Debugging log

      setTableData((prevData) => ({
        ...prevData,
        [layerName]: response.data.features, // Store fetched data per layer
      }));
    } catch (err) {
      console.error("API Error:", err);
    }
  };

  const openAttributeTable = (layerName) => {
    setOpenModals((prev) => ({ ...prev, [layerName]: true }));
    fetchData(layerName); // Fetch data when opening
  };

  const closeAttributeTable = (layerName) => {
    setOpenModals((prev) => ({ ...prev, [layerName]: false }));
  };

  return (
    <>
      <div
        className="text-white ml-0.5 cursor-pointer"
        title="Open Attribute Table"
        role="button"
        onClick={() => openAttributeTable(atrTableLayerName)}
      >
        <FaTableList />
      </div>

      {/* Render modals dynamically for open layers */}
      {Object.keys(openModals).map(
        (layerName) =>
          openModals[layerName] &&
          createPortal(
            <AttributeTableModal
              key={layerName}
              isOpen={openModals[layerName]}
              onClose={() => closeAttributeTable(layerName)}
              layerName={layerName}
              data={tableData[layerName] || []} // Pass layer-specific data
              map={map}
            />,
            document.body
          )
      )}
    </>
  );
};

export default AttributeTable;
