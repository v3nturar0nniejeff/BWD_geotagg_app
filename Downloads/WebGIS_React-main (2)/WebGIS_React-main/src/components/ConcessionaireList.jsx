// import React, { useState, useEffect } from "react";
// import { Search, ChevronLeft, ChevronRight } from "lucide-react";
// import { useAuth } from "../auth/AuthContext";
// import { getConcessionaires } from "../api/concessionaires";
// import ClimbingBoxLoader from "react-spinners/ClimbingBoxLoader";

// const ConcessionaireList = () => {
//   const { isAuthenticated } = useAuth();
//   const [allConcessionaires, setAllConcessionaires] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [concessionaires, setConcessionaires] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const itemsPerPage = 20;
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const result = await getConcessionaires();

//         // Extract properties from GeoJSON features
//         if (result && result.features && Array.isArray(result.features)) {
//           const processedData = result.features.map((feature) => ({
//             id: feature.id,
//             name:
//               feature.properties.name ||
//               `Concessionaire ${feature.properties.gid}`,
//             account: feature.properties.sp_id || "N/A",
//             book: feature.properties.book || "N/A",
//             address: feature.properties.address || "N/A",
//             status: feature.properties.status,
//             // Add properties here if needed
//             ...feature.properties,
//           }));

//           setAllConcessionaires(processedData);
//         } else {
//           setError("Invalid data format received from API");
//           setAllConcessionaires([]);
//         }
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (isAuthenticated) {
//       fetchData();
//     }
//   }, [isAuthenticated]);

//   useEffect(() => {
//     const filteredConcessionaires = allConcessionaires.filter((c) =>
//       c.address.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     setConcessionaires(
//       filteredConcessionaires.slice(startIndex, startIndex + itemsPerPage)
//     );
//   }, [currentPage, searchTerm, allConcessionaires]);

//   const totalPages = Math.ceil(allConcessionaires.length / itemsPerPage);

//   const getStatusColor = (status) => {
//     return status === "Active" ? "text-green-400" : "text-yellow-400";
//   };

//   const handlePageChange = (newPage) => {
//     setCurrentPage(newPage);
//   };

//   const renderPageNumbers = () => {
//     const pageNumbers = [];
//     const maxVisiblePages = 7;
//     let startPage, endPage;

//     if (totalPages <= maxVisiblePages) {
//       // If total pages are less than or equal to max visible pages, show all
//       startPage = 1;
//       endPage = totalPages;
//     } else {
//       // Calculate start and end pages to keep current page centered when possible
//       const halfVisible = Math.floor(maxVisiblePages / 2);
//       if (currentPage <= halfVisible + 1) {
//         startPage = 1;
//         endPage = maxVisiblePages;
//       } else if (currentPage >= totalPages - halfVisible) {
//         startPage = totalPages - maxVisiblePages + 1;
//         endPage = totalPages;
//       } else {
//         startPage = currentPage - halfVisible;
//         endPage = currentPage + halfVisible;
//       }
//     }

//     // Add page numbers
//     for (let i = startPage; i <= endPage; i++) {
//       pageNumbers.push(
//         <button
//           key={i}
//           onClick={() => handlePageChange(i)}
//           className={`w-6 h-6 mx-1 rounded-full ${
//             currentPage === i
//               ? "bg-blue-500 text-white"
//               : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//           }`}
//         >
//           {i}
//         </button>
//       );
//     }

//     return pageNumbers;
//   };

//   const startItem = (currentPage - 1) * itemsPerPage + 1;
//   const endItem = Math.min(
//     currentPage * itemsPerPage,
//     allConcessionaires.length
//   );
//   if (!isAuthenticated) return null;
//   return (
//     <div className="absolute h-[790px] bg-[#2E3338] w-[400px] border border-solid border-black z-40 top-14 right-0 text-white overflow-hidden flex flex-col">
//       <div className="p-1 border-b border-gray-600">
//         <div className="flex justify-between items-center mb-1">
//           <h2 className="text-lg font-semibold">Concessionaire/s</h2>
//         </div>
//         <div className="relative mb-2">
//           <input
//             type="text"
//             placeholder="Search for Address..."
//             className="w-full bg-[#1E2124] border border-gray-600 rounded py-2 pl-10 pr-4 text-sm h-7"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//           <Search
//             className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
//             size={16}
//           />
//         </div>
//       </div>
//       <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-500">
//         <div className="sticky top-0 bg-[#1E2124] border-b border-gray-600 px-3 py-2 flex items-center">
//           <div className="w-12 flex justify-center"></div>
//           <div className="flex-1 font-semibold text-sm">Concessionaire</div>
//           <div className="flex items-center">
//             <span className="mr-2 text-sm">
//               Result: {allConcessionaires.length}
//             </span>
//           </div>
//         </div>
//         {concessionaires.map((concessionaire, index) => (
//           <div key={index} className="flex border-b border-gray-600">
//             <div className="w-12 flex justify-center items-center border-r border-gray-600">
//               <input type="checkbox" />
//             </div>
//             <div className="flex-1 p-3">
//               <div className="flex justify-between items-center mb-1">
//                 <span className="font-semibold text-sm">
//                   {concessionaire.name}
//                 </span>
//                 <span
//                   className={`text-xs ${getStatusColor(
//                     concessionaire.status === "A" ? "Active" : "Inactive"
//                   )}`}
//                 >
//                   {concessionaire.status === "A" ? "Active" : "Inactive"}
//                 </span>
//               </div>
//               <div className="text-xs text-gray-300">
//                 <p>Account: {concessionaire.account}</p>
//                 <p>Book: {concessionaire.book}</p>
//                 <p>Address: {concessionaire.address}</p>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//       <div className="p-2 border-t border-gray-600">
//         <div className="flex justify-center items-center text-sm">
//           <button
//             onClick={() => handlePageChange(currentPage - 1)}
//             disabled={currentPage === 1}
//             className="p-1 px-4 disabled:opacity-50"
//           >
//             <ChevronLeft size={20} />
//           </button>
//           {renderPageNumbers()}
//           <button
//             onClick={() => handlePageChange(currentPage + 1)}
//             disabled={currentPage === totalPages}
//             className="p-1 px-4 disabled:opacity-50"
//           >
//             <ChevronRight size={20} />
//           </button>
//         </div>
//         <div className="text-center text-xs mt-1 text-gray-400">
//           {startItem}-{endItem} of {allConcessionaires.length} items
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ConcessionaireList;

import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getConcessionaires } from "../api/concessionaires";
import ClimbingBoxLoader from "react-spinners/ClimbingBoxLoader";

const ConcessionaireList = () => {
  const { isAuthenticated } = useAuth();
  const [allConcessionaires, setAllConcessionaires] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [concessionaires, setConcessionaires] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 20;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getConcessionaires();

        // Extract properties from GeoJSON features
        if (result && result.features && Array.isArray(result.features)) {
          const processedData = result.features.map((feature) => ({
            id: feature.id,
            name:
              feature.properties.name ||
              `Concessionaire ${feature.properties.gid}`,
            account: feature.properties.sp_id || "N/A",
            book: feature.properties.book || "N/A",
            address: feature.properties.address || "N/A",
            status: feature.properties.status,
            // Add properties here if needed
            ...feature.properties,
          }));

          setAllConcessionaires(processedData);
        } else {
          setError("Invalid data format received from API");
          setAllConcessionaires([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const filteredConcessionaires = allConcessionaires.filter((c) =>
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const startIndex = (currentPage - 1) * itemsPerPage;
    setConcessionaires(
      filteredConcessionaires.slice(startIndex, startIndex + itemsPerPage)
    );
  }, [currentPage, searchTerm, allConcessionaires]);

  const totalPages = Math.ceil(allConcessionaires.length / itemsPerPage);

  const getStatusColor = (status) => {
    return status === "Active" ? "text-green-400" : "text-yellow-400";
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 7;
    let startPage, endPage;

    if (totalPages <= maxVisiblePages) {
      // If total pages are less than or equal to max visible pages, show all
      startPage = 1;
      endPage = totalPages;
    } else {
      // Calculate start and end pages to keep current page centered when possible
      const halfVisible = Math.floor(maxVisiblePages / 2);
      if (currentPage <= halfVisible + 1) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (currentPage >= totalPages - halfVisible) {
        startPage = totalPages - maxVisiblePages + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - halfVisible;
        endPage = currentPage + halfVisible;
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`w-6 h-6 mx-1 rounded-full ${
            currentPage === i
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {i}
        </button>
      );
    }

    return pageNumbers;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(
    currentPage * itemsPerPage,
    allConcessionaires.length
  );
  if (!isAuthenticated) return null;
  return (
    <div className="absolute h-[790px] bg-[#2E3338] w-[400px] border border-solid border-black z-40 top-14 right-0 text-white overflow-hidden flex flex-col">
      <>
        <div className="p-1 border-b border-gray-600">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-lg font-semibold">Concessionaire/s</h2>
          </div>
          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Search for Address..."
              className="w-full bg-[#1E2124] border border-gray-600 rounded py-2 pl-10 pr-4 text-sm h-7"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
          </div>
        </div>
        {/*  */}
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <ClimbingBoxLoader color="#36d7b7" size={15} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-500">
            <div className="sticky top-0 bg-[#1E2124] border-b border-gray-600 px-3 py-2 flex items-center">
              <div className="w-12 flex justify-center"></div>
              <div className="flex-1 font-semibold text-sm">Concessionaire</div>
              <div className="flex items-center">
                <span className="mr-2 text-sm">
                  Result: {allConcessionaires.length}
                </span>
              </div>
            </div>
            {concessionaires.map((concessionaire, index) => (
              <div key={index} className="flex border-b border-gray-600">
                <div className="w-12 flex justify-center items-center border-r border-gray-600">
                  <input type="checkbox" />
                </div>
                <div className="flex-1 p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm">
                      {concessionaire.name}
                    </span>
                    <span
                      className={`text-xs ${getStatusColor(
                        concessionaire.status === "A" ? "Active" : "Inactive"
                      )}`}
                    >
                      {concessionaire.status === "A" ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-300">
                    <p>Account: {concessionaire.account}</p>
                    <p>Book: {concessionaire.book}</p>
                    <p>Address: {concessionaire.address}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/*  */}
        <div className="p-2 border-t border-gray-600">
          <div className="flex justify-center items-center text-sm">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 px-4 disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            {renderPageNumbers()}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1 px-4 disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="text-center text-xs mt-1 text-gray-400">
            {startItem}-{endItem} of {allConcessionaires.length} items
          </div>
        </div>
      </>
    </div>
  );
};

export default ConcessionaireList;
