import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import apiClient from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";

const API_URL =
  apiClient.defaults.baseURL?.replace("/api", "") ||
  "http://5.16.255.254:4000/";

const AnnouncementCarousel = () => {
  const { isAuthenticated } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showModal, setShowModal] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState({});
  const [isClosing, setIsClosing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // useEffect(() => {
  //   const fetchAnnouncements = async () => {
  //     try {
  //       const response = await apiClient.get("/api/announcements/");

  //       setAnnouncements(response.data);

  //       response.data.forEach((announcement, index) => {
  //         if (announcement.image) {
  //           loadImage(announcement.image, index);
  //         }
  //       });
  //     } catch (error) {
  //       console.error("Error fetching announcements:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchAnnouncements();
  // }, [isAuthenticated]);
  useEffect(() => {
    // Only fetch announcements if user is authenticated
    if (isAuthenticated) {
      const fetchAnnouncements = async () => {
        try {
          const response = await apiClient.get("/api/announcements/");

          setAnnouncements(response.data);

          response.data.forEach((announcement, index) => {
            if (announcement.image) {
              loadImage(announcement.image, index);
            }
          });
        } catch (error) {
          console.error("Error fetching announcements:", error);
          // Optionally set announcements to empty array if fetch fails
          setAnnouncements([]);
        } finally {
          setLoading(false);
        }
      };

      fetchAnnouncements();
    } else {
      // If not authenticated, set loading to false and announcements to empty
      setAnnouncements([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setIsOpen(false);
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
    }, 300);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";

    try {
      if (imagePath.startsWith("http")) return imagePath;
      const cleanPath = imagePath.replace(/^\/+/, "").replace(/^media\//, "");
      const fullUrl = `${API_URL}/media/${cleanPath}`;

      return fullUrl;
    } catch (error) {
      console.error("Error constructing image URL:", error);
      return "";
    }
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  };

  const loadImage = async (imagePath, index) => {
    if (!imagePath) {
      console.log("No image path provided for index:", index);
      return;
    }

    const imageUrl = getImageUrl(imagePath);

    if (!isValidUrl(imageUrl)) {
      console.error("Invalid URL constructed:", imageUrl);
      setImageUrls((prev) => ({
        ...prev,
        [index]: null,
      }));
      return;
    }

    try {
      const img = new Image();

      const imageLoadPromise = new Promise((resolve, reject) => {
        img.onload = () => {
          resolve(img);
        };
        img.onerror = (e) => {
          console.error("Image load error:", e);
          reject(new Error(`Image failed to load: ${imageUrl}`));
        };
      });

      img.src = imageUrl;

      await imageLoadPromise;

      setImageUrls((prev) => ({
        ...prev,
        [index]: imageUrl,
      }));
    } catch (error) {
      console.error("Error loading image:", error);
      setImageUrls((prev) => ({
        ...prev,
        [index]: null,
      }));
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (announcements.length > 1) {
        setActiveIndex((current) =>
          current === announcements.length - 1 ? 0 : current + 1
        );
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [announcements.length]);

  const nextSlide = () => {
    setActiveIndex((current) =>
      current === announcements.length - 1 ? 0 : current + 1
    );
  };

  const prevSlide = () => {
    setActiveIndex((current) =>
      current === 0 ? announcements.length - 1 : current - 1
    );
  };

  if (!showModal || loading || announcements.length === 0) return null;

  return (
    <div
      className={`fixed inset-0 flex items-start justify-center z-[1000] p-4 overflow-y-auto pt-8
        transition-all duration-300 ease-in-out
        ${isClosing ? "bg-black/0" : "bg-black/50"}`}
      onClick={handleOverlayClick}
    >
      <div
        className={`bg-neutral-700 w-full max-w-lg rounded-lg shadow-lg overflow-hidden relative
          transition-all duration-300 ease-in-out transform
          ${
            isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
          }
          ${isClosing ? "-translate-y-full opacity-0" : ""}`}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-50 text-white bg-black/30 hover:bg-black/50 rounded-full p-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="relative h-[90vh] max-h-[550px]">
          <div className="h-full">
            {announcements.map((announcement, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-500 ease-in-out
                  ${
                    index === activeIndex
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                  }`}
              >
                {announcement.image && (
                  <div className="h-[250px] md:h-[300px] bg-neutral-800">
                    {imageUrls[index] ? (
                      <img
                        src={imageUrls[index]}
                        alt={announcement.header}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.error("Image render error:", e);
                          e.target.src = "/placeholder-image.png";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={`p-6 text-white ${
                    !announcement.image ? "h-full" : ""
                  }`}
                >
                  <h4 className="text-xl font-bold mb-2">
                    {announcement.header}
                  </h4>
                  <p className="font-bold mb-1">{announcement.message_title}</p>
                  <p className="text-sm mb-2">{announcement.message_date}</p>
                  <hr className="border-white/20 my-2" />
                  <p className="text-base">{announcement.message}</p>
                </div>
              </div>
            ))}
          </div>

          {announcements.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {announcements.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {announcements.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors
                    ${index === activeIndex ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementCarousel;
