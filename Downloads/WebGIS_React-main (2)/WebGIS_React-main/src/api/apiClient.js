import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://5.16.255.254:4000",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Function to get access token
const getAccessToken = () => {
  return localStorage.getItem("access_token");
};

// Function to get refresh token
const getRefreshToken = () => {
  return localStorage.getItem("refresh_token");
};

// Interceptor for request
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor for response
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is due to an unauthorized access and it's not a retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const refreshToken = getRefreshToken();
        const response = await axios.post("/api/token/refresh/", {
          refresh: refreshToken,
        });

        // Update stored tokens
        localStorage.setItem("access_token", response.data.access);

        // Retry the original request with new access token
        originalRequest.headers[
          "Authorization"
        ] = `Bearer ${response.data.access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        console.error("Token refresh failed");

        // Clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        // Optional: Redirect to login page
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
