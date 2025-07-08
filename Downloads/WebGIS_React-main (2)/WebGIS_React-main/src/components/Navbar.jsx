import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/images/bwdlogo.png";
import LoginForm from "./LoginForm";
import { useAuth } from "../auth/AuthContext";
import { toast } from "react-toastify";
import MapPrint from "./MapPrint";
import { useCapture } from "../context/CaptureContext";
import adminLogo from "../assets/images/admin-panel.png";

import {
  FaUser,
  FaCamera,
  FaDrawPolygon,
  FaPrint,
  FaLayerGroup,
} from "react-icons/fa";
import { MdDashboard, MdLogout } from "react-icons/md";
import "@fontsource/roboto";
import DrawPolygon from "./DrawPolygon";

const Navbar = ({
  onSearch,
  onScreenshot,
  mapRef,
  useCaptureFeature,
  mapInstance,
  isSidebarCollapsed,
}) => {
  let isCapturing = null;
  if (useCaptureFeature) {
    try {
      const capture = useCapture();
      isCapturing = capture?.isCapturing ?? null; // Extract isCapturing safely
    } catch (error) {
      console.warn("useCapture must be used within a CaptureProvider");
    }
  }

  const { user, isAuthenticated, logout } = useAuth();

  if (isCapturing) return null;

  // console.log("Heyy im the user:", user.is_staff);

  const navigate = useNavigate();

  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState({});
  const dropdownRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");

  if (isCapturing) return null; // Component won't render during capture

  // Modal handlers
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value); // Passing the search value to the parent component
  };

  // Handle logout
  const handleLogout = (e) => {
    e.preventDefault();

    // Clear all WMS layers before logging out
    if (mapInstance?.wmsOperations?.cleanup) {
      mapInstance.wmsOperations.cleanup();
    }

    logout();
    navigate("/");

    openModal();
    toast.success("Successfully Logged Out!");
  };

  useEffect(() => {
    const showToast = localStorage.getItem("loginSuccess");
    if (showToast === "pending") {
      const timer = setTimeout(() => {
        toast.success("Logged in Successfully!");
        localStorage.removeItem("loginSuccess");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <nav className="bg-[#333333] shadow-lg fixed top-0 left-0 w-full z-[999]">
      <div className="flex justify-between items-center py-4 px-4">
        {/* Left Section - Logo and Title */}
        <div className="flex items-center w-1/3">
          <a className="flex items-center space-x-4" href="/">
            <img src={logo} className="h-6" alt="BWD Logo" loading="lazy" />
          </a>
          <ul className="flex space-x-4 ml-4">
            <li className="nav-item">
              <a className="text-white hover:text-gray-300" href="/">
                Baguio Water District GIS
              </a>
            </li>
          </ul>
        </div>

        {/* Center Section - Map Controls */}
        <div className="flex justify-center items-center w-1/3">
          {isAuthenticated && window.location.pathname === "/" && (
            <ul className="flex space-x-5">
              <li>
                <button
                  className="text-white hover:text-gray-300"
                  onClick={onScreenshot}
                  title="Click to take a screenshot."
                >
                  <FaCamera />
                </button>
              </li>
              <li>
                {mapInstance && (
                  <DrawPolygon
                    map={mapInstance}
                    isSidebarCollapsed={isSidebarCollapsed}
                  />
                )}
              </li>
              <li>
                <MapPrint mapRef={mapRef} />
              </li>
            </ul>
          )}
        </div>

        {/* Right Section - User Controls */}
        <div className="flex justify-end items-center w-1/3">
          <ul className="flex space-x-4 items-center">
            {isAuthenticated ? (
              <li className="flex items-center space-x-4">
                <div className="relative group">
                  <a
                    className="text-white hover:text-gray-300 flex items-center"
                    href="/dashboard"
                  >
                    <div className="text-white font-medium">
                      Hi, {user?.username || "User"}
                    </div>
                  </a>
                </div>
                {user?.is_staff && (
                  <>
                    <span className="inline-block mx-4 h-6 border-l border-gray-300"></span>
                    <div className="relative group">
                      <a
                        className="text-white hover:text-gray-300 flex items-center"
                        href="http://5.16.255.254:4000/admin"
                        target="_blank"
                      >
                        <img
                          src={adminLogo}
                          alt="Admin Dashboard"
                          className="w-6 h-6 brightness-0 invert"
                        />
                      </a>
                    </div>
                  </>
                )}
                <span className="inline-block mx-4 h-6 border-l border-gray-300"></span>
                <button
                  className="text-white hover:text-gray-300 flex items-center"
                  onClick={handleLogout}
                >
                  <span className="inline-block ml-2 text-xl">
                    <MdLogout />
                  </span>
                </button>
              </li>
            ) : (
              <li>
                <button
                  className="text-white hover:text-gray-300"
                  onClick={openModal}
                >
                  <FaUser />
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
      <LoginForm isOpen={isModalOpen} onClose={closeModal} />
    </nav>
  );
};

export default Navbar;
