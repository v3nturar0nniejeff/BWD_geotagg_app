import apiClient from "./apiClient";

export const getConcessionaires = async () => {
  try {
    const response = await apiClient.get("/api/concessionaires/");
    // console.log("API Response Structure:", {
    //   fullResponse: response,
    //   data: response.data,
    //   typeof: typeof response.data,
    //   isArray: Array.isArray(response.data),
    // });
    return response.data;
  } catch (error) {
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
