import apiClient from "./apiClient"; // Assuming you have an apiClient set up

export const getDashboardData = async () => {
  try {
    const response = await apiClient.get("/api/dashboard/");

    // Ensure the response has activities
    if (!response.data.activities) {
      throw new Error("No activities found in the dashboard data");
    }

    // Return an object with the activities array
    return {
      activities: response.data.activities,
      // You can add other dashboard data here if needed
      totalAccounts: response.data.totalAccounts || 0,
      gisCount: response.data.gisCount || 0,
      percentMapped: response.data.percentMapped || 0,
      sessionsInfo: response.data.sessionsInfo || [],
      logs: response.data.logs || [],
      jobOrders: response.data.jobOrders || [],
    };
  } catch (error) {
    // More detailed error handling
    if (error.response) {
      console.error(
        "Server responded with error:",
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up the request:", error.message);
    }

    // Optionally, you can return a default/empty state
    return {
      activities: [],
      totalAccounts: 0,
      gisCount: 0,
      percentMapped: 0,
      sessionsInfo: [],
      logs: [],
      jobOrders: [],
    };
  }
};
