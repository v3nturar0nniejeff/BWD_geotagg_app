import React, { useState } from "react";
import { jsPDF } from "jspdf";
import { FaPrint } from "react-icons/fa";
import html2canvas from "html2canvas";
import logo from "../assets/images/bwdlogo.png";

const MapPrint = ({ mapRef }) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [producedBy, setProducedBy] = useState("");
  const [division, setDivision] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({
    north: [],
    south: [],
    east: [],
    west: []
  });

  const divisions = [
    "Engineering Division",
    "Project and Constrution"
  ].sort();

  const GEOSERVER_URL = "http://5.16.255.254:8080/geoserver";

  const getLegendUrl = (layerName) => {
    return `${GEOSERVER_URL}/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=bwdgis:${layerName}&LEGEND_OPTIONS=forceLabels:off`;
  };

  const captureMap = async () => {
    const mapContainer = mapRef?.current?._container || mapRef?.current;
    if (!mapContainer) {
      throw new Error("Map container not found");
    }

    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      setCurrentCoords({
        north: [
          ne.lat.toFixed(6),
          ((ne.lat + sw.lat) / 2).toFixed(6),
          sw.lat.toFixed(6)
        ],
        south: [
          sw.lat.toFixed(6),
          ((ne.lat + sw.lat) / 2).toFixed(6),
          ne.lat.toFixed(6)
        ],
        east: [
          ne.lng.toFixed(6),
          ((ne.lng + sw.lng) / 2).toFixed(6),
          sw.lng.toFixed(6)
        ],
        west: [
          sw.lng.toFixed(6),
          ((ne.lng + sw.lng) / 2).toFixed(6),
          ne.lng.toFixed(6)
        ]
      });
    }

    const elementsToHide = mapContainer.querySelectorAll(
      ".leaflet-control-container, .leaflet-bottom, .leaflet-top, .coordinates-control, .input, .search-controls"
    );
    elementsToHide.forEach((el) => {
      el.style.display = "none";
    });

    try {
      const canvas = await html2canvas(mapContainer, {
        useCORS: true,
        proxy: undefined,
        allowTaint: false,
        logging: false,
        scale: window.devicePixelRatio,
        backgroundColor: null,
      });

      return canvas;
    } finally {
      elementsToHide.forEach((el) => {
        el.style.display = "";
      });
    }
  };

  const generateLegendItems = async (mapRef) => {
    if (!mapRef.current) return [];
    
    const layers = [];
    mapRef.current.eachLayer((layer) => {
      if (layer.options && layer.options.layers) {
        const layerName = layer.options.layers.split(':')[1] || layer.options.layers;
        if (layer.options.visible !== false) {
          layers.push({
            name: layerName,
            color: layer.options.style || '#000000',
            legendUrl: getLegendUrl(layerName)
          });
        }
      }
    });
    
    return layers;
  };

  const handlePrintClick = async () => {
  setIsLoading(true);
  setIsCapturing(true);

  try {
    const canvas = await captureMap();
    
    // Create a cropped version centered on the map
    const croppedCanvas = document.createElement('canvas');
    const ctx = croppedCanvas.getContext('2d');
    
    // Convert inches to pixels (assuming 96 DPI)
    const dpi = 96;
    const cropWidthPx = 8.5 * dpi;  // ≈ 816 pixels
    const cropHeightPx = 8.1 * dpi; // ≈ 778 pixels
    
    // Calculate center crop position
    const cropX = (canvas.width - cropWidthPx) / 2;
    const cropY = (canvas.height - cropHeightPx) / 2;
    
    // Ensure we don't try to crop outside the canvas
    const adjustedCropX = Math.max(0, cropX);
    const adjustedCropY = Math.max(0, cropY);
    const adjustedWidth = Math.min(cropWidthPx, canvas.width - adjustedCropX);
    const adjustedHeight = Math.min(cropHeightPx, canvas.height - adjustedCropY);
    
    croppedCanvas.width = adjustedWidth;
    croppedCanvas.height = adjustedHeight;
    
    ctx.drawImage(
      canvas, 
      adjustedCropX, adjustedCropY,   // Source x,y
      adjustedWidth, adjustedHeight,  // Source width,height
      0, 0,                          // Destination x,y
      adjustedWidth, adjustedHeight   // Destination width,height
    );

    setPreviewImage(croppedCanvas.toDataURL("image/png"));
    setShowModal(true);
  } catch (error) {
    console.error("Error in print process:", error);
  } finally {
    setIsLoading(false);
    setIsCapturing(false);
  }
};

  const handleSave = async () => {
    try {
      if (!previewImage) {
        console.error("No preview image available");
        return;
      }

      const finalTitle = title.trim() === "" ? "Map Export" : title;
      const pdf = new jsPDF({ orientation: "landscape", unit: "in", format: [13, 8.5] });

      const pageWidth = 13;
      const pageHeight = 8.5;
      const sideMargin = 0.2;
      const bottomMargin = 0.2;
      const titleBorderWidth = 3.9;
      const titleBorderHeight = pageHeight - bottomMargin * 2;
      const mapWidth = 8.5;
      const mapHeight = 8.1;
      const mapX = sideMargin;
      const mapY = bottomMargin;



      const bounds = mapRef.current.getBounds();
      const ne = bounds.getNorthEast();
      const center = bounds.getCenter();
      const widthMeters = center.distanceTo([center.lat, ne.lng]);
      const mapWidthPixels = mapRef.current._container.clientWidth;
      const scaleRatio = Math.round((widthMeters * 100) / (mapWidthPixels * 0.0254));
      
      const standardScales = [500, 1000, 2000, 4000, 5000, 10000, 25000];
      const closestScale = standardScales.reduce((prev, curr) => 
        Math.abs(curr - scaleRatio) < Math.abs(prev - scaleRatio) ? curr : prev
      );
      
      const activeLayers = await generateLegendItems(mapRef);
      
      const groundDistance = closestScale >= 5000 ? 1000 : 500;
      const scaleBarWidth = (groundDistance / closestScale) * 39.37;
      const segmentCount = 4;
      const segmentWidth = scaleBarWidth / segmentCount;

      pdf.setLineWidth(0.02);
      pdf.setDrawColor(0, 0, 0);
      pdf.rect(mapX, mapY, mapWidth, mapHeight, "S");
      pdf.rect(pageWidth - titleBorderWidth - sideMargin, bottomMargin, titleBorderWidth, titleBorderHeight, "S");

      const logoWidth = 0.8;
      const logoHeight = 0.8;
      const logoX = pageWidth - titleBorderWidth - sideMargin + (titleBorderWidth - logoWidth) / 2;
      const logoY = bottomMargin + 0.2;
      
      if (logo) pdf.addImage(logo, "PNG", logoX, logoY, logoWidth, logoHeight);

      const availableSpace = titleBorderHeight - logoY - logoHeight - 0.5;
      const centerY = logoY + logoHeight + (availableSpace / 2);

      const titleX = pageWidth - titleBorderWidth / 2 - sideMargin;
      const titleY = centerY - 2.6;
      
      if (finalTitle) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        
        const maxWidth = titleBorderWidth - 0.5;
        const lines = pdf.splitTextToSize(finalTitle, maxWidth);
        const lineHeight = 0.2;
        const startY = titleY - ((lines.length - 1) * lineHeight) / 2;
        
        lines.forEach((line, index) => {
          pdf.text(line, titleX, startY + (index * lineHeight), { align: "center" });
        });

        const scaleBarY = startY + (lines.length * lineHeight) + 0.3;
        const scaleBarWidth = 2;
        const segmentCount = 4;
        const segmentWidth = scaleBarWidth / segmentCount;

        for (let i = 0; i < segmentCount; i++) {
          pdf.setFillColor(i % 2 === 0 ? 0 : 255);
          pdf.rect(
            titleX - scaleBarWidth/2 + (i * segmentWidth),
            scaleBarY,
            segmentWidth,
            0.1,
            "F"
          );
        }
        
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.01);
        pdf.rect(titleX - scaleBarWidth/2, scaleBarY, scaleBarWidth, 0.1, "S");
        
          const SCALE_BAR_UNIT = "m";  

       for (let i = 0; i <= segmentCount; i++) {
          const x = titleX - scaleBarWidth/2 + (i * segmentWidth);
          const numericValue = (i * (groundDistance/segmentCount));
          
          if (i === segmentCount) {
            // Main number
            pdf.setFontSize(8);
            pdf.text(numericValue.toString(), x, scaleBarY - 0.05, { align: "center" });
            
            // Unit label - adjusted position
            pdf.setFontSize(6);
            // x + 0.15 moves right, scaleBarY - 0.06 moves slightly down compared to previous -0.08
            pdf.text(SCALE_BAR_UNIT, x + 0.13, scaleBarY - 0.05, { align: "left" });
          } else {
            pdf.setFontSize(8);
            pdf.text(numericValue.toString(), x, scaleBarY - 0.05, { align: "center" });
          }
        }
        
        pdf.setFontSize(8);
        pdf.text(`Scale  1:${closestScale.toLocaleString()}`, titleX, scaleBarY + 0.2, { align: "center" });
        pdf.text(`Projection: WGS 84`, titleX, scaleBarY + 0.3, { align: "center" });

        if (activeLayers.length > 0) {
          const legendStartY = scaleBarY + 0.6;
          const legendSymbolWidth = 0.15;
          const legendSymbolHeight = 0.15;
          const legendLeftMargin = pageWidth - titleBorderWidth - sideMargin + 0.2;
          
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.text("LEGEND", titleX, legendStartY, { align: "center" });
          
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          
          let currentY = legendStartY + 0.3;
          
          for (const layer of activeLayers) {
            try {
              const img = new Image();
              img.crossOrigin = "Anonymous";
              img.src = layer.legendUrl;
              
              await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              });

              if (img.complete && img.naturalHeight !== 0) {
                pdf.addImage(
                  img, 
                  "PNG", 
                  legendLeftMargin, 
                  currentY - 0.1, 
                  legendSymbolWidth, 
                  legendSymbolHeight
                );
              } else {
                pdf.setFillColor(layer.color);
                pdf.rect(
                  legendLeftMargin, 
                  currentY - 0.05, 
                  legendSymbolWidth/2, 
                  legendSymbolHeight/2, 
                  "F"
                );
                pdf.setDrawColor(0, 0, 0);
                pdf.rect(
                  legendLeftMargin, 
                  currentY - 0.05, 
                  legendSymbolWidth/2, 
                  legendSymbolHeight/2, 
                  "S"
                );
              }
            } catch (error) {
              console.error("Error loading legend image:", error);
              pdf.setFillColor(layer.color);
              pdf.rect(
                legendLeftMargin, 
                currentY - 0.05, 
                legendSymbolWidth/2, 
                legendSymbolHeight/2, 
                "F"
              );
              pdf.setDrawColor(0, 0, 0);
              pdf.rect(
                legendLeftMargin, 
                currentY - 0.05, 
                legendSymbolWidth/2, 
                legendSymbolHeight/2, 
                "S"
              );
            }
            
            const formattedName = layer.name
              .replace(/[^a-zA-Z\s_]/g, "")
              .split("_")
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(" ");
            
            pdf.text(
              formattedName, 
              legendLeftMargin + legendSymbolWidth + 0.1, 
              currentY, 
              { align: "left" }
            );
            currentY += Math.max(legendSymbolHeight, 0.25);
          }

          if (description) {
            const descriptionY = currentY + 0.3;
            pdf.setFontSize(8);
            pdf.setFont("helvetica");
            const descriptionLines = pdf.splitTextToSize(description, titleBorderWidth - 0.4);
            descriptionLines.forEach((line, index) => {
              pdf.text(
                line, 
                pageWidth - titleBorderWidth - sideMargin + 0.2,
                descriptionY + (index * 0.2),
                { align: "left" }
              );
            });
          }
        }
      }



      const img = new Image();
      img.src = previewImage;
      img.onload = () => {
        pdf.addImage(img, "PNG", mapX, mapY, mapWidth, mapHeight);

        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);

        const offset = 0.02;
        
        const topY = mapY - offset;
        pdf.text(currentCoords.north[0], mapX + mapWidth - 0.05, topY, { align: "right" });
        pdf.text(currentCoords.north[1], mapX + mapWidth / 2, topY, { align: "center" });
        pdf.text(currentCoords.north[2], mapX + 0.05, topY, { align: "left" });

        const bottomY = mapY + mapHeight + offset + 0.1;
        pdf.text(currentCoords.south[0], mapX + 0.05, bottomY, { align: "left" });
        pdf.text(currentCoords.south[1], mapX + mapWidth / 2, bottomY, { align: "center" });
        pdf.text(currentCoords.south[2], mapX + mapWidth - 0.05, bottomY, { align: "right" });

        const leftX = mapX - offset;
        pdf.text(currentCoords.west[0], leftX, mapY + mapHeight - 0.05, { align: "left", angle: 90 });
        pdf.text(currentCoords.west[1], leftX, mapY + mapHeight / 2, { align: "left", angle: 90 });
        pdf.text(currentCoords.west[2], leftX, mapY + 0.6, { align: "left", angle: 90 });

        const rightX = mapX + mapWidth + offset + 0.55;
        pdf.text(currentCoords.east[0], rightX, mapY + 0.05, { align: "right", angle: -90 });
        pdf.text(currentCoords.east[1], rightX, mapY + mapHeight / 2, { align: "right", angle: -90 });
        pdf.text(currentCoords.east[2], rightX, mapY + mapHeight - 0.6, { align: "right", angle: -90 });

        pdf.setLineWidth(0.02);
        pdf.setDrawColor(0, 0, 0);
        for (let i = 0; i < mapWidth; i += 0.5) {
          if (i + 0.5 > mapWidth) break;
          pdf.setFillColor(i % 1 === 0 ? 0 : 255);
          pdf.rect(mapX + i, mapY, 0.5, 0.05, "F");
          pdf.rect(mapX + i, mapY + mapHeight - 0.05, 0.5, 0.05, "F");
        }
        for (let i = 0; i < mapHeight; i += 0.5) {
          if (i + 0.5 > mapHeight) break;
          pdf.setFillColor(i % 1 === 0 ? 0 : 255);
          pdf.rect(mapX, mapY + i, 0.05, 0.5, "F");
          pdf.rect(mapX + mapWidth - 0.005, mapY + i, 0.05, 0.5, "F");
        }

        const metadataX = pageWidth - titleBorderWidth + 0.01;
        const metadataY = pageHeight - bottomMargin - 1.3;
        const metadataWidth = titleBorderWidth - 0.4;

        let producedByText = "";
        if (producedBy && division) {
          producedByText = `Produced By: ${division} (${producedBy})`;
        } else if (producedBy) {
          producedByText = `Produced By: ${producedBy}`;
        } else if (division) {
          producedByText = `Produced By: ${division}`;
        } else {
          producedByText = "Produced By: BWD GIS Section, Brgy. Marcoville, Baguio City";
        }

        const metadata = [
          producedByText,
          "Data Source: BWD GIS Database, Google Maps",
          `Date Produced: ${new Date().toLocaleDateString()}`,
          "",
          "Disclaimer:",
          "Map data may change; verify with official sources.",
          "Unauthorized use is prohibited."
        ];

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        metadata.forEach((line, index) => {
          pdf.text(line, metadataX, metadataY + index * 0.2, { maxWidth: metadataWidth, align: "left" });
        });

        pdf.save(`${finalTitle}.pdf`);
        handleClose();
      };
    } catch (error) {
      console.error("Error saving PDF:", error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setTitle("");
    setPreviewImage("");
    setDescription("");
    setProducedBy("");
    setDivision("");
  };

  return (
    <div className="relative">
      <button
        onClick={handlePrintClick}
        className="text-white hover:text-gray-300"
        id="printMapBtn"
        title="Click to print current map."
      >
        <FaPrint />
      </button>

      <div
        className={`fixed inset-0 bg-black/50 z-[9999] transition-opacity duration-500 ${
          isCapturing ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div
              className={`
                border-4 border-white w-16 h-16 rounded-lg
                ${isCapturing ? "animate-pulse" : ""}
              `}
            />
            <div className="text-white text-xl font-bold mt-4 animate-pulse">
              Capturing...
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ease-in-out z-[9998] ${
          showModal ? "bg-opacity-50" : "bg-opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      <div
        className={`fixed inset-x-0 top-0 flex justify-center z-[9999] transition-all duration-300 ease-out ${
          showModal
            ? "opacity-100 translate-y-20"
            : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <div className="bg-[#343434] rounded-lg p-6 max-w-4xl w-[500px] mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
          <h2 className="text-2xl text-white font-bold mb-4">Save Map</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 p-1 block w-full border-gray-300 shadow-sm"
                placeholder="Enter map title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 p-1 block w-full border-gray-300 shadow-sm"
                rows={3}
                placeholder="Enter map description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white">
                Produced By (Name)
              </label>
              <input
                type="text"
                value={producedBy}
                onChange={(e) => setProducedBy(e.target.value)}
                className="mt-1 p-1 block w-full border-gray-300 shadow-sm"
                placeholder="e.g. Engr. Juan Dela Cruz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white">
                Division
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="mt-1 p-1 block w-full border-gray-300 shadow-sm"
              >
                <option value="">Select Division</option>
                {divisions.map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>
            <hr />

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Preview
              </label>
              <div className="border rounded-lg overflow-hidden">
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Map preview"
                    className="w-full h-auto"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-white border rounded-md hover:bg-gray-50 hover:text-black transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPrint;