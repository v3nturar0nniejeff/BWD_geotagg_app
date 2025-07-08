// import React from 'react';
import axios from "axios";
import apiClient from "./apiClient";

const generatePDF = async () => {
  try {
    const response = await apiClient.get(`/api/generate-pdf/${refNo}/`);

    // Open PDF in a new tab
    if (response.data.pdf_url) {
      window.open(response.data.pdf_url, "_blank");
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    // Handle error (show notification, etc.)
  }
};
