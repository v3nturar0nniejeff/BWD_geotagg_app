import axios from "axios";

const geoServerClient = axios.create({
  baseURL: "http://5.16.255.254:8080/geoserver/wfs", // Base URL for GeoServer
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Function to get features from GeoServer
export const getGeoServerFeatures = (
  layerName,
  cqlFilter = null,
  maxFeatures = null
) => {
  const params = {
    service: "WFS",
    version: "1.1.0",
    request: "GetFeature",
    typename: layerName, // Dynamic layer name
    srsname: "EPSG:4326",
    outputFormat: "application/json",
  };

  if (cqlFilter) {
    params.CQL_FILTER = cqlFilter;
  }

  if (maxFeatures) {
    params.maxFeatures = maxFeatures;
  }

  return geoServerClient.get("", { params }); // Axios will append params automatically
};

export const getFeatureForPredictiveText = (
  layerName,
  cqlFilter,
  maxFeatures
) => {
  const params = {
    service: "WFS",
    version: "1.1.0",
    request: "GetFeature",
    typename: `bwdgis:${layerName}`,
    CQL_FILTER: cqlFilter,
    srsname: "EPSG:4326",
    outputFormat: "application/json",
  };
  if (maxFeatures) {
    params.maxFeatures = maxFeatures;
  }
  return geoServerClient.get("", { params });
};

export const getSingleGeoServerFeature = (layerName) => {
  const params = {
    service: "WFS",
    version: "1.1.0",
    request: "GetFeature",
    typename: layerName,
    srsname: "EPSG:4326",
    outputFormat: "application/json",
    maxFeatures: 1, // Ensures only 1 row is returned
  };

  return geoServerClient.get("", { params });
};

export const getFeatureBySearch = (layerName, columnName, value) => {
  const params = {
    service: "WFS",
    version: "1.1.0",
    request: "GetFeature",
    typename: `bwdgis:${layerName}`,
    CQL_FILTER: `${columnName} ILIKE '%${value}%'`,
    srsname: "EPSG:4326",
    outputFormat: "application/json",
  };
  return geoServerClient.get("", { params });
};
