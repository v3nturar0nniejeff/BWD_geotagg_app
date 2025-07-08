import React, { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../auth/AuthContext";

const Coordinates = () => {
  const map = useMap(); // Get the map instance
  const [coords, setCoords] = useState({});
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!map) return;

    const mouseMoveHandler = (e) => {
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    };

    map.addEventListener("mousemove", mouseMoveHandler); // Add mouse move event listener

    // Cleanup function to remove the event listener
    return () => {
      map.removeEventListener("mousemove", mouseMoveHandler);
    };
  }, [map]);

  const { lat, lng } = coords;

  if (!isAuthenticated) return null;
  return (
    <div className="coordinates-control leaflet-control absolute rounded-sm bottom-5 right-2 bg-[#3C3C3C] text-white z-1000 shadow-lg text-xs p-2 opacity-90">
      <div>
        {lat && (
          <div>
            <b>Lat</b>: {lat?.toFixed(5)}
            <b>, Long</b>: {lng?.toFixed(5)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Coordinates;
