import React from "react";

import { Outlet } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";
import NavBar from "../components/Navbar";

const SecondaryLayout = () => {
  return (
    <>
      <NavBar useCaptureFeature={false} />
      <Outlet />
    </>
  );
};

export default SecondaryLayout;
