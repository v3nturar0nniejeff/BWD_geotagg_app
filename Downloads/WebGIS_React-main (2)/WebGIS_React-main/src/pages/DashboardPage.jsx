import React, { useEffect, useRef, useState, useCallback } from "react";
import Chart from "chart.js/auto";
import apiClient from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import { getJobOrdersData } from "../api/jobOrders";
import { Link } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// Separate function for creating a doughnut chart
const createDoughnutChart = (chartRef, labels, data, colors) => {
  if (!chartRef.current) return null;

  const ctx = chartRef.current.getContext("2d");
  return new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#fff",
          },
        },
      },
    },
  });
};

// Separate function for creating a line chart
const createLineChart = (chartRef, labels, datasets) => {
  if (!chartRef.current) return null;

  // Color palette with distinct colors
  const colorPalette = [
    { border: "#FF9800", background: "rgba(255, 152, 0, 0.1)" }, // Orange
    { border: "#E91E63", background: "rgba(233, 30, 99, 0.1)" }, // Pink
    { border: "#2196F3", background: "rgba(33, 150, 243, 0.1)" }, // Blue
    { border: "#4CAF50", background: "rgba(76, 175, 80, 0.1)" }, // Green
    { border: "#9C27B0", background: "rgba(156, 39, 176, 0.1)" }, // Purple
    { border: "#00BCD4", background: "rgba(0, 188, 212, 0.1)" }, // Cyan
    { border: "#FF5722", background: "rgba(255, 87, 34, 0.1)" }, // Deep Orange
    { border: "#673AB7", background: "rgba(103, 58, 183, 0.1)" }, // Deep Purple
  ];

  const ctx = chartRef.current.getContext("2d");
  return new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: datasets.map((dataset, index) => ({
        ...dataset,
        borderColor: colorPalette[index % colorPalette.length].border,
        tension: 0.4,
        fill: true,
        backgroundColor: colorPalette[index % colorPalette.length].background,
        borderWidth: 2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "category",
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "#fff",
            autoSkip: true,
            minRotation: 45,
            maxTicksLimit: 40,
            maxRotation: 0,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "#fff",
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#fff",
          },
        },
      },
    },
  });
};

// API data fetching function
export const getDashboardData = async () => {
  try {
    const response = await apiClient.get("/api/dashboard/");
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

const DashboardPage = () => {
  const { isAuthenticated } = useAuth();

  // Refs for charts
  const commercialChartRef = useRef(null);
  const gisChartRef = useRef(null);
  const activityChartRef = useRef(null);

  // Refs to track chart instances
  const commercialChartInstance = useRef(null);
  const gisChartInstance = useRef(null);
  const activityChartInstance = useRef(null);

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    percent_mapped_formatted: "0",
    active_accounts: 0,
    inactive_accounts: 0,
    gis_active_accounts: 0,
    gis_inactive_accounts: 0,
    gis_total_accounts: 0,
    gis_count: 0,
    total_accounts: 0,
    activities: [],
    logs: [],
    sessions_info: [],
  });

  const [jobOrdersData, setJobOrdersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoized data fetching
  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const data = await getDashboardData();
      const jobdata = await getJobOrdersData();

      setDashboardData(data);
      setJobOrdersData(jobdata);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  //DEBUGGING PURPOSES
  useEffect(() => {
    console.log("isAuthenticated:", isAuthenticated);
    const storedToken = localStorage.getItem("access");
    console.log("Stored Token:", storedToken);
  }, [isAuthenticated]);

  // Single useEffect for data fetching
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Chart creation useEffect
  useEffect(() => {
    const destroyCharts = () => {
      [
        { chart: commercialChartInstance, ref: commercialChartRef },
        { chart: gisChartInstance, ref: gisChartRef },
        { chart: activityChartInstance, ref: activityChartRef },
      ].forEach(({ chart, ref }) => {
        if (chart.current) {
          chart.current.destroy();
          chart.current = null;
        }
      });
    };

    destroyCharts();

    // Commercial Chart
    commercialChartInstance.current = createDoughnutChart(
      commercialChartRef,
      ["Active Connections", "Inactive Connections"],
      [
        dashboardData.active_accounts || 0,
        dashboardData.inactive_accounts || 0,
      ],
      ["rgba(76, 175, 80, 0.8)", "rgba(244, 67, 54, 0.8)"]
    );

    // GIS Chart
    gisChartInstance.current = createDoughnutChart(
      gisChartRef,
      ["Active Connections", "Inactive Connections"],
      [
        dashboardData.gis_active_accounts || 0,
        dashboardData.gis_inactive_accounts || 0,
      ],
      ["rgba(10, 117, 190, 0.8)", "rgba(246, 147, 37, 0.8)"]
    );

    // Group activities by activity type
    const activityGroups = dashboardData.activities.reduce((acc, activity) => {
      if (!acc[activity.activity_type]) {
        acc[activity.activity_type] = [];
      }
      acc[activity.activity_type].push(activity);
      return acc;
    }, {});

    // Get all unique days (YYYY-MM-DD) and sort them
    const allDays = [
      ...new Set(
        dashboardData.activities.map((activity) => activity.day.split("T")[0])
      ),
    ].sort();

    // Prepare datasets for the line chart, filling missing dates with 0
    const datasets = Object.entries(activityGroups).map(
      ([activityType, activities]) => {
        // Map day to count for this activity type
        const dayToCount = {};
        activities.forEach((activity) => {
          const day = activity.day.split("T")[0];
          dayToCount[day] = activity.count;
        });
        return {
          label: activityType,
          data: allDays.map((day) => dayToCount[day] || 0),
        };
      }
    );

    // Activity Chart
    activityChartInstance.current = createLineChart(
      activityChartRef,
      allDays,
      datasets
    );

    // Cleanup function
    return () => {
      destroyCharts();
    };
  }, [dashboardData]);

  const handleUserTermination = async (token_id) => {
    try {
      const result = await apiClient.get(`/api/terminate-user/${token_id}/`);

      toast.success("User terminated successfully");
    } catch (error) {
      console.error("Failed to terminate user:", error);
      toast.error("Failed to terminate user. Please try again later");
    }
  };

  // Add loading states
  const LoadingCard = () => (
    <div className="bg-[#444] p-4 rounded-lg">
      <Skeleton height={50} baseColor="#333" highlightColor="#444" />
      <div className="mt-2">
        <Skeleton
          count={2}
          height={35}
          baseColor="#333"
          highlightColor="#444"
        />
      </div>
    </div>
  );

  const LoadingLogs = () => (
    <div className="overflow-y-auto h-64">
      <Skeleton
        count={5}
        height={40}
        className="mb-2"
        baseColor="#333"
        highlightColor="#444"
      />
    </div>
  );

  const LoadingChart = () => (
    <div className="h-[300px]">
      <Skeleton height="100%" baseColor="#333" highlightColor="#444" />
    </div>
  );

  const DatabaseLoadingCard = () => (
    <div className="bg-[#424242] rounded-lg p-6">
      <Skeleton
        height={32}
        width={200}
        baseColor="#333"
        highlightColor="#444"
        className="mb-4"
      />
      <div className="h-96">
        <Skeleton height="100%" baseColor="#333" highlightColor="#444" />
      </div>
      <div className="text-center mt-2">
        <Skeleton
          height={24}
          width={200}
          baseColor="#333"
          highlightColor="#444"
          className="mx-auto"
        />
      </div>
    </div>
  );

  return (
    <div className="bg-[#303030]">
      <div className="container mx-auto p-5 px-24 ">
        <h2 className="text-3xl font-bold text-center mb-5 pt-20 text-white">
          GIS Dashboard
        </h2>

        <div className="space-y-4">
          {/* Active Sessions Section */}
          {isLoading ? (
            <LoadingCard />
          ) : (
            dashboardData.sessions_info.length > 0 && (
              <div className="w-full mb-4">
                <h1 className="text-xl font-semibold mb-3 text-white">
                  Active Sessions
                </h1>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-[#303030] text-white">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left">Username</th>
                        <th className="px-6 py-3 text-left">Email</th>
                        <th className="px-6 py-3 text-left">State</th>
                        <th className="px-6 py-3 text-left">Expires</th>
                        <th className="px-6 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.sessions_info.map((session, index) => (
                        <tr key={index} className="border-t border-gray-700">
                          <td className="px-6 py-4">{session.username}</td>
                          <td className="px-6 py-4">{session.email}</td>
                          <td className="px-6 py-4">{session.state}</td>
                          <td className="px-6 py-4">
                            {new Date(session.expire_date).toLocaleString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                              onClick={() => {
                                /* Handle terminate */
                              }}
                            >
                              Terminate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* Database Cards Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Commercial Database Card */}
            {isLoading ? (
              <DatabaseLoadingCard />
            ) : (
              <div className="bg-[#424242] rounded-lg p-6 text-white">
                <h4 className="text-xl font-semibold mb-4">
                  Commercial Database
                </h4>
                <div className="h-96">
                  <canvas ref={commercialChartRef}></canvas>
                </div>
                <p className="text-center mt-2">
                  Concessionaires: {dashboardData.total_accounts}
                </p>
              </div>
            )}

            {/* GIS Database Card */}
            {isLoading ? (
              <DatabaseLoadingCard />
            ) : (
              <div className="bg-[#424242] rounded-lg p-6 text-white">
                <h4 className="text-xl font-semibold mb-4">GIS Database</h4>
                <div className="h-96">
                  <canvas ref={gisChartRef}></canvas>
                </div>
                <p className="text-center mt-2">
                  Concessionaires: {dashboardData.gis_count}
                </p>
              </div>
            )}
          </div>

          {/* Activity Chart */}
          {isLoading ? (
            <LoadingChart />
          ) : (
            <div className="w-full mb-4">
              <div className="bg-[#303030] rounded-lg p-6 text-white">
                <div className="h-[600px]">
                  <canvas ref={activityChartRef}></canvas>
                </div>
              </div>
            </div>
          )}

          {/* Percentage and Logs Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Percentage Mapped Card */}
            {isLoading ? (
              <LoadingCard />
            ) : (
              <div className="bg-[#424242] rounded-lg p-6 text-white">
                <div className="h-80 flex flex-col items-center justify-center">
                  <h4 className="text-xl font-semibold mb-4">% Mapped</h4>
                  <div className="text-6xl font-bold">
                    {dashboardData.percent_mapped_formatted}%
                  </div>
                  <p className="mt-2">active connections mapped</p>
                </div>
              </div>
            )}

            {/* User Logs Card */}
            <div className="bg-[#424242] rounded-lg p-6 text-white">
              <div className="h-80">
                <h4 className="text-xl font-semibold text-center mb-4">
                  User logs
                </h4>
                {isLoading ? (
                  <LoadingLogs />
                ) : (
                  <div className="overflow-y-auto h-64 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-500">
                    {dashboardData.logs.length > 0 ? (
                      <ul className="space-y-2">
                        {dashboardData.logs.map((log, index) => {
                          const timestamp = new Date(log.timestamp);
                          const formattedTimestamp = timestamp.toLocaleString(
                            "en-US",
                            {
                              weekday: "short", // "Mon"
                              year: "numeric", // "2024"
                              month: "short", // "Dec"
                              day: "numeric", // "3"
                              hour: "numeric", // "9"
                              minute: "numeric", // "44"
                              hour12: true, // "AM/PM"
                            }
                          );

                          return (
                            <li
                              key={index}
                              className="p-2 border-solid border-b-2 border-[#505050] flex justify-between items-center"
                            >
                              {`${log.username} logged in at ${formattedTimestamp}`}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-center">No user logs found.</p>
                    )}
                  </div>
                )}
                <p className="text-center mt-3">user logins</p>
              </div>
            </div>
          </div>

          {/* Job Orders Section */}
          <div className="bg-[#424242] rounded-lg p-6 text-white">
            <h4 className="text-xl font-semibold text-center mb-4">
              Job Orders
            </h4>
            <div className="space-y-2 overflow-y-auto h-[300px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-500">
              {/* {jobOrdersData.length > 0 ? (
                jobOrdersData.map((order, index) => (
                  <Link
                    key={order.reference_no || index} // Use reference_no as key if available
                    className="p-1 flex justify-between items-center cursor-pointer border-solid border-b-2 border-[#505050] hover:bg-[#505050] transform hover:scale-[1.015] transition-transform duration-200 text-md px-10"
                    to={`/dashboard/job-orders/${order.id}`}
                  >
                    <span>{`${order.order_type} #${order.reference_no} by ${order.requested_by_name}`}</span>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        order.status === "Pending"
                          ? "bg-yellow-500"
                          : order.status === "In Progress"
                          ? "bg-blue-500"
                          : "bg-green-500"
                      }`}
                    >
                      {order.status}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-center">No job orders found.</p>
              )} */}
              {jobOrdersData.length > 0 ? (
                jobOrdersData.map((order, index) => (
                  <Link
                    key={order.reference_no || index}
                    className="p-1 flex justify-between items-center cursor-pointer border-solid border-b-2 border-[#505050] hover:bg-[#505050] transform hover:scale-[1.015] transition-transform duration-200 text-md px-10"
                    to={`/dashboard/job-orders/${order.id}`}
                  >
                    <span>{`${order.order_type} #${order.reference_no} by ${order.requested_by_name}`}</span>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        order.status === "Pending"
                          ? "bg-yellow-500"
                          : order.status === "In Progress"
                          ? "bg-blue-500"
                          : "bg-green-500"
                      }`}
                    >
                      {order.status}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-center">No job orders found.</p>
              )}
            </div>
            <p className="text-center mt-3">Overview of recent job orders.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
