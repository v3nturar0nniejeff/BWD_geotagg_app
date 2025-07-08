import React, { useState } from "react";
import axios from "axios";
import L from "leaflet";
import { useAuth } from "../auth/AuthContext";
import sendActivityLog from "../api/activityLogger";
import { ACTIVITY_TYPES } from "../constants/activityTypes";
import bluePin from "../assets/images/marker-icon-blue.png";
import Swal from "sweetalert2";

// Create standpipe icon configuration outside component
const standpipeIcon = new L.Icon({
  iconUrl: bluePin,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  errorIconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
});

const SearchConcessionaire = ({ map }) => {
  const [locationQuery, setLocationQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [nameResults, setNameResults] = useState([]);
  const [selectedName, setSelectedName] = useState("");
  const [selectedArea, setSelectedArea] = useState(null);
  const [standpipeMarkers, setStandpipeMarkers] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [currentLocationMarker, setCurrentLocationMarker] = useState(null);

  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  // Create popup content
  const createPopupContent = (content) => {
    return `
      <div class="custom-popup">
        ${content}
      </div>
    `;
  };

  // Enhanced popup management
  const closeAllPopups = () => {
    if (activePopup) {
      map.closePopup(activePopup);
      setActivePopup(null);
    }
  };

  const openPopup = (popup) => {
    closeAllPopups();
    setActivePopup(popup);
  };

  // Geojson style
  const geojsonStyle = {
    fillColor: "#e9d700",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
  };

  // Debounce function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Helper function to create standpipe marker
  const createStandpipeMarker = (latlng) => {
    return L.marker(latlng, {
      icon: standpipeIcon,
      iconFallback: true,
    });
  };

  // Reference details fetching
  const getReferenceDetails = async (searchQuery) => {
    try {
      const csrftoken = document.querySelector(
        "[name=csrfmiddlewaretoken]"
      )?.value;

      const response = await axios.post(
        "http://5.16.255.254:4000/api/get-reference-id/",
        { search_query: searchQuery },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching reference details:", error);
      return null;
    }
  };

  // Concessionaire details fetching
  const fetchConcessionaireDetails = async (referenceId) => {
    try {
      const response = await axios.get(
        "http://5.16.255.254:8080/geoserver/wfs",
        {
          params: {
            service: "WFS",
            version: "1.1.0",
            request: "GetFeature",
            typename: "bwdgis:concessionaire",
            CQL_FILTER: `id='${referenceId}'`,
            srsname: "EPSG:4326",
            outputFormat: "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Fetch Error:", error);
      throw error;
    }
  };

  const handleSearch = async (searchQuery) => {
    // Clear previous selections
    if (selectedArea) {
      map.removeLayer(selectedArea);
    }

    standpipeMarkers.forEach((marker) => {
      if (marker.marker) {
        map.removeLayer(marker.marker);
      }
    });
    setStandpipeMarkers([]);
    closeAllPopups();

    try {
      const referenceData = await getReferenceDetails(searchQuery);

      if (!referenceData) {
        alert("Concessionaire not found!");
        return;
      }

      const referenceId = referenceData.reference_id;
      const accountStatus =
        referenceData.status === "A" ? "active" : "inactive";

      const concessionaireData = await fetchConcessionaireDetails(referenceId);

      const newSelectedArea = L.geoJson(concessionaireData, {
        onEachFeature: async (feature, layer) => {
          layer.on("click", () => {
            if (map.hasLayer(newSelectedArea)) {
              map.removeLayer(newSelectedArea);
              setSelectedArea(null);

              standpipeMarkers.forEach((marker) => {
                if (marker.marker) {
                  map.removeLayer(marker.marker);
                }
              });
              setStandpipeMarkers([]);
            }
          });

          const accountNumber =
            feature.properties.account_2 || feature.properties.account;
          const standpipe = feature.properties.sp_id;

          const popupContent = createPopupContent(`
            <div style="font-size: 16px;">
              <h1><strong>Account: ${accountNumber}</strong> (${accountStatus})</h1>
            </div>
          `);

          await sendActivityLog(
            ACTIVITY_TYPES.SEARCH_CONCESSIONAIRE,
            `Searched for ${accountNumber}`
          );

          const popup = L.popup({
            closeButton: true,
            autoClose: true,
            closeOnClick: true,
          }).setContent(popupContent);

          layer.on("mouseover", () => {
            openPopup(popup);
            layer.bindPopup(popup).openPopup();
          });

          popup.on("remove", () => {
            if (activePopup === popup) {
              setActivePopup(null);
            }
          });

          if (standpipe) {
            try {
              const newMarkers = await fetchStandpipeData(standpipe);
              setStandpipeMarkers(newMarkers);
            } catch (error) {
              console.error("Error handling standpipe markers:", error);
            }
          }
        },
        style: geojsonStyle,
      }).addTo(map);

      map.fitBounds(newSelectedArea.getBounds());
      setSelectedArea(newSelectedArea);
    } catch (error) {
      console.error("Search error:", error);
      // alert(`Search failed: ${error.message}`);
      showAlert(searchQuery);
    }
  };

  const fetchStandpipeData = async (standpipe) => {
    try {
      const response = await axios.get(
        "http://5.16.255.254:8080/geoserver/wfs",
        {
          params: {
            service: "WFS",
            version: "1.1.0",
            request: "GetFeature",
            typename: "bwdgis:meter",
            CQL_FILTER: `standpipe_id='${standpipe}'`,
            srsname: "EPSG:4326",
            outputFormat: "application/json",
          },
        }
      );

      if (!response.data.features || response.data.features.length === 0) {
        return [];
      }

      const markers = response.data.features.map((feature) => {
        const coordinates = feature.geometry.coordinates;
        const lat = coordinates[1];
        const lng = coordinates[0];

        const standpipeMarker = createStandpipeMarker([lat, lng]);

        standpipeMarker.on("click", () => {
          if (map.hasLayer(standpipeMarker)) {
            map.removeLayer(standpipeMarker);
            setStandpipeMarkers((prev) =>
              prev.filter((m) => m.marker !== standpipeMarker)
            );
          }
        });

        const popupContent = createPopupContent(`
          <div style="font-size: 16px;">
            <h2 style="font-weight: bold; margin-bottom: 5px;">Meter Accounts on Standpipe:</h2>
            <h2><strong></strong> ${feature.properties.custcode || "N/A"}</h2>
          </div>
        `);

        const popup = L.popup({
          closeButton: true,
          autoClose: true,
          closeOnClick: true,
        }).setContent(popupContent);

        standpipeMarker.on("mouseover", () => {
          openPopup(popup);
          standpipeMarker.bindPopup(popup).openPopup();
        });

        popup.on("remove", () => {
          if (activePopup === popup) {
            setActivePopup(null);
          }
        });

        standpipeMarker.addTo(map);
        return {
          marker: standpipeMarker,
          popup: popup,
        };
      });

      return markers;
    } catch (error) {
      console.error("Error fetching standpipe data:", error);
      return [];
    }
  };

  const handleNameSelect = (result) => {
    setSelectedName(result.name);
    setNameQuery(result.name);
    setNameResults([]);
    handleSearch(result.custcode || result.name);
  };

  const searchNames = async (query) => {
    if (query.length < 3) {
      setNameResults([]);
      return;
    }

    try {
      const response = await axios.get(
        `http://5.16.255.254:4000/api/search-names/?query=${query}`,
        {
          timeout: 5000,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      setNameResults(response.data.results || []);
    } catch (error) {
      console.error("Error searching names:", error);
      setNameResults([]);
    }
  };

  const handleNameInput = (e) => {
    const query = e.target.value;
    setNameQuery(query);
    if (query.trim().length >= 3) {
      debouncedSearchNames(query);
    } else {
      setNameResults([]);
    }
  };

  const searchLocations = async (query) => {
    if (query.length < 3) {
      setLocationResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=PH`
      );
      const data = await response.json();
      setLocationResults(data);
    } catch (error) {
      console.error("Error searching locations:", error);
      setLocationResults([]);
    }
  };

  const handleLocationInput = (e) => {
    const query = e.target.value;
    setLocationQuery(query);
    if (query.trim().length >= 3) {
      debouncedSearchLocations(query);
    } else {
      setLocationResults([]);
    }
  };

  const handleLocationSelect = async (place) => {
    setLocationQuery(place.display_name);
    setLocationResults([]);

    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);

    if (currentLocationMarker) {
      map.removeLayer(currentLocationMarker);
    }

    map.setView([lat, lon], 18);

    const marker = L.marker([lat, lon], {
      icon: standpipeIcon,
      iconFallback: true,
    });

    const popupContent = createPopupContent(`
      <div style="font-size: 14px;">
        <h3 style="font-weight: bold; margin-bottom: 5px;">${place.display_name}</h3>
      </div>
    `);

    const popup = L.popup({
      closeButton: true,
      autoClose: false,
      closeOnClick: false,
    }).setContent(popupContent);

    marker.bindPopup(popup).addTo(map).openPopup();

    marker.on("click", () => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
        setCurrentLocationMarker(null);
      }
    });

    setCurrentLocationMarker(marker);

    await sendActivityLog(
      ACTIVITY_TYPES.SEARCH_LOCATION,
      `Searched for ${place.display_name}`
    );
  };

  const debouncedSearchNames = debounce(searchNames, 300);
  const debouncedSearchLocations = debounce(searchLocations, 300);

  const showAlert = (accountNumber) => {
    Swal.fire({
      title: "Scheduled for Data Gathering",
      html: `
      <div>
        <div class="text-center">
          <p></p>
        </div>
        <div class="text-center mt-4">
        <account>Account Name/Number: ${accountNumber}</account>
        </div>
      </div>
      `,
      icon: "info",
      confirmButtonText: "OK",
      customClass: {
        popup: "bg-[#333333] text-white rounded-lg shadow-lg", // Tailwind classes for the pop-up
        title: "text-xl font-bold", // Tailwind classes for the title
        content: "text-sm", // Tailwind classes for the content
        confirmButton:
          "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600", // Tailwind classes for the button
      },
    });
  };

  // Return JSX
  return (
    <div className="relative">
      <div className="absolute search-controls h-[150px] w-[300px] z-[999] top-14 right-3 text-white flex flex-col">
        <div className="p-2 border-gray-600 relative">
          <input
            type="text"
            className="px-3 py-2 h-12 rounded-md border border-gray-600 w-full bg-white text-[14px] text-black focus:outline-none"
            placeholder="Quick Search Name or Account Number"
            autoComplete="off"
            value={nameQuery}
            onChange={handleNameInput}
            onKeyPress={(e) => {
              if (e.key === "Enter" && nameQuery.trim()) {
                handleSearch(nameQuery);
              }
            }}
          />
          {nameResults.length > 0 && (
            <ul className="absolute bg-[#1E2124] border border-gray-600 rounded-md max-h-60 overflow-y-auto w-full z-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-500">
              {nameResults.map((result, index) => (
                <li
                  key={index}
                  className="px-3 py-2 hover:bg-gray-600 cursor-pointer"
                  onClick={() => handleNameSelect(result)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{result.name}</span>
                    <div className="flex items-center text-sm text-gray-400 mt-1">
                      <span>Account Number:</span>
                      <span className="text-gray-300 ml-1">
                        {result.custcode}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-2 relative">
          <input
            type="text"
            className="px-3 py-2 h-12 rounded-md border border-gray-600 w-full bg-white text-[16px] text-black focus:outline-none"
            placeholder="Search for a location"
            value={locationQuery}
            onChange={handleLocationInput}
          />
          {locationResults.length > 0 && (
            <ul className="absolute mt-2 bg-[#1E2124] border border-gray-600 rounded-md max-h-60 overflow-y-auto w-full z-50">
              {locationResults.map((place, index) => (
                <li
                  key={index}
                  className="px-3 py-2 hover:bg-gray-600 cursor-pointer text-sm"
                  onClick={() => handleLocationSelect(place)}
                >
                  {place.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchConcessionaire;
