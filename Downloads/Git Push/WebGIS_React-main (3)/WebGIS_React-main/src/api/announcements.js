import apiClient from "./apiClient";

export const getAnnouncements = async () => {
  try {
    const response = await apiClient.get("/api/announcements/");
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
