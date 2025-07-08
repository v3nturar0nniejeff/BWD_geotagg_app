import axios from "axios";

const sendActivityLog = async (activity_type, remarks) => {
  console.log("Logging activity:", activity_type, remarks);
  try {
    const response = await axios.post(
      "http://5.16.255.254:4000/api/log-user-activity/",
      {
        activity_type: activity_type,
        remarks: remarks,
      }
    );
    console.log(response.data.message);
    return response.data;
  } catch (error) {
    console.error("Error logging activity:", error.message);
    throw error;
  }
};

export default sendActivityLog;
