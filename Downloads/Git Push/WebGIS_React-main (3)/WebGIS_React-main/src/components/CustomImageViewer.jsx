// import React, { useState, useCallback } from "react";
// import ImageViewer from "react-simple-image-viewer";

// const CustomImageViewer = ({ images }) => {
//   const [currentImage, setCurrentImage] = useState(0);
//   const [isViewerOpen, setIsViewerOpen] = useState(false);

//   const openImageViewer = useCallback((index) => {
//     console.log("Image viewer opened");
//     setCurrentImage(index);
//     setIsViewerOpen(true);
//   }, []);

//   const closeImageViewer = () => {
//     setCurrentImage(0);
//     setIsViewerOpen(false);
//   };

//   return (
//     <div className="flex flex-wrap gap-2">
//       {images.map((src, index) => (
//         <img
//           src={src}
//           onClick={() => openImageViewer(index)}
//           className="w-[300px] cursor-pointer hover:opacity-90 transition-opacity"
//           key={index}
//           alt={`Image ${index + 1}`}
//         />
//       ))}

//       {isViewerOpen && (
//         <ImageViewer
//           src={images}
//           currentIndex={currentImage}
//           disableScroll={false}
//           closeOnClickOutside={true}
//           onClose={closeImageViewer}
//           backgroundStyle={{
//             backgroundColor: "rgba(0, 0, 0, 0.9)",
//           }}
//         />
//       )}
//     </div>
//   );
// };

// export default CustomImageViewer;

import React, { useState, useEffect, useCallback } from "react";
import ImageViewer from "react-simple-image-viewer";

const CustomImageViewer = ({ images, onClose, initialIndex = 0 }) => {
  const [currentImage, setCurrentImage] = useState(initialIndex);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Automatically open the viewer when the component mounts
  useEffect(() => {
    setIsViewerOpen(true);
  }, []);

  const closeImageViewer = () => {
    setIsViewerOpen(false);
    if (onClose) {
      setTimeout(onClose, 100); // Small delay to ensure smooth transition
    }
  };

  return (
    <>
      {isViewerOpen && (
        <ImageViewer
          src={images}
          currentIndex={currentImage}
          disableScroll={false}
          closeOnClickOutside={true}
          onClose={closeImageViewer}
          backgroundStyle={{
            backgroundColor: "rgba(0, 0, 0, 0.9)",
          }}
        />
      )}
    </>
  );
};

export default CustomImageViewer;
