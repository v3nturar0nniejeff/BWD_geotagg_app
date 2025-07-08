import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const ProtectedRoute = ({ isStaffOnly = false }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // If still loading, you might want to show a loading spinner
  if (loading) {
    return <div>Loading...</div>;
  }

  // Check if authenticated
  if (!isAuthenticated) {
    return <Navigate to="/access-denied" />;
  }

  // If route is staff-only, check if the user is a staff member
  if (isStaffOnly && (!user || !user.is_staff)) {
    return <Navigate to="/access-denied" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
