import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  FaFileSignature,
  FaClipboardList,
  FaCheckSquare,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaGitAlt,
  FaTruck,
  FaRoad,
  FaUser,
  FaCog,
  FaCommentDots,
  FaUserCheck,
  FaUserMinus,
} from "react-icons/fa";
import apiClient from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";

function handleOpenPDF(refNo) {
  const pdfUrl = `http://5.16.255.254:4000/api/generate-pdf/${refNo}/`;
  window.open(pdfUrl, "_blank");
}

const JobOrderDetailPage = () => {
  const { isAuthenticated } = useAuth();
  const { id } = useParams();

  // State management
  const [jobOrder, setJobOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch job order data
  useEffect(() => {
    async function fetchJobOrder() {
      try {
        const response = await apiClient.get(`/api/job-order/${id}`);
        setJobOrder(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Full Error:", err);
        setError("Failed to fetch job order details");
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchJobOrder();
    }
  }, [id, isAuthenticated]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg[#303030]">
        {/* <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div> */}
      </div>
    );
  }

  // Error handling
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  // No job order found
  if (!jobOrder) {
    return (
      <div className="flex justify-center items-center h-screen">
        No job order found
      </div>
    );
  }

  // Determine if this is a field order
  const isFieldOrder = !!jobOrder.location;

  return (
    <div className="bg-[#303030] h-screen">
      <div className="container mx-auto my-10 py-1 mt-[50px] h-screen">
        {/* Button Container */}
        <div className="flex justify-between mb-4 mt-5 px-16">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="btn btn-light text-sm bg-white text-gray-600 border border-gray-600  hover:bg-gray-100 rounded p-1 w-[160px] h-10"
          >
            BACK TO DASHBOARD
          </button>

          <a
            onClick={() => handleOpenPDF(jobOrder.reference_no)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-light text-sm bg-white text-gray-600  border border-gray-600 hover:bg-gray-100 rounded p-1 w-[160px] h-10 text-center pt-2 cursor-pointer"
          >
            PRINT PDF
          </a>
        </div>

        {/* Content Section */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <h4 className="text-center text-xl font-semibold mb-4 text-white">
              Job Order Detail
            </h4>

            {/* Common Fields */}
            <div className="space-y-4">
              {/* Reference No */}
              <div className="relative flex flex-col items-center">
                <div className="relative w-[550px]">
                  <FaFileSignature className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    value={jobOrder.reference_no}
                    disabled
                    className="w-full pl-10 pr-3 py-2 border rounded text-gray-700 bg-gray-100"
                    placeholder="Reference No"
                  />
                </div>
                <label
                  htmlFor="referenceNo"
                  className="block text-center text-gray-500 mt-2"
                >
                  Reference No
                </label>
              </div>

              {/* Order Type */}
              <div className="relative flex flex-col items-center">
                <div className="relative w-[550px]">
                  <FaClipboardList className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    value={jobOrder.order_type}
                    disabled
                    className="w-full pl-10 pr-3 py-2 border rounded text-gray-700 bg-gray-100"
                    placeholder="Reference No"
                  />
                </div>
                <label
                  htmlFor="r"
                  className="block text-center text-gray-500 mt-2"
                >
                  Job Order Type
                </label>
              </div>
              {/* Status */}
              <div className="relative flex flex-col items-center">
                <div className="relative w-[550px]">
                  <FaCheckSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    value={jobOrder.status}
                    disabled
                    className="w-full pl-10 pr-3 py-2 border rounded text-gray-700 bg-gray-100"
                    placeholder="Status"
                  />
                </div>
                <label
                  htmlFor="status"
                  className="block text-center text-gray-500 mt-2"
                >
                  Status
                </label>
              </div>

              {/* Conditional Rendering for Field Orders */}
              {isFieldOrder ? (
                <>
                  {/* Location */}
                  <div className="relative flex flex-col items-center">
                    <div className="relative w-[550px]">
                      <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="text"
                        value={jobOrder.location}
                        disabled
                        className="w-full pl-10 pr-3 py-2 border rounded text-gray-700 bg-gray-100"
                        placeholder="Location"
                      />
                    </div>
                    <label
                      htmlFor="location"
                      className="block text-center text-gray-500 mt-2"
                    >
                      Location
                    </label>
                  </div>

                  {/* Field Date */}
                  <div className="relative flex flex-col items-center">
                    <div className="relative w-[550px]">
                      <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="text"
                        value={jobOrder.date_of_request_or_field}
                        disabled
                        className="w-full pl-10 pr-3 py-2 border rounded text-gray-700 bg-gray-100"
                        placeholder="Reference No"
                      />
                    </div>
                    <label
                      htmlFor=""
                      className="block text-center text-gray-500 mt-2"
                    >
                      Field Date
                    </label>
                  </div>

                  {/* Accomplished By */}
                  <div className="relative flex flex-col items-center">
                    <div className="relative w-[550px]">
                      <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="text"
                        value={jobOrder.accomplished_by}
                        disabled
                        className="w-full pl-10 pr-3 py-2 border rounded text-gray-700 bg-gray-100"
                        placeholder="Accomplished By"
                      />
                    </div>
                    <label
                      htmlFor=""
                      className="block text-center text-gray-500 mt-2"
                    >
                      Accomplished By
                    </label>
                  </div>

                  {/* Mode of Transport */}
                  <div className="relative flex flex-col items-center">
                    <div className="relative w-[550px]">
                      <FaTruck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="text"
                        value={`${jobOrder.mode_of_transport}: ${jobOrder.plate_no}`}
                        disabled
                        className="w-full pl-10 pr-3 py-2 border rounded text-gray-700 bg-gray-100"
                        placeholder=""
                      />
                    </div>
                    <label
                      htmlFor=""
                      className="block text-center text-gray-500 mt-2"
                    >
                      Mode of Transport
                    </label>
                  </div>

                  {/* Purpose */}
                  <div className="relative flex flex-col items-center">
                    <div className="relative w-[550px]">
                      <FaCog className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="text"
                        value={jobOrder.purpose}
                        disabled
                        className="w-full pl-10 pr-3 py-2 border rounded text-gray-700 bg-gray-100"
                        placeholder=""
                      />
                    </div>
                    <label
                      htmlFor=""
                      className="block text-center text-gray-500 mt-2"
                    >
                      Purpose
                    </label>
                  </div>

                  {/* Joint Field Work */}
                  <div className="relative flex flex-col items-center">
                    <div className="relative w-[550px]">
                      <FaRoad className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="text"
                        value={jobOrder.joint_activity_with}
                        disabled
                        className="w-full pl-10 pr-3 py-2 border rounded text-gray-700 bg-gray-100"
                        placeholder=""
                      />
                    </div>
                    <label
                      htmlFor=""
                      className="block text-center text-gray-500 mt-2"
                    >
                      Joint Activity With
                    </label>
                  </div>
                </>
              ) : (
                // Data Request Fields
                <>
                  {/* Requested By */}
                  <div className="relative flex flex-col items-center">
                    <div className="relative w-[550px]">
                      <FaUserMinus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="text"
                        value={jobOrder.requested_by_name}
                        disabled
                        className="w-full pl-10 pr-3 py-2 border rounded text-gray-700 bg-gray-100"
                        placeholder=""
                      />
                    </div>
                    <label
                      htmlFor=""
                      className="block text-center text-gray-500 mt-2"
                    >
                      Requested By
                    </label>
                  </div>

                  {/* Requested Data/Revision/Map */}
                  <div className="relative flex flex-col items-center">
                    <div className="relative w-[550px]">
                      <FaGitAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="text"
                        value={jobOrder.requested_data_revision_map}
                        disabled
                        className="w-full pl-10 pr-3 py-2 border rounded text-gray-700 bg-gray-100"
                        placeholder=""
                      />
                    </div>
                    <label
                      htmlFor=""
                      className="block text-center text-gray-500 mt-2"
                    >
                      Requested Data/Revision/Map
                    </label>
                  </div>

                  {/* Purpose */}
                  <div className="relative flex flex-col items-center">
                    <div className="relative w-[550px]">
                      <FaCog className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="text"
                        value={jobOrder.purpose}
                        disabled
                        className="w-full pl-10 pr-3 py-2 border rounded text-gray-700 bg-gray-100"
                        placeholder=""
                      />
                    </div>
                    <label
                      htmlFor=""
                      className="block text-center text-gray-500 mt-2"
                    >
                      Purpose
                    </label>
                  </div>

                  {/* Remarks */}
                  <div className="relative flex flex-col items-center">
                    <div className="relative w-[550px]">
                      <FaCommentDots className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="text"
                        value={jobOrder.remarks}
                        disabled
                        className="w-full pl-10 pr-3 py-2 border rounded text-gray-700 bg-gray-100"
                        placeholder=""
                      />
                    </div>
                    <label
                      htmlFor=""
                      className="block text-center text-gray-500 mt-2"
                    >
                      Remarks
                    </label>
                  </div>

                  {/* Checked By */}
                  <div className="relative flex flex-col items-center">
                    <div className="relative w-[550px]">
                      <FaUserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="text"
                        value={jobOrder.received_and_checked_by}
                        disabled
                        className="w-full pl-10 pr-3 py-2 border rounded text-gray-700 bg-gray-100"
                        placeholder=""
                      />
                    </div>
                    <label
                      htmlFor=""
                      className="block text-center text-gray-500 mt-2"
                    >
                      Checked By
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobOrderDetailPage;
