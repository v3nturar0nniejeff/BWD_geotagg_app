import React, { useState, useMemo, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import { FaFilter, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { columnVisibility } from "../config/columnConfig";
import { formatLayerName } from "../utils/tblnameFormatter";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Add these import statements at the top with your other imports
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const AttributeTableModal = ({ isOpen, onClose, layerName, data, map }) => {
  if (!isOpen) return null;

  const geojsonStyle = {
    fillColor: "#e9d700",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
  };

  const columnsToDisplay = columnVisibility[layerName] || [];

  const [selectedRows, setSelectedRows] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [searchColumn, setSearchColumn] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  // Use a ref to maintain the highlighted layers mapping
  const highlightedLayersRef = useRef({});

  // Initialize Leaflet default icon settings
  useEffect(() => {
    // This fixes the missing icon issue in production builds
    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
      shadowAnchor: [12, 41],
    });
  }, []);

  // Add this useEffect right after the states
  useEffect(() => {
    if (data?.length > 0) {
      const firstKey =
        columnsToDisplay.length > 0
          ? columnsToDisplay[0]
          : Object.keys(data[0].properties)[0];
      setSearchColumn(firstKey);
    }
  }, [data, columnsToDisplay]);

  // Clean up layers when component unmounts or when modal closes
  useEffect(() => {
    return () => {
      // Remove all highlighted layers when component unmounts
      Object.values(highlightedLayersRef.current).forEach((layer) => {
        if (map && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
      highlightedLayersRef.current = {};
    };
  }, [map]);

  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (!searchTerm) return data;
    if (!searchColumn) return data;

    return data.filter((feature) => {
      const value = feature.properties[searchColumn];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm, searchColumn]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const [dimensions, setDimensions] = useState({
    width: 500,
    height: 400,
    x: window.innerWidth - 550,
    y: 20,
  });

  const handleCheckboxChange = (featureId) => {
    const isSelected = selectedRows.has(featureId);

    if (isSelected) {
      // Unselect: remove from selected set and remove the highlight
      const newSelected = new Set(selectedRows);
      newSelected.delete(featureId);
      setSelectedRows(newSelected);

      // Remove the specific layer for this feature if it exists
      if (highlightedLayersRef.current[featureId]) {
        if (map) {
          map.removeLayer(highlightedLayersRef.current[featureId]);
        }
        delete highlightedLayersRef.current[featureId];
      }
    } else {
      // Add to selected set
      const newSelected = new Set(selectedRows);
      newSelected.add(featureId);
      setSelectedRows(newSelected);

      // Find the selected feature
      const selectedFeature = data.find((feature) => feature.id === featureId);
      if (selectedFeature && map) {
        // Create GeoJSON layer
        const newHighlightLayer = L.geoJSON(selectedFeature, {
          style: geojsonStyle,
          // Add pointToLayer option to handle point features
          pointToLayer: (feature, latlng) => {
            return L.marker(latlng); // Uses the default icon settings we fixed above
          },
        }).addTo(map);

        // Store this layer in our highlighted layers object using the feature ID as key
        highlightedLayersRef.current[featureId] = newHighlightLayer;

        // Zoom to feature
        map.fitBounds(newHighlightLayer.getBounds());
      }
    }
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, searchColumn]);

  const handleClose = () => {
    // Remove all highlighted layers when the modal is closed
    Object.values(highlightedLayersRef.current).forEach((layer) => {
      if (map && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    // Reset state
    highlightedLayersRef.current = {};
    setSelectedRows(new Set());
    onClose();
  };

  return (
    <Rnd
      size={{ width: dimensions.width, height: dimensions.height }}
      position={{ x: dimensions.x, y: dimensions.y }}
      onDragStop={(e, d) => setDimensions({ ...dimensions, x: d.x, y: d.y })}
      onResizeStop={(e, direction, ref, delta, position) => {
        setDimensions({
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
          ...position,
        });
      }}
      minWidth={300}
      minHeight={300}
      bounds="window"
      className="z-[999]"
      dragHandleClassName="modal-header"
      enableUserSelectHack={false}
      disableDragging={false}
      dragAxis="both"
      cancel=".no-drag"
      style={{
        transition: "none",
        willChange: "transform",
      }}
      shouldUpdatePosition={true}
    >
      <div className="bg-white h-full rounded-lg shadow-xl border-2 border-gray-300 flex flex-col">
        {/* Draggable Header */}
        <div className="modal-header flex justify-between items-center p-1 bg-[#333333] cursor-move border-b">
          <h3 className="font-bold text-white text-lg ml-4">
            {formatLayerName(layerName)}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 mr-2 hover:text-red-600 text-white text-xl"
          >
            ×
          </button>
        </div>
        <div className="flex items-center space-x-2 mb-0.8 p-2">
          <FaFilter className="text-gray-600 text-3xl mt-1" />
          <select
            className="p-1 h-8 border rounded-lg border-gray-600 text-black text-xs bg-white"
            value={searchColumn}
            onChange={(e) => setSearchColumn(e.target.value)}
          >
            {data.length > 0 &&
              (columnsToDisplay.length > 0
                ? columnsToDisplay.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))
                : Object.keys(data[0].properties).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  )))}
          </select>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="placeholder:text-sm px-3 py-2 h-8 rounded-md border border-gray-600 w-full bg-white text-[16px] text-black focus:outline-none"
            placeholder="Search Layer"
            autoComplete="off"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full">
            <thead className="text-xs bg-gray-50">
              <tr className="border-b">
                <th className="text-center p-2 w-12">Select</th>
                {data.length > 0 ? (
                  columnsToDisplay.length > 0 ? (
                    columnsToDisplay.map((key) => (
                      <th key={key} className="text-left p-2">
                        {key}
                      </th>
                    ))
                  ) : (
                    Object.keys(data[0].properties).map((key) => (
                      <th key={key} className="text-left p-2">
                        {key}
                      </th>
                    ))
                  )
                ) : (
                  <th className="text-left p-2">No Data Available</th>
                )}
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-gray-200">
              {paginatedData.length > 0 ? (
                paginatedData.map((feature) => (
                  <tr
                    key={feature.id}
                    className={`border ${
                      selectedRows.has(feature.id) ? "bg-blue-200" : ""
                    }`}
                  >
                    <td className="border p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(feature.id)}
                        onChange={() => handleCheckboxChange(feature.id)}
                      />
                    </td>
                    {columnsToDisplay.length > 0
                      ? columnsToDisplay.map((key) => (
                          <td key={key} className="border p-2">
                            {feature.properties[key]}
                          </td>
                        ))
                      : // Fall back to all columns if none are specified
                        Object.values(feature.properties).map((value, i) => (
                          <td key={i} className="border p-2">
                            {value}
                          </td>
                        ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="100%" className="text-center p-4">
                    {data.length > 0
                      ? "No matching results"
                      : "No available data"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center p-2 bg-gray-50 border-t">
          <div className="text-xs text-gray-600">
            Page {currentPage} of {totalPages}
            {` (${filteredData.length} total results)`}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`p-1 rounded ${
                currentPage === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`p-1 rounded ${
                currentPage === totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </Rnd>
  );
};

export default AttributeTableModal;
