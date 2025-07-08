import React, { useEffect, useState } from "react";
import L from "leaflet";
import axios from "axios";
import CustomImageViewer from "./CustomImageViewer";

const MapWithFeatureInfo = ({ map, orderedLayers }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    imageUrl: "",
    caption: "",
  });
  const [highlightedLayer, setHighlightedLayer] = useState(null);
  const [viewerImages, setViewerImages] = useState([]);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [feature, setFeature] = useState(null);

  useEffect(() => {
    return () => {
      if (highlightedLayer) {
        map?.removeLayer(highlightedLayer);
        console.log("Cleanup: removed highlight layer");
      }
    };
  }, [highlightedLayer, map]);

  // Handle image click event for land rights and pumping stations
  // Handle image click event for land rights, pumping stations, and service lines
  const handleImageClick = (event) => {
    event.preventDefault();
    const link = event.currentTarget;
    console.log("Image clicked:", link.dataset.src);

    // Get the current image URL
    const clickedImageUrl = link.dataset.src || link.querySelector("img").src;

    // Find the feature-images container within the same feature section
    const featureDiv =
      link.closest("div.image-gallery").parentElement.parentElement;
    let imageUrls = [];
    let initialIndex = 0;

    if (featureDiv) {
      const imagesContainer = featureDiv.querySelector(".feature-images");
      if (imagesContainer && imagesContainer.dataset.images) {
        try {
          const imageData = JSON.parse(imagesContainer.dataset.images);

          // Handle different data structures
          if (Array.isArray(imageData)) {
            if (typeof imageData[0] === "string") {
              // Old format: array of strings
              imageUrls = imageData;
              initialIndex = imageUrls.findIndex(
                (url) => url === clickedImageUrl
              );
            } else if (imageData[0].url) {
              // New format: array of objects with url and caption
              imageUrls = imageData.map((item) => item.url);
              initialIndex = imageUrls.findIndex(
                (url) => url === clickedImageUrl
              );
            }
          }

          if (initialIndex === -1) initialIndex = 0;
        } catch (e) {
          console.error("Error parsing image URLs:", e);
          imageUrls = [clickedImageUrl];
        }
      } else {
        imageUrls = [clickedImageUrl];
      }
    } else {
      imageUrls = [clickedImageUrl];
    }

    console.log("Opening image viewer with images:", imageUrls);
    setViewerImages(imageUrls);
    setShowImageViewer(true);
  };

  // Handle regular image link click (for non-gallery images)
  const handleSingleImageClick = (event) => {
    event.preventDefault();
    const link = event.currentTarget;

    setModalState({
      isOpen: true,
      imageUrl: link.dataset.src || link.querySelector("img").src,
      caption: link.dataset.date || "Date not available",
    });
  };

  useEffect(() => {
    if (!map) return;

    let currentPopups = [];

    const handleClick = async (e) => {
      if (highlightedLayer) {
        map.removeLayer(highlightedLayer);
        setHighlightedLayer(null);
      }

      const latlng = e.latlng;
      const x = Math.round(map.latLngToContainerPoint(latlng).x);
      const y = Math.round(map.latLngToContainerPoint(latlng).y);

      for (const activeLayer of orderedLayers.filter(
        (layer) => layer.visible
      )) {
        const url = "http://5.16.255.254:8080/geoserver/wms";
        const params = {
          request: "GetFeatureInfo",
          service: "WMS",
          srs: "EPSG:4326",
          transparent: true,
          version: "1.1.1",
          format: "image/png",
          info_format: "application/json",
          bbox: map.getBounds().toBBoxString(),
          height: map.getSize().y,
          width: map.getSize().x,
          layers: `bwdgis:${activeLayer.name}`,
          query_layers: `bwdgis:${activeLayer.name}`,
          feature_count: 20,
          x: x,
          y: y,
        };

        try {
          const response = await axios.get(url, { params });
          const features = response.data.features;

          if (features && features.length > 0) {
            const highlightStyle = {
              color: "#ffff00",
              weight: 3,
              opacity: 1,
              fillColor: "#ffff00",
              fillOpacity: 0.3,
            };

            const highlight = L.geoJSON(features, {
              style: highlightStyle,
              pointToLayer: (feature, latlng) => {
                return L.circleMarker(latlng, {
                  radius: 8,
                  ...highlightStyle,
                });
              },
            }).addTo(map);

            setHighlightedLayer(highlight);

            // For land rights layer, fetch related images
            if (activeLayer.name.toLowerCase() === "2024_land_rights") {
              await Promise.all(
                features.map(async (feature) => {
                  try {
                    // const featureId = feature.land_id.split(".").pop();
                    const featureId = feature.properties.land_id;
                    console.log("Feature ID:", featureId);

                    const imageResponse = await axios.get(
                      `http://5.16.255.254:8080/geoserver/wfs`,
                      {
                        params: {
                          service: "WFS",
                          version: "2.0.0",
                          request: "GetFeature",
                          typeName: "bwdgis:2024_landrights_photos",
                          CQL_FILTER: `fkey=${featureId}`,
                          outputFormat: "application/json",
                        },
                      }
                    );

                    console.log("Image Response:", imageResponse.data);

                    feature.properties.landRightImages =
                      imageResponse.data.features.map(
                        (imgFeature) => imgFeature.properties.images
                      );
                  } catch (error) {
                    console.error("Error fetching land rights images:", error);
                    console.error("Feature ID:", feature.id);
                    console.error(
                      "Full error details:",
                      error.response?.data || error
                    );
                    feature.properties.landRightImages = [];
                  }
                })
              );
            }

            // For pumping stations layer, fetch related images
            if (activeLayer.name.toLowerCase() === "pumping stations") {
              await Promise.all(
                features.map(async (feature) => {
                  try {
                    const featureId = feature.id.split(".").pop();
                    console.log("Feature ID:", featureId);

                    const imageResponse = await axios.get(
                      `http://5.16.255.254:8080/geoserver/wfs`,
                      {
                        params: {
                          service: "WFS",
                          version: "2.0.0",
                          request: "GetFeature",
                          typeName: "bwdgis:2024 pumping station photos",
                          CQL_FILTER: `ps_id=${featureId}`,
                          outputFormat: "application/json",
                        },
                      }
                    );

                    console.log("Image Response:", imageResponse.data);

                    feature.properties.PumpingStationsImages =
                      imageResponse.data.features.map(
                        (imgFeature) => imgFeature.properties.images
                      );
                  } catch (error) {
                    console.error(
                      "Error fetching pumping stations images:",
                      error
                    );
                    console.error("Feature ID:", feature.id);
                    console.error(
                      "Full error details:",
                      error.response?.data || error
                    );
                    feature.properties.PumpingStationsImages = [];
                  }
                })
              );
            }

            // For service line layer, fetch related images
            if (activeLayer.name.toLowerCase() === "service_line") {
              // Use Promise.allSettled instead of Promise.all to ensure all promises complete
              const results = await Promise.allSettled(
                features.map(async (feature) => {
                  try {
                    const featureId = feature.id.split(".").pop();
                    console.log("Service Line Feature ID:", featureId);

                    const imageResponse = await axios.get(
                      `http://5.16.255.254:4000/api/service-line-photos/${featureId}/`
                    );

                    console.log(
                      "Service Line Image Response:",
                      imageResponse.data
                    );

                    // Always initialize serviceLineImages, even if empty
                    if (
                      imageResponse.data.photos &&
                      imageResponse.data.photos.length > 0
                    ) {
                      feature.properties.serviceLineImages =
                        imageResponse.data.photos.map((photo) => {
                          const filename = photo.images.split("\\").pop();
                          return {
                            url: `http://5.16.255.254:4000/static/service%20line%20photos/photos/${encodeURIComponent(
                              filename
                            )}`,
                            taken_at: photo.taken_at,
                            id: photo.id,
                          };
                        });
                    } else {
                      feature.properties.serviceLineImages = [];
                    }

                    console.log(
                      `Feature ${featureId} has ${feature.properties.serviceLineImages.length} images`
                    );

                    return { success: true, featureId };
                  } catch (error) {
                    console.error("Error fetching service line images:", error);
                    console.error("Feature ID:", feature.id.split(".").pop());

                    // Always set serviceLineImages to empty array on error
                    feature.properties.serviceLineImages = [];

                    console.log(
                      `Feature ${feature.id
                        .split(".")
                        .pop()} - continuing without images due to error`
                    );

                    return {
                      success: false,
                      featureId: feature.id.split(".").pop(),
                      error,
                    };
                  }
                })
              );
            }

            if (activeLayer.name.toLowerCase() === "arvs") {
              // Use Promise.allSettled instead of Promise.all to ensure all promises complete
              const results = await Promise.allSettled(
                features.map(async (feature) => {
                  try {
                    const featureId = feature.id.split(".").pop();
                    console.log("ARVs Feature ID:", featureId);

                    const imageResponse = await axios.get(
                      `http://5.16.255.254:4000/api/arv-photos/${featureId}/`
                    );

                    console.log(
                      "ARVs Image Response:",
                      imageResponse.data
                    );

                    // Always initialize serviceLineImages, even if empty
                    if (
                      imageResponse.data.photos &&
                      imageResponse.data.photos.length > 0
                    ) {
                      feature.properties.arvImages =
                        imageResponse.data.photos.map((photo) => {
                          const filename = photo.images.split("\\").pop();
                          return {
                            url: `http://5.16.255.254:4000/static/arv%20photos/photos/${encodeURIComponent(
                              filename
                            )}`,
                            taken_at: photo.taken_at,
                            id: photo.id,
                          };
                        });
                    } else {
                      feature.properties.arvImages = [];
                    }

                    console.log(
                      `Feature ${featureId} has ${feature.properties.arvImages.length} images`
                    );

                    return { success: true, featureId };
                  } catch (error) {
                    console.error("Error fetching arv images:", error);
                    console.error("Feature ID:", feature.id.split(".").pop());

                    // Always set serviceLineImages to empty array on error
                    feature.properties.arvImages = [];

                    console.log(
                      `Feature ${feature.id
                        .split(".")
                        .pop()} - continuing without images due to error`
                    );

                    return {
                      success: false,
                      featureId: feature.id.split(".").pop(),
                      error,
                    };
                  }
                })
              );

              // Log results
              results.forEach((result, index) => {
                if (result.status === "rejected") {
                  console.error(
                    `Promise ${index} was rejected:`,
                    result.reason
                  );
                }
              });

              // Log final state
              console.log(
                "All service line features processed:",
                features.map((f) => ({
                  id: f.properties.fid,
                  imageCount: f.properties.serviceLineImages?.length || 0,
                }))
              );
            }

            let popupContent = generatePopupContent(activeLayer.name, features);

            // Handle standpipe specific logic
            if (activeLayer.name.toLowerCase() === "standpipe") {
              const standpipeId = features[0].properties.gid;
              const metersParams = {
                ...params,
                layers: "bwdgis:meter",
                query_layers: "bwdgis:meter",
                cql_filter: `standpipe_id=${standpipeId}`,
              };

              try {
                const metersResponse = await axios.get(url, {
                  params: metersParams,
                });
                const meters = metersResponse.data.features;

                if (meters && meters.length > 0) {
                  let metersContent = "<h4><b>Meters Included:</b></h4><ul>";
                  meters.forEach((meter) => {
                    metersContent += `<li>${meter.properties.custcode}</li>`;
                  });
                  metersContent += "</ul>";
                  popupContent += metersContent;
                } else {
                  popupContent += "<p>No meters found for this standpipe.</p>";
                }
              } catch (error) {
                console.error("Error fetching related meters:", error);
                popupContent += "<p>Error loading meters.</p>";
              }
            }

            const popup = L.popup()
              .setLatLng(latlng)
              .setContent(popupContent)
              .openOn(map);

            // Add the popup to the DOM and then set up event handlers
            popup.on("add", () => {
              setupModalHandlers();
            });

            currentPopups.push({ popup, highlight });
          }
        } catch (error) {
          console.error(
            `Error fetching feature info for ${activeLayer.name}:`,
            error
          );
        }
      }
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
      currentPopups.forEach(({ popup, highlight }) => {
        map.removeLayer(highlight);
        map.closePopup(popup);
      });
    };
  }, [map, orderedLayers]);

  // Function to extract image URLs from HTML string
  const extractImagesFromHTML = (htmlString) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;
    const imgElements = tempDiv.querySelectorAll("img");

    const imageUrls = [];
    const processedImages = new Set();

    imgElements.forEach((imgElement) => {
      let imgSrc = imgElement.getAttribute("src");

      if (imgSrc && !processedImages.has(imgSrc)) {
        processedImages.add(imgSrc);
        imageUrls.push(imgSrc);
      }
    });

    return imageUrls;
  };

  const generatePopupContent = (layer, features) => {
    // handling for land rights layer
    if (layer.toLowerCase() === "2024_land_rights") {
      let content = `
        <div style="max-height: 300px; overflow-y: auto; padding: 0px; font-size: 10px;">
          <hr>
            <h3 style="padding: 10px 0; font-size: 14px;"><b>${layer
              .replace(/[^a-zA-Z\s_]/g, "")
              .split("_")
              .join(" ")
              .trim()
              .toUpperCase()} [${features.length}]</b></h3>
            <hr>
          `;

      features.forEach((feature, index) => {
        content += `
          <div style="padding-top: 15px;">
            <strong style="font-size: 13px;">Feature ${index + 1}:</strong>
            <div style="padding-bottom: 15px; font-size: 12px;">
        `;

        const columnMapping = {
          loc_desc: "Area",
          date: "Date Tagged",
          location: "Location",
        };

        for (const key in feature.properties) {
          if (
            ![
              "images",
              "landRightImages",
              "tax_dec_no",
              "date_acq",
              "remarks",
              "land_id",
              "reference",
              "title_no",
              "balpercard",
            ].includes(key)
          ) {
            let value = feature.properties[key];

            if (key === "date" && value && value.includes("Z")) {
              value = new Date(value).toLocaleDateString();
            }

            const displayName = columnMapping[key] || key;
            content += `<strong>${displayName}:</strong> ${value}<br>`;
          }
        }

        console.log("Image features:", feature.properties);
        if (feature.properties.hasOwnProperty("landRightImages")) {
          const imageHTML = feature.properties.landRightImages;
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = imageHTML;
          const imgElements = tempDiv.querySelectorAll("img");
          console.log("Image elements:", imgElements);
          if (imgElements.length > 0) {
            content += `
              <div style="padding-top: 25px;">
                <strong>Images:</strong><br>
                <div class="image-gallery" style="display: flex; flex-wrap: wrap; gap: 10px; ">
            `;

            const processedImages = new Set();
            const featureImageUrls = [];

            imgElements.forEach((imgElement) => {
              let imgSrc = imgElement.getAttribute("src");

              if (!processedImages.has(imgSrc)) {
                processedImages.add(imgSrc);

                if (imgSrc) {
                  imgSrc = imgSrc.replace(/\\/g, "/");
                  const filename = imgSrc.split("/").pop();
                  console.log("Extracted filename:", filename);
                  const fullImageUrl = `http://5.16.255.254:4000/static/Landrights%20photos/2024%20landrights%20photos/${encodeURIComponent(
                    filename
                  )}`;
                  console.log("Full Image URL:", fullImageUrl);

                  featureImageUrls.push(fullImageUrl);

                  content += `
        <div style="padding-top: 45px; padding-bottom: 40px">
          
          <div class="image-container" style="width: 250px; height: 250px; display: flex; justify-content: center; align-items: center; ">
            <a href='javascript:void(0);' class='landRightImageLink' data-feature-index='${index}' data-src='${fullImageUrl}'>
              <img 
                src='${fullImageUrl}' 
                alt='Land Rights Image' 
                style='max-width: 100%; max-height: 100%; object-fit: contain; '
                onerror='this.onerror=null; this.style.display="none"; console.log("Image failed to load:", "${fullImageUrl}");'
              >
            </a>
          </div>
        </div>
      `;
                }
              }
            });

            // Store feature images in a data attribute
            if (featureImageUrls.length > 0) {
              content += `<div class="feature-images" data-images='${JSON.stringify(
                featureImageUrls
              )}' style="display: none;"></div>`;
            }

            processedImages.clear();

            content += `</div></div>`;
          }
        }

        content += `</div><hr>`;
      });

      content += "</div>";
      return content;
    }

    // handling for pumping stations layer
    if (layer.toLowerCase() === "pumping stations") {
      let content = `
        <div style="max-height: 300px; overflow-y: auto; padding: 0px; font-size: 10px;">
          <hr>
            <h3 style="padding: 10px 0; font-size: 14px;"><b>${layer
              .replace(/[^a-zA-Z\s_]/g, "")
              .split("_")
              .join(" ")
              .trim()
              .toUpperCase()} [${features.length}]</b></h3>
            <hr>
          `;
      console.log("HEYYY IM HERE", content);

      features.forEach((feature, index) => {
        content += `
          <div style="padding-top: 15px;">
            <strong style="font-size: 13px;">Feature ${index + 1}:</strong>
            <div style="padding-bottom: 15px; font-size: 12px;">
        `;

        const columnMapping = {
          name: "Name",
          date: "Date Tagged",
          are: "Area",
        };

        // Create objects to store regular content and date content
        let orderedContent = {};
        let dateContent = "";

        // First pass: separate date and other properties
        for (const key in feature.properties) {
          if (
            !["PumpingStationsImages", "x", "y", "ele", "attachment"].includes(
              key
            )
          ) {
            let value = feature.properties[key];

            if (key === "date" && value) {
              // Handle date formatting
              const datePart = value.split(" ")[0];
              const [year, month, day] = datePart.split("/");
              dateContent = `<strong>${columnMapping[key]}:</strong> ${month}/${day}/${year}<br>`;
            } else {
              // Store non-date content
              const displayName = columnMapping[key] || key;
              orderedContent[
                key
              ] = `<strong>${displayName}:</strong> ${value}<br>`;
            }
          }
        }

        // Add regular content first
        for (const key in orderedContent) {
          content += orderedContent[key];
        }

        // Add date content last
        content += dateContent;

        console.log("Image features:", feature.properties);

        if (feature.properties.hasOwnProperty("PumpingStationsImages")) {
          const imageHTML = feature.properties.PumpingStationsImages;
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = imageHTML;
          const imgElements = tempDiv.querySelectorAll("img");
          console.log("Image elements:", imgElements);
          if (imgElements.length > 0) {
            content += `
              <div style="padding-top: 25px;">
                <strong>Images:</strong><br>
                <div class="image-gallery" style="display: flex; flex-wrap: wrap; gap: 10px; ">
            `;

            const processedImages = new Set();
            const featureImageUrls = [];

            imgElements.forEach((imgElement) => {
              let imgSrc = imgElement.getAttribute("src");

              if (!processedImages.has(imgSrc)) {
                processedImages.add(imgSrc);

                if (imgSrc) {
                  imgSrc = imgSrc.replace(/\\/g, "/");
                  const filename = imgSrc.split("/").pop();
                  console.log("Extracted filename:", filename);
                  const fullImageUrl = `http://5.16.255.254:4000/static/pumping%20station%20photos/photos/${encodeURIComponent(
                    filename
                  )}`;
                  console.log("Full Image URL:", fullImageUrl);

                  featureImageUrls.push(fullImageUrl);

                  content += `
                    <div style="padding-top: 45px; padding-bottom: 40px">
                      
                      <div class="image-container" style="width: 250px; height: 250px; display: flex; justify-content: center; align-items: center; ">
                        <a href='javascript:void(0);' class='pumpingStationImageLink' data-feature-index='${index}' data-src='${fullImageUrl}'>
                          <img 
                            src='${fullImageUrl}' 
                            alt='Pumping Station Image' 
                            style='max-width: 100%; max-height: 100%; object-fit: contain; '
                            onerror='this.onerror=null; this.style.display="none"; console.log("Image failed to load:", "${fullImageUrl}");'
                          >
                        </a>
                      </div>
                    </div>
                  `;
                }
              }
            });

            // Store feature images in a data attribute
            if (featureImageUrls.length > 0) {
              content += `<div class="feature-images" data-images='${JSON.stringify(
                featureImageUrls
              )}' style="display: none;"></div>`;
            }

            processedImages.clear();

            content += `</div></div>`;
          }
        }

        content += `</div><hr>`;
      });

      content += "</div>";
      return content;
    }

    // handling for service line layer
    if (layer.toLowerCase() === "service_line") {
      let content = `
    <div style="max-height: 300px; overflow-y: auto; padding: 0px; font-size: 10px;">
      <hr>
        <h3 style="padding: 10px 0; font-size: 14px;"><b>${layer
          .replace(/[^a-zA-Z\s_]/g, "")
          .split("_")
          .join(" ")
          .trim()
          .toUpperCase()} [${features.length}]</b></h3>
        <hr>
      `;

      features.forEach((feature, index) => {
        content += `
      <div style="padding-top: 15px;">
        <strong style="font-size: 13px;">Feature ${index + 1}:</strong>
        <div style="padding-bottom: 15px; font-size: 12px;">
    `;

        const columnMapping = {
          fid: "Service Line ID",
          date: "Date Tagged",
          location: "Location",
          status: "Status",
        };

        // Always display properties first
        for (const key in feature.properties) {
          if (
            !["serviceLineImages", "images", "x", "y", "geom"].includes(key)
          ) {
            let value = feature.properties[key];

            if (key === "date" && value && value.includes("Z")) {
              value = new Date(value).toLocaleDateString();
            }

            const displayName = columnMapping[key] || key;
            content += `<strong>${displayName}:</strong> ${value}<br>`;
          }
        }

        // Handle images section - this should always execute
        const hasImages =
          feature.properties.serviceLineImages &&
          Array.isArray(feature.properties.serviceLineImages) &&
          feature.properties.serviceLineImages.length > 0;

        console.log(
          `Feature ${index + 1} has images:`,
          hasImages,
          feature.properties.serviceLineImages
        );

        if (hasImages) {
          content += `
        <div style="padding-top: 25px;">
          <strong>Images:</strong><br>
          <div class="image-gallery" style="display: flex; flex-wrap: wrap; gap: 10px;">
      `;

          const featureImageUrls = [];

          feature.properties.serviceLineImages.forEach(
            (imageData, imgIndex) => {
              const fullImageUrl = imageData.url;
              const dateTaken = imageData.taken_at
                ? new Date(imageData.taken_at).toLocaleDateString()
                : "Date not available";

              featureImageUrls.push(fullImageUrl);

              content += `
          <div style="padding-top: 45px; padding-bottom: 40px">
            <div class="image-container" style="width: 250px; height: 250px; display: flex; justify-content: center; align-items: center;">
              <a href='javascript:void(0);' class='serviceLineImageLink' data-feature-index='${index}' data-src='${fullImageUrl}' data-caption='${dateTaken}'>
                <img 
                  src='${fullImageUrl}' 
                  alt='Service Line Image - ${dateTaken}' 
                  style='max-width: 100%; max-height: 100%; object-fit: contain;'
                  onerror='this.onerror=null; this.style.display="none"; console.log("Image failed to load:", "${fullImageUrl}");'
                >
              </a>
            </div>
            <div style="text-align: center; font-size: 10px; margin-top: 5px; color:white;">
              ${dateTaken}
            </div>
          </div>
        `;
            }
          );

          if (featureImageUrls.length > 0) {
            content += `<div class="feature-images" data-images='${JSON.stringify(
              featureImageUrls
            )}' style="display: none;"></div>`;
          }

          content += `</div></div>`;
        } else {
          // Always show this section when no images
          content += `
        <div style="padding-top: 15px;">
          <strong>Images:</strong><br>
          <div style="font-style: italic; color: #666; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
            No images available for this service line.
          </div>
        </div>
      `;
        }

        content += `</div><hr>`;
      });

      content += "</div>";
      return content;
    }

    if (layer.toLowerCase() === "arvs") {
      let content = `
    <div style="max-height: 300px; overflow-y: auto; padding: 0px; font-size: 10px;">
      <hr>
        <h3 style="padding: 10px 0; font-size: 14px;"><b>${layer
          .replace(/[^a-zA-Z\s_]/g, "")
          .split("_")
          .join(" ")
          .trim()
          .toUpperCase()} [${features.length}]</b></h3>
        <hr>
      `;

      features.forEach((feature, index) => {
        content += `
      <div style="padding-top: 15px;">
        <strong style="font-size: 13px;">Feature ${index + 1}:</strong>
        <div style="padding-bottom: 15px; font-size: 12px;">
    `;

        const columnMapping = {
          fid: "ARV ID",
          date: "Date Tagged",
          location: "Location",
          status: "Status",
        };

        // Always display properties first
        for (const key in feature.properties) {
          if (
            !["arvImages", "images", "x", "y", "geom"].includes(key)
          ) {
            let value = feature.properties[key];

            if (key === "date" && value && value.includes("Z")) {
              value = new Date(value).toLocaleDateString();
            }

            const displayName = columnMapping[key] || key;
            content += `<strong>${displayName}:</strong> ${value}<br>`;
          }
        }

        // Handle images section - this should always execute
        const hasImages =
          feature.properties.arvImages &&
          Array.isArray(feature.properties.arvImages) &&
          feature.properties.arvImages.length > 0;

        console.log(
          `Feature ${index + 1} has images:`,
          hasImages,
          feature.properties.arvImages
        );

        if (hasImages) {
          content += `
        <div style="padding-top: 25px;">
          <strong>Images:</strong><br>
          <div class="image-gallery" style="display: flex; flex-wrap: wrap; gap: 10px;">
      `;

          const featureImageUrls = [];

          feature.properties.arvImages.forEach(
            (imageData, imgIndex) => {
              const fullImageUrl = imageData.url;
              const dateTaken = imageData.taken_at
                ? new Date(imageData.taken_at).toLocaleDateString()
                : "Date not available";

              featureImageUrls.push(fullImageUrl);

              content += `
          <div style="padding-top: 45px; padding-bottom: 40px">
            <div class="image-container" style="width: 250px; height: 250px; display: flex; justify-content: center; align-items: center;">
              <a href='javascript:void(0);' class='arvImageLink' data-feature-index='${index}' data-src='${fullImageUrl}' data-caption='${dateTaken}'>
                <img 
                  src='${fullImageUrl}' 
                  alt='ARV Image - ${dateTaken}' 
                  style='max-width: 100%; max-height: 100%; object-fit: contain;'
                  onerror='this.onerror=null; this.style.display="none"; console.log("Image failed to load:", "${fullImageUrl}");'
                >
              </a>
            </div>
            <div style="text-align: center; font-size: 10px; margin-top: 5px; color:white;">
              ${dateTaken}
            </div>
          </div>
        `;
            }
          );

          if (featureImageUrls.length > 0) {
            content += `<div class="feature-images" data-images='${JSON.stringify(
              featureImageUrls
            )}' style="display: none;"></div>`;
          }

          content += `</div></div>`;
        } else {
          // Always show this section when no images
          content += `
        <div style="padding-top: 15px;">
          <strong>Images:</strong><br>
          <div style="font-style: italic; color: #666; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
            No images available for this arv.
          </div>
        </div>
      `;
        }

        content += `</div><hr>`;
      });

      content += "</div>";
      return content;
    }


     if (layer.toLowerCase() === "arvs") {
      let content = `
    <div style="max-height: 300px; overflow-y: auto; padding: 0px; font-size: 10px;">
      <hr>
        <h3 style="padding: 10px 0; font-size: 14px;"><b>${layer
          .replace(/[^a-zA-Z\s_]/g, "")
          .split("_")
          .join(" ")
          .trim()
          .toUpperCase()} [${features.length}]</b></h3>
        <hr>
      `;

      features.forEach((feature, index) => {
        content += `
      <div style="padding-top: 15px;">
        <strong style="font-size: 13px;">Feature ${index + 1}:</strong>
        <div style="padding-bottom: 15px; font-size: 12px;">
    `;

        const columnMapping = {
          fid: "ARV ID",
          date: "Date Tagged",
          location: "Location",
          status: "Status",
        };

        // Always display properties first
        for (const key in feature.properties) {
          if (
            !["arvImages", "images", "x", "y", "geom"].includes(key)
          ) {
            let value = feature.properties[key];

            if (key === "date" && value && value.includes("Z")) {
              value = new Date(value).toLocaleDateString();
            }

            const displayName = columnMapping[key] || key;
            content += `<strong>${displayName}:</strong> ${value}<br>`;
          }
        }

        // Handle images section - this should always execute
        const hasImages =
          feature.properties.arvImages &&
          Array.isArray(feature.properties.arvImages) &&
          feature.properties.arvImages.length > 0;

        console.log(
          `Feature ${index + 1} has images:`,
          hasImages,
          feature.properties.arvImages
        );

        if (hasImages) {
          content += `
        <div style="padding-top: 25px;">
          <strong>Images:</strong><br>
          <div class="image-gallery" style="display: flex; flex-wrap: wrap; gap: 10px;">
      `;

          const featureImageUrls = [];

          feature.properties.arvImages.forEach(
            (imageData, imgIndex) => {
              const fullImageUrl = imageData.url;
              const dateTaken = imageData.taken_at
                ? new Date(imageData.taken_at).toLocaleDateString()
                : "Date not available";

              featureImageUrls.push(fullImageUrl);

              content += `
          <div style="padding-top: 45px; padding-bottom: 40px">
            <div class="image-container" style="width: 250px; height: 250px; display: flex; justify-content: center; align-items: center;">
              <a href='javascript:void(0);' class='arvImageLink' data-feature-index='${index}' data-src='${fullImageUrl}' data-caption='${dateTaken}'>
                <img 
                  src='${fullImageUrl}' 
                  alt='ARV Image - ${dateTaken}' 
                  style='max-width: 100%; max-height: 100%; object-fit: contain;'
                  onerror='this.onerror=null; this.style.display="none"; console.log("Image failed to load:", "${fullImageUrl}");'
                >
              </a>
            </div>
            <div style="text-align: center; font-size: 10px; margin-top: 5px; color:white;">
              ${dateTaken}
            </div>
          </div>
        `;
            }
          );

          if (featureImageUrls.length > 0) {
            content += `<div class="feature-images" data-images='${JSON.stringify(
              featureImageUrls
            )}' style="display: none;"></div>`;
          }

          content += `</div></div>`;
        } else {
          // Always show this section when no images
          content += `
        <div style="padding-top: 15px;">
          <strong>Images:</strong><br>
          <div style="font-style: italic; color: #666; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
            No images available for this arvs.
          </div>
        </div>
      `;
        }

        content += `</div><hr>`;
      });

      content += "</div>";
      return content;
    }
    // Existing popup content generation for other layers
    if (layer.toLowerCase() !== "hydrants and bovs") {
      const layerPropertyFilters = {
        "hydrants and bovs": [
          "description",
          "size",
          "fh_bov",
          "remarks",
          "area",
          "fid",
          "images",
        ],
        concessionaires: [
          "gid",
          "id",
          "standpipe",
          "book",
          "sp_id",
          "account_2",
          "name",
          "status",
        ],
        default: null,
      };

      let content = `
        <div style="max-height: 300px; overflow-y: auto; padding: 0px; font-size: 10px;">
          <hr>
          <h3 style="padding: 10px 0; font-size: 14px;"><b>${layer.toUpperCase()} [${
        features.length
      }]</b></h3>
          <hr>
      `;

      const featuresToDisplay =
        layer.toLowerCase() === "standpipe" ? [features[0]] : features;

      featuresToDisplay.forEach((feature, index) => {
        const propertyFilter =
          layerPropertyFilters[layer.toLowerCase()] ||
          layerPropertyFilters.default;

        content += `
          <div style="padding-top: 15px;">
            <strong style="font-size: 13px;">Feature ${index + 1}:</strong>
            <div style="padding-bottom: 15px; font-size: 12px;">
        `;

        if (propertyFilter) {
          propertyFilter.forEach((prop) => {
            if (feature.properties.hasOwnProperty(prop)) {
              if (prop === "images") {
                if (feature.properties[prop]) {
                  content += `
                    <div style="padding-top: 5px;">
                      <strong>Images:</strong>
                      <div class="image-gallery" style="display: flex; flex-wrap: wrap; ">
                        ${feature.properties[prop]}
                      </div>
                    </div>
                  `;
                }
              } else {
                content += `${prop}: ${feature.properties[prop]}<br>`;
              }
            }
          });
        } else {
          for (const key in feature.properties) {
            content += `${key}: ${feature.properties[key]}<br>`;
          }
        }

        content += `
            </div>
            <hr>
          </div>
        `;
      });

      content += "</div>";
      return content;
    }

    // Existing hydrants and BOVs popup content generation
    let popupContent = `
      <div style="max-height: 400px; overflow-y: auto; padding: 0px; font-size: 10px;">
        <hr>
        <h3 style="padding: 10px 0; font-size: 14px;">
          <b>HYDRANTS AND BOVs [${features.length}]</b>
        </h3>
        <hr>
    `;

    features.forEach((feature, index) => {
      popupContent += `
        <div style="padding-top: 15px;">
          <strong style="font-size: 13px;">Feature ${index + 1}:</strong>
          <div style="padding-bottom: 15px; font-size: 12px;">
      `;

      const excludedProps = ["lat", "lon", "path", "relpath", "images", "date"];
      for (const propKey in feature.properties) {
        if (
          feature.properties.hasOwnProperty(propKey) &&
          !excludedProps.includes(propKey)
        ) {
          popupContent += `${propKey}: ${feature.properties[propKey]}<br>`;
        }
      }

      if (feature.properties.hasOwnProperty("images")) {
        const imageHTML = feature.properties.images;
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = imageHTML;
        const imgElement = tempDiv.querySelector("img");

        if (imgElement) {
          let imgSrc = imgElement.getAttribute("src");

          if (imgSrc.startsWith("./")) {
            imgSrc = imgSrc.replace(/^\.\//, "");
            const fullImageUrl = `http://5.16.255.254:4000/static/FH%20%26%20BOVs%20Photos/2024%20Hydrants%20and%20BOVs%20photos/${encodeURIComponent(
              imgSrc
            )}`;
            const date = feature.properties.date
              ? new Date(feature.properties.date).toLocaleDateString()
              : "Date not available";

            popupContent += `
              <div style="padding-top: 25px;">
                <strong>Image:</strong><br>
                <div class="image-container" style="width: 250px; height: 250px; display: flex; justify-content: center; align-itemsalign-items: center; border: 1px solid #ddd;">
                  <a href='javascript:void(0);' class='imageLink' data-src='${fullImageUrl}' data-date='${date}'>
                    <img 
                      src='${fullImageUrl}' 
                      alt='${date}' 
                      style='max-width: 100%; max-height: 100%; object-fit: contain;'
                      onerror='this.onerror=null; this.style.display="none";'
                    >
                  </a>
                </div>
              </div>
            `;
          }
        } else {
          popupContent += "<p style='font-size: 12px;'>No image available</p>";
        }
      }

      popupContent += `
          </div>
          <hr>
        </div>
      `;
    });

    popupContent += "</div>";
    return popupContent;
  };

  const setupModalHandlers = () => {
    // Single image link handler (for hydrants and BOVs)
    document.querySelectorAll(".imageLink").forEach((link) => {
      link.removeEventListener("click", handleSingleImageClick);
      link.addEventListener("click", handleSingleImageClick);
    });

    // Land Rights image gallery handler
    document.querySelectorAll(".landRightImageLink").forEach((link) => {
      link.removeEventListener("click", handleImageClick);
      link.addEventListener("click", handleImageClick);
    });

    // Pumping Stations image gallery handler
    document.querySelectorAll(".pumpingStationImageLink").forEach((link) => {
      link.removeEventListener("click", handleImageClick);
      link.addEventListener("click", handleImageClick);
    });

    // Service Line image gallery handler
    document.querySelectorAll(".serviceLineImageLink").forEach((link) => {
      link.removeEventListener("click", handleImageClick);
      link.addEventListener("click", handleImageClick);
    });

    document.querySelectorAll(".arvImageLink").forEach((link) => {
      link.removeEventListener("click", handleImageClick);
      link.addEventListener("click", handleImageClick);
    });

    console.log("Event handlers set up for image links");
  };

  const handleCloseImageViewer = () => {
    setShowImageViewer(false);
    setViewerImages([]);
  };

  const renderImages = (images) => {
    return images.map((imageUrl, index) => (
      <a
        key={index}
        className="landRightImageLink"
        href="#"
        onClick={handleImageClick}
        data-src={imageUrl}
      >
        <img src={imageUrl} alt={`Land Right ${index + 1}`} />
      </a>
    ));
  };

  // Use event delegation for dynamically created elements
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Handle image clicks via delegation
      if (
        e.target.closest(".landRightImageLink") ||
        e.target.closest(".pumpingStationImageLink") ||
        e.target.closest(".serviceLineImageLink") ||
        e.target.closest(".arvImageLink")
      ) {
        e.preventDefault();
        const link =
          e.target.closest(".landRightImageLink") ||
          e.target.closest(".pumpingStationImageLink") ||
          e.target.closest(".serviceLineImageLink") ||
          e.target.closest(".arvImageLink")
        handleImageClick({ currentTarget: link, preventDefault: () => {} });
      }

      // Handle regular image link clicks via delegation
      if (e.target.closest(".imageLink")) {
        e.preventDefault();
        const link = e.target.closest(".imageLink");
        handleSingleImageClick({
          currentTarget: link,
          preventDefault: () => {},
        });
      }
    };

    // Add global click handler
    document.addEventListener("click", handleGlobalClick);

    // Cleanup
    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  return (
    <>
      {/* {modalState.isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        >
          <button
            onClick={() =>
              setModalState((prev) => ({ ...prev, isOpen: false }))
            }
            className="fixed top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 z-[9999]"
          >
            &times;
          </button>

          <div
            className="relative max-w-7xl mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={modalState.imageUrl}
              alt={modalState.caption}
              className="max-h-[80vh] w-auto object-contain mx-auto"
            />
            <div className="text-center text-white mt-4 px-4 text-lg font-medium">
              {`Date Captured: ${modalState.caption}`}
            </div>
          </div>
        </div>
      )} */}

      {showImageViewer && viewerImages.length > 0 && (
        <div className="fixed inset-0 z-[9999]">
          <CustomImageViewer
            images={viewerImages}
            onClose={handleCloseImageViewer}
          />
        </div>
      )}

      {feature &&
        feature.properties.landRightImages &&
        renderImages(feature.properties.landRightImages)}
    </>
  );
};

export default MapWithFeatureInfo;
