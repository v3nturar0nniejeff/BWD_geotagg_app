import React, {
  forwardRef,
  useCallback,
  useRef,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FaXmark, FaTableList } from "react-icons/fa6";
import LayerLegend from "./LayerLegend";
import axios from "axios";
import AttributeTableModal from "./AttributeTableModal";
import AttributeTable from "./AttributeTable";

// Utility function to format date
const formatDate = (dateString) => {
  if (!dateString) return "Date not available";
  const date = new Date(dateString);
  // Check if date is valid
  if (isNaN(date.getTime())) return "Invalid date";

  // Format as D/M/YYYY
  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are 0-based
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

const ImageModal = ({ isOpen, onClose, imageUrl, caption }) => {
  if (!isOpen) return null;

  const formattedDate = formatDate(caption);

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 p-4"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="fixed top-4 right-4 text-white text-4xl font-bold hover:text-gray-300"
        style={{ zIndex: 100000 }}
      >
        &times;
      </button>

      <div
        className="relative max-w-7xl mx-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 100000 }}
      >
        <img
          src={imageUrl}
          alt={caption}
          className="max-h-[80vh] w-auto object-contain mx-auto"
          style={{
            maxHeight: "80vh",
            width: "auto",
            objectFit: "contain",
          }}
        />
        <div className="text-center text-white mt-4 px-4 text-lg font-medium">
          {`Date Captured: ${formattedDate}`}
        </div>
      </div>
    </div>,
    document.body
  );
};

const DraggableLayer = forwardRef(
  (
    {
      layer,
      draggableProps,
      dragHandleProps,
      snapshot,
      onRemoveLayer,
      onToggleVisibility,
      onOpacityChange,
      mapInstance,
    },
    ref
  ) => {
    const mapRef = useRef(mapInstance);
    const [photosVisible, setPhotosVisible] = useState(false);
    const [modalState, setModalState] = useState({
      isOpen: false,
      imageUrl: "",
      caption: "",
    });
    const [isOpenAtrTable, setIsOpenAtrTable] = useState(false);
    const [atrTableLayerName, setAtrTableLayerName] = useState(null);
    const [isTableOpen, setIsTableOpen] = useState(false);

    useEffect(() => {
      mapRef.current = mapInstance;
    }, [mapInstance]);

    const openAttributeTable = (layerName) => {
      setIsTableOpen(true);
      setAtrTableLayerName(layerName);
      console.log("Opening attribute table for layer:", layerName);
    };

    const handleRemove = (e) => {
      e.stopPropagation();
      e.preventDefault();

      try {
        onToggleVisibility(layer.id, false);
        setTimeout(() => {
          onRemoveLayer(layer.id);
        }, 50);
      } catch (error) {
        console.error("Error removing layer:", error);
      }
    };

    const handleVisibilityToggle = (e) => {
      try {
        onToggleVisibility(layer.id, e.target.checked);
      } catch (error) {
        console.error("Error toggling layer visibility:", error);
      }
    };

    const handleOpacityChange = (e) => {
      try {
        const newOpacity = parseInt(e.target.value, 10);
        onOpacityChange(layer.id, newOpacity);
      } catch (error) {
        console.error("Error changing layer opacity:", error);
      }
    };

    const handleViewPhotos = useCallback(() => {
      if (!mapRef.current) {
        console.error("Map instance is not available.");
        return;
      }

      const photoLayerName =
        layer.name.toLowerCase() === "pipeline"
          ? "2030 Pipeline photos"
          : `${layer.name} photos`;

      try {
        if (!photosVisible) {
          const newZIndex = 500 + 10;
          mapRef.current.handleWMSRequest(photoLayerName, true, newZIndex);
          mapRef.current.on("click", handlePhotoClick);
          setPhotosVisible(true);
        } else {
          mapRef.current.handleWMSRequest(photoLayerName, false);
          mapRef.current.off("click", handlePhotoClick);
          setPhotosVisible(false);
        }
      } catch (error) {
        console.error("Error handling photo layer:", error);
      }
    }, [layer, photosVisible]);

    const handlePhotoClick = useCallback(
      async (e) => {
        if (!mapRef.current) return;

        const url = "http://5.16.255.254:8080/geoserver/wms";
        const latlng = e.latlng;

        const x = Math.round(mapRef.current.latLngToContainerPoint(latlng).x);
        const y = Math.round(mapRef.current.latLngToContainerPoint(latlng).y);

        const photoLayerName =
          layer.name.toLowerCase() === "pipeline"
            ? "2030 Pipeline photos"
            : `${layer.name} photos`;

        const params = {
          request: "GetFeatureInfo",
          service: "WMS",
          srs: "EPSG:4326",
          transparent: true,
          version: "1.1.1",
          format: "image/png",
          info_format: "application/json",
          bbox: mapRef.current.getBounds().toBBoxString(),
          height: mapRef.current.getSize().y,
          width: mapRef.current.getSize().x,
          layers: `bwdgis:${photoLayerName}`,
          query_layers: `bwdgis:${photoLayerName}`,
          feature_count: 20,
          x: x,
          y: y,
        };

        try {
          const response = await axios.get(url, { params });
          const features = response.data.features;

          if (!features || features.length === 0) {
            console.log("No photo features found for the clicked location.");
            return;
          }

          let popupContent = generatePhotoPopupContent(
            photoLayerName,
            features
          );

          const popup = L.popup()
            .setLatLng(latlng)
            .setContent(popupContent)
            .openOn(mapRef.current);

          // Setup image click handlers after popup is created
          setupImageClickHandlers();
        } catch (error) {
          console.error("Error fetching photo feature info:", error);
        }
      },
      [layer]
    );

    const generatePhotoPopupContent = (layerName, features) => {
      let content = `<div style="max-height: 400px; overflow-y: auto; padding: 0px; font-size: 10px;">
        <hr>
        <h3 style="padding: 10px 0; font-size: 14px;">
          <b>Pipeline Photos [${features.length}]</b>
        </h3>
        <hr>`;
      features.forEach((feature, index) => {
        content += `<div style="padding-top: 15px ; width: 400px;">
          <strong style="font-size: 13px;">Image ${index + 1}:</strong>
          <div style="padding-bottom: 15px; font-size: 12px;">`;

        if (feature.properties?.date) {
          const formattedDate = formatDate(feature.properties.date);
          content += `<div><strong>Captured on:</strong> ${formattedDate}</div>`;
        }

        if (feature.properties?.images) {
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = feature.properties.images;
          const imgElement = tempDiv.querySelector("img");

          if (imgElement) {
            let imgSrc = imgElement.getAttribute("src");
            if (imgSrc.startsWith("./")) {
              imgSrc = imgSrc.replace(/^\.\//, "");
              const fullImageUrl = `http://5.16.255.254:4000/static/Pipeline%20photos/2030%20Pipeline%20photos/${encodeURIComponent(
                imgSrc
              )}`;
              content += `<div style="padding-top: 40px;">
                <div class="image-container" style="width: 250px; height: 250px; display: flex; justify-content: center; align-items: center; border: 1px solid #ddd;">
                  <a href="javascript:void(0);" class="imageLink" data-src="${fullImageUrl}" data-date="${
                feature.properties.date || "Date not available"
              }">
                    <img src="${fullImageUrl}" alt="Photo" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.onerror=null; this.style.display='none'; console.log('Image failed to load: ${fullImageUrl}')">
                  </a>
                </div>
              </div>`;
            } else {
              content += `<div style="padding-top: 40px;">
                <div class="image-container" style="width: 250px; height: 250px; display: flex; justify-content: center; align-items: center; border: 1px solid #ddd;">
                  <a href="javascript:void(0);" class="imageLink" data-src="${imgSrc}" data-date="${
                feature.properties.date || "Date not available"
              }">
                    <img src="${imgSrc}" alt="Photo" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.onerror=null; this.style.display='none'; console.log('Image failed to load: ${imgSrc}')">
                  </a>
                </div>
              </div>`;
            }
          } else {
            content += "<p style='font-size: 12px;'>No image available</p>";
          }
        }

        content += `</div><hr style="margin-top: 40px;"></div>`;
      });
      content += `</div>`;
      return content;
    };

    const setupImageClickHandlers = () => {
      document.querySelectorAll(".imageLink").forEach((link) => {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          setModalState({
            isOpen: true,
            imageUrl: link.dataset.src || link.querySelector("img").src,
            caption: link.dataset.date || "Date not available",
          });
        });
      });
    };

    useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          setModalState((prev) => ({ ...prev, isOpen: false }));
        }
      };

      if (modalState.isOpen) {
        document.addEventListener("keydown", handleEscape);
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }, [modalState.isOpen]);

    const handleCloseModal = () => {
      setModalState((prev) => ({ ...prev, isOpen: false }));
    };

    return (
      <>
        <li
          className="border border-gray-500 p-2 rounded hover:border-white hover:bg-[#D3D3D3]/25"
          ref={ref}
          {...draggableProps}
          {...dragHandleProps}
          style={{
            margin: "0 0 4px 0",
            transition:
              "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
            boxShadow: snapshot.isDragging
              ? "0 8px 16px rgba(0, 0, 0, 0.2)"
              : "0 2px 4px rgba(0, 0, 0, 0.1)",
            transform: snapshot.isDragging ? "scale(1.05)" : "scale(1)",
            backgroundColor: snapshot.isDragging
              ? "rgba(255, 255, 255, 0.4)"
              : "transparent",
            borderColor: snapshot.isDragging
              ? "rgb(255, 255, 255)"
              : "rgb(107 114 128)",
            ...draggableProps.style,
          }}
          data-layer-id={layer.id}
          data-layer-name={layer.name}
        >
          {/* Controls row */}
          <div className="flex flex-row items-center">
            <div
              className="flex justify-center border border-white p-0.5 cursor-pointer hover:bg-red-500 hover:border-red-500"
              title="Remove"
              onClick={handleRemove}
              role="button"
              aria-label={`Remove ${layer.name} layer`}
            >
              <i className="text-white text-xs">
                <FaXmark />
              </i>
            </div>
            <div className="ms-4 me-4" title="Show/Hide">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={handleVisibilityToggle}
                  aria-label={`Toggle visibility of ${layer.name} layer`}
                />
              </label>
            </div>
            <div className="flex justify-center mr-3">
              <span className="text-md text-white">
                {layer.name
                  .replace(/[^a-zA-Z\s_]/g, "")
                  .split("_")
                  .map(
                    (word) =>
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  )
                  .join(" ")
                  .trim()}
              </span>
            </div>
            <div className="flex justify-center ml-auto">
              <input
                type="range"
                className="w-10"
                value={layer.opacity}
                min="0"
                max="100"
                onChange={handleOpacityChange}
                aria-label={`Adjust opacity of ${layer.name} layer`}
              />
            </div>
          </div>

          {/* Legend row */}
          <div className="flex flex-row mx-[0px] mt-2">
            <AttributeTable atrTableLayerName={layer.name} map={mapInstance} />
            <div className="grow flex flex-col ml-[45px]">
              <div
                className="flex items-center justify-start gap-2"
                style={{ width: "auto", height: "auto" }}
              >
                <LayerLegend layerName={layer.name} />
              </div>
            </div>
            <div className="pr-[0px] flex items-start mr-[5px]">
              {layer.hasPhotos && layer.name !== "hydrants and bovs" && (
                <button
                  className="text-xs border border-white p-0.5 text-white whitespace-nowrap bg-[#D3D3D3]/25 hover:bg-[#FFFFFF]/75 hover:text-black"
                  aria-label={`View photos for ${layer.name} layer`}
                  onClick={handleViewPhotos}
                >
                  {photosVisible ? "View Pipeline" : "View Photos"}
                </button>
              )}
            </div>
          </div>
        </li>
        {/* Modal Component */}
        <ImageModal
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          imageUrl={modalState.imageUrl}
          caption={modalState.caption}
        />
      </>
    );
  }
);

export default DraggableLayer;
