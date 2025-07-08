import React, { useEffect } from "react";
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import SecondaryLayout from "./layouts/SecondaryLayout";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import { AuthProvider } from "./auth/AuthContext";
import JobDetails from "./pages/JobDetailsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AccessDenied from "./components/AccessDenied";
import ErrorPage from "./components/ErrorPage";

// for specifying link specifically to the sidebar use navlink to highlight the active link and is isactive classname to the navlink

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <MainLayout />,
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
          path: "/login",
          element: <HomePage />,
        },
        { path: "access-denied", element: <AccessDenied /> },
      ],
    },
    {
      element: <SecondaryLayout />,
      children: [
        {
          element: <ProtectedRoute isStaffOnly={true} />,
          children: [
            {
              path: "/dashboard",
              element: <DashboardPage />,
            },
            {
              path: "/dashboard/job-orders/:id",
              element: <JobDetails />,
            },
          ],
        },
      ],
    },
  ]);

  // return <RouterProvider router={router} />;
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;
