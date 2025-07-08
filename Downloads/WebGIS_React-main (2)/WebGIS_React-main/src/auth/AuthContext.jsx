import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import apiClient from "../api/apiClient";

const API_URL = "http://5.16.255.254:4000/api/";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        const refreshToken = localStorage.getItem("refresh_token");
        const storedUser = localStorage.getItem("user");

        console.log("DEBUG: Initial Authentication Check");
        console.log("Access Token:", !!accessToken);
        console.log("Refresh Token:", !!refreshToken);
        console.log("Stored User:", storedUser);

        if (accessToken && refreshToken) {
          try {
            // Verify token (adjust endpoint as per your backend)
            const response = await axios.post(`${API_URL}token/verify/`, {
              token: accessToken,
            });

            console.log("Token Verification Response:", response.data);

            // If verification is successful and stored user exists
            if (response.status === 200 && storedUser) {
              const userData = JSON.parse(storedUser);

              setIsAuthenticated(true);
              setUser(userData);
            } else {
              // If no stored user, try to refresh
              await refreshTokens(refreshToken);
            }
          } catch (verifyError) {
            console.error("Token Verification Error", verifyError);
            // If verification fails, try to refresh
            await refreshTokens(refreshToken);
          }
        } else {
          console.log("No tokens found");
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Authentication check failed", error);
        clearTokens();
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  const refreshTokens = async (refreshToken) => {
    try {
      const response = await axios.post(`${API_URL}token/refresh/`, {
        refresh: refreshToken,
      });

      console.log("Token Refresh Response:", response.data);

      // Update tokens
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);

      // If you have user data from login, use that
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);

        setIsAuthenticated(true);
        setUser(userData);
      }

      return true;
    } catch (error) {
      console.error("Token refresh failed", error);
      clearTokens();
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}auth/login/`, {
        username,
        password,
      });

      console.log("LOGIN RESPONSE:", response.data);

      // Store tokens
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);

      // Create explicit user object
      const userData = {
        user_id: response.data.user_id,
        username: response.data.username,
        is_staff: response.data.is_staff,
      };

      console.log("CONSTRUCTED USER DATA:", userData);

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(userData));

      setIsAuthenticated(true);
      setUser(userData);

      return true;
    } catch (error) {
      console.error("Login failed", error);
      clearTokens();
      throw error;
    }
  };

  const logout = async () => {
    try {
      const accessToken = localStorage.getItem("access_token");
      const refreshToken = localStorage.getItem("refresh_token");

      // Optional: Call backend logout if your API supports it
      await axios.post(`${API_URL}auth/logout/`, {
        refresh_token: refreshToken,
      });
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      clearTokens();
      // Remove stored user data
      localStorage.removeItem("user");
    }
  };
  const terminate = async (token_id) => {
    try {
      await apiClient.post(`${API_URL}auth/terminate/`, { token_id: token_id });
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Termination failed", error);
    }
  };

  const clearTokens = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  };
  // Axios interceptor to add token to requests
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      // Eject the interceptor when the component unmounts
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        user,
        login,
        logout,
        refreshTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
