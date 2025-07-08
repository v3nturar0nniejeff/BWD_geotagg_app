import React, { useEffect, useState } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { getUserLayers } from "../api/layers";
import { useAuth } from "../auth/AuthContext";
import { FaFilter } from "react-icons/fa";
import {
  getGeoServerFeatures,
  getSingleGeoServerFeature,
  getFeatureBySearch,
  getFeatureForPredictiveText,
} from "../api/geoserverClient";

// **** CREATE LIST OF COLUMNS TO NOT PROPAGATE IF THE LAYER FROM DROPDOWN IS SELECTED ****

const SearchByLayer = () => {
  const [searchBy, setSearchBy] = useState("name");
  const [userLayers, setUserLayers] = useState([]);
  const { isAuthenticated } = useAuth();
  const [placeholder, setPlaceholder] = useState("Search...");
  const [inputQuery, setInputQuery] = useState("");
  const [geoData, setGeoData] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState([]);
  const [searchByColumn, setSearchByColumn] = useState("");
  const [searchedResults, setSearchedResults] = useState([]);

  useEffect(() => {
    const fetchUserLayers = async () => {
      try {
        const response = await getUserLayers();
        const lay = response.layers;

        console.log("User layers:", lay);

        if (lay.length > 0) {
          const firstLayer = lay[0].layer.layer_name;
          setSelectedLayer(firstLayer);
          console.log("First Layer:", firstLayer);
          setSearchBy(firstLayer);
          setUserLayers(lay);
          setPlaceholder("Search " + formatWord(firstLayer));

          getSingleGeoServerFeature(`bwdgis:${firstLayer}`).then((response) => {
            setGeoData(response.data);

            // Extract column names from first feature
            if (response.data.features.length > 0) {
              const firstFeature = response.data.features[0].properties;
              console.log("First Feature:", firstFeature);
              setColumns(Object.keys(firstFeature)); // Get property names
              setSelectedColumn(Object.keys(firstFeature)[0]);
              // console.log("columns:", columns);
              // console.log("Selected column:", selectedColumn);
            }
          });
        }
      } catch (error) {
        console.error("Error fetching user layers:", error);
      }
    };
    if (isAuthenticated) {
      fetchUserLayers();
    }
  }, [isAuthenticated]);

  // Debounce function
  const debounce = (func, delay) => {
    console.log("Debounce function called");
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

  const searchInput = async (query) => {
    if (query.length < 3) {
      setSearchedResults([]);
      return;
    }
    console.log("Search Input Called");
    //Here it should call to the geoserverclient to get the data the request
    try {
      const layerName = `${selectedLayer}`;
      const cqlFilter = `${selectedColumn} ILIKE '%${query}%'`;
      const response = await getFeatureForPredictiveText(
        layerName,
        cqlFilter,
        10
      );

      console.log("Response from search:", response);

      // Extract features from the GeoJSON response
      if (
        response.data &&
        response.data.features &&
        Array.isArray(response.data.features)
      ) {
        // Extract just the properties from each feature
        const results = response.data.features.map(
          (feature) => feature.properties
        );
        setSearchedResults(results);
        console.log("Search results HEREEEEE!!!!!!!!!!!:", searchedResults);
      } else {
        setSearchedResults([]);
      }
    } catch (error) {
      console.error("Error searching names:", error);
      setSearchedResults([]);
    }
  };

  const debouncedSearchInput = debounce(searchInput, 300);

  useEffect(() => {
    const fetchUserLayers = async () => {
      try {
        const response = await getUserLayers();
        const lay = response.layers;

        console.log("User layers:", lay);

        if (lay.length > 0) {
          const firstLayer = lay[0].layer.layer_name;
          setSelectedLayer(firstLayer);
          console.log("First Layer:", firstLayer);
          setSearchBy(firstLayer);
          setUserLayers(lay);
          setPlaceholder("Search " + formatWord(firstLayer));

          getSingleGeoServerFeature(`bwdgis:${firstLayer}`).then((response) => {
            setGeoData(response.data);

            // Extract column names from first feature
            if (response.data.features.length > 0) {
              const firstFeature = response.data.features[0].properties;
              console.log("First Feature:", firstFeature);
              setColumns(Object.keys(firstFeature)); // Get property names
              setSelectedColumn(Object.keys(firstFeature)[0]);
              // console.log("columns:", columns);
              // console.log("Selected column:", selectedColumn);
            }
          });
        }
      } catch (error) {
        console.error("Error fetching user layers:", error);
      }
    };
    if (isAuthenticated) {
      fetchUserLayers();
    }
  }, [isAuthenticated]);

  // Use a separate useEffect to track state updates
  useEffect(() => {
    console.log("Updated columns:", columns);
  }, [columns]);

  useEffect(() => {
    console.log("Updated selected column:", selectedColumn);
  }, [selectedColumn]);

  useEffect(() => {
    console.log("Updated selected layer:", selectedLayer);
  }, [selectedLayer]);

  const handleDropdownChange = (e) => {
    const selectedValue = e.target.value;
    console.log("Selected value HEREEEE:", selectedValue);
    setSelectedLayer(selectedValue);
    setSearchBy(selectedValue);
    console.log("Selected value:", selectedValue);
    const formatSelectedValue = formatWord(selectedValue);
    setPlaceholder("Search " + formatSelectedValue);
  };

  const handleDropdownChangeColumn = (e) => {
    const selectedColumn = e.target.value;
    setSearchByColumn(selectedColumn);
    setSelectedColumn(selectedColumn);
  };

  //request to geoserver
  useEffect(() => {
    if (selectedLayer) {
      getSingleGeoServerFeature(`bwdgis:${selectedLayer}`)
        .then((response) => {
          setGeoData(response.data);

          // Extract column names from first feature
          if (response.data.features.length > 0) {
            const firstFeature = response.data.features[0].properties;

            setColumns(Object.keys(firstFeature)); // Get property names
          }
        })
        .catch((error) =>
          console.error("Error fetching GeoServer data:", error)
        );
    }
  }, [selectedLayer]);

  const handleSearch = async (query) => {
    console.log("Params::", selectedLayer, selectedColumn, query);
    const result = await getFeatureBySearch(
      selectedLayer,
      selectedColumn,
      query
    );
    console.log("Result of Search:", result);
  };

  const handleNameInput = (e) => {
    const query = e.target.value;
    setInputQuery(query);
    if (query.trim().length >= 3) {
      debouncedSearchInput(query);
    } else {
      setSearchedResults([]);
    }
  };

  //   function to format the word to remove special characters and capitalize first letter
  const formatWord = (word) => {
    return word
      .replace(/[^\w\s]|[0-9_]/g, "") // Remove special characters, numbers, and underscores
      .replace(/\s+/g, " ") // Replace multiple spaces with a single space
      .trim() // Remove leading and trailing spaces
      .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize first letter
  };

  return (
    <div className="absolute search-controls h-[500px] w-[350px] z-[999] top-14 right-3 text-white flex flex-col">
      <div className="p-2 border-gray-600 mb-1 relative">
        <div className="flex flex-col space-y-2 bg-white rounded-lg p-2 border border-gray-600 h-full">
          <div className="flex items-center space-x-2 mb-0.8">
            <FaFilter className="text-gray-600 text-[18px] mt-1" />
            <select
              value={searchBy}
              onChange={handleDropdownChange}
              className="p-1 h-8 border rounded-lg border-gray-600 text-black text-xs bg-white"
            >
              {userLayers.map((layer) => {
                // Format for display only to Dropdown
                const formattedName = layer.layer.layer_name
                  .replace(/[^\w\s]|[0-9_]/g, "") // Remove special characters, numbers, and underscores
                  .replace(/\s+/g, " ") // Replace multiple spaces with a single space
                  .trim() // Remove leading and trailing spaces
                  .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize first letter

                return (
                  <option
                    key={layer.id}
                    value={layer.layer.layer_name}
                    className="text-sm"
                  >
                    {formattedName}
                  </option>
                );
              })}
            </select>
            <select
              value={searchByColumn}
              onChange={handleDropdownChangeColumn}
              className="p-1 h-8 border rounded-lg border-gray-600 text-black text-xs bg-white"
            >
              {columns.map((col, index) => (
                <option key={index} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
          <div className="flex space-x-2">
            <FaMagnifyingGlass className="text-gray-600 text-[18px] mt-1" />
            <input
              type="text"
              className="placeholder:text-sm px-3 py-2 h-8 rounded-md border border-gray-600 w-full bg-white text-[16px] text-black focus:outline-none"
              placeholder={placeholder}
              autoComplete="off"
              value={inputQuery}
              onChange={handleNameInput}
              onKeyPress={(e) => {
                if (e.key === "Enter" && inputQuery.trim()) {
                  handleSearch(inputQuery);
                }
              }}
            />
          </div>
        </div>
        {searchedResults.length > 0 && (
          <ul className="absolute mt-2 bg-[#1E2124] border border-gray-600 rounded-md max-h-60 overflow-y-auto w-full z-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-500">
            {searchedResults.map((result, index) => (
              <li
                key={index}
                className="px-3 py-2 hover:bg-gray-600 cursor-pointer"
                // onClick={() => handleNameSelect(result)}
              >
                {/* {result[selectedColumn]} */}
                {result[selectedColumn] ? result[selectedColumn] : "N/A"}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-2 relative">
        <input
          type="text"
          className="px-3 py-2 h-10 rounded-md border border-gray-600 w-full bg-white text-[16px] text-black focus:outline-none"
          placeholder="Search for a location"
          //   value={locationQuery}
          //   onChange={handleLocationInput}
        />
        {/* {locationResults.length > 0 && (
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
        )} */}
      </div>
    </div>
  );
};

export default SearchByLayer;
