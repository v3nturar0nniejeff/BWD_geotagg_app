// import apiClient from "./apiClient";

// export const getJobOrdersData = async () => {
//   try {
//     const response = await apiClient.get("/api/job-order/");

//     // Ensure the response has activities
//     if (!response.data) {
//       throw new Error("No Job Orders Found");
//     }

//     // Return an object with the activities array
//     return {
//       id: response.data.id || 0,
//       // You can add other dashboard data here if needed
//       orderType: response.data.orderType || [],
//       status: response.data.status || [],
//       referenceNo: response.data.referenceNo || 0,
//       dateOfRequestOrField: response.data.dateOfRequestOrField || [],
//       requestedByName: response.data.requestedByName || [],
//     };
//   } catch (error) {
//     // More detailed error handling
//     if (error.response) {
//       console.error(
//         "Server responded with error:",
//         error.response.status,
//         error.response.data
//       );
//     } else if (error.request) {
//       console.error("No response received:", error.request);
//     } else {
//       console.error("Error setting up the request:", error.message);
//     }
//   }
// };

import apiClient from "./apiClient";

export const getJobOrdersData = async () => {
  try {
    const response = await apiClient.get("/api/job-order/");
    return response.data;
  } catch (error) {
    console.error(
      "Server responded with error:",
      error.response?.status,
      error.response?.data
    );
    throw error;
  }
};
