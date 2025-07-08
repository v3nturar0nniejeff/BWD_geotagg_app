import React from "react";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../assets/images/bwdlogo.png";

const AccessDenied = ({
  image = logo, // Set default image to logo
  imageAlt = "Access Denied",
  title = "Access Denied",
  message = "Oops! You need to be authenticated to access this page.",
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      {/* Image Container */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <img src={image} alt={imageAlt} className="w-48 h-48 object-contain" />
      </div>

      {/* White Box */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <Lock className="text-red-600" size={48} strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{title}</h1>

        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex justify-center">
          <Link
            to="/"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition duration-300"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
