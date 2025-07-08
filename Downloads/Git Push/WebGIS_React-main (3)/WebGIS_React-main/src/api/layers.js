import apiClient from "./apiClient";

export const getUserLayers = async () => {
  try {
    const response = await apiClient.post("/api/layers/");
    return response.data;
  } catch (error) {
    // More detailed error handling
    if (error.response) {
      console.error(
        "Server responded with error:",
        error.response.status,
        error.response.data
      );
    }
    throw error;
  }
};
