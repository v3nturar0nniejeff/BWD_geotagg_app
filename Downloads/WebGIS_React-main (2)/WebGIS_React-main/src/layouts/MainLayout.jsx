import React from "react";

import { Outlet } from "react-router-dom";

import MapLayerSwitcher from "../components/MapLayerSwitcher";
import Coordinates from "../components/Coordinates";
import ConcessionaireList from "../components/ConcessionaireList";
import LoginForm from "../components/LoginForm";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CaptureProvider } from "../context/CaptureContext";
import AnnouncementCarousel from "../components/AnnouncementCarousel";
import SearchConcessionaire from "../components/SearchConcessionaire";

const MainLayout = () => {
  return (
    <>
      <CaptureProvider>
        <Outlet />
        {/* <ConcessionaireList /> */}
        {/* <SearchConcessionaire /> */}
        <MapLayerSwitcher />
        <LoginForm />
        <ToastContainer limit={1} newestOnTop={false} autoClose={2000} />
        <AnnouncementCarousel />
      </CaptureProvider>
    </>
  );
};

export default MainLayout;
