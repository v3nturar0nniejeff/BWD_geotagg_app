import React, { useState, useEffect } from "react";

const LayerLegend = ({ layerName }) => {
  const [legendUrl, setLegendUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!layerName) return;

    const baseUrl = "http://5.16.255.254:8080/geoserver/wms";
    const legendUrl =
      `${baseUrl}?` +
      new URLSearchParams({
        REQUEST: "GetLegendGraphic",
        VERSION: "1.0.0",
        FORMAT: "image/png",
        WIDTH: "15",
        HEIGHT: "15",
        LAYER: `bwdgis:${layerName}`,
        LEGEND_OPTIONS: [
          "forceLabels:off",
          "fontName:Arial",
          "fontSize:0",
          "dpi:96",
        ].join(";"),
      }).toString();

    setLegendUrl(legendUrl);
  }, [layerName]);

  return (
    <div className="flex items-center justify-start h-full">
      {legendUrl && (
        <img
          src={legendUrl}
          alt={`Legend for ${layerName}`}
          className="h-auto object-contain"
          style={{ maxHeight: "50px" }}
          onLoad={() => setIsLoading(false)}
        />
      )}
      {isLoading && (
        <div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />
      )}
    </div>
  );
};

export default LayerLegend;
