import React, { useState, useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import { useAuth } from "../auth/AuthContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const LoginForm = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      onClose();
      localStorage.setItem("loginSuccess", "pending");
      // Navigate to dashboard or home
      navigate("/");
    } catch (err) {
      setError("Login failed. Check your username and password.");
      toast.error("Login failed. Please check your credentials.");
    }
  };

  // Clear the form fields when the user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setUsername("");
      setPassword("");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isOpen) {
      // Automatically focus the input field when the modal is open
      inputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
      <div className="relative bg-[#2E3338] p-6 rounded-lg shadow-lg w-[450px] border border-solid border-gray-500">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-200"
          aria-label="Close modal"
        >
          <FaTimes className="text-xl" />
        </button>
        <h2 className="text-xl text-center mb-4 text-white">SIGN IN</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label
              className="block text-sm text-white font-medium mb-1"
              htmlFor="username"
            >
              Username
            </label>
            <input
              ref={inputRef}
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your username"
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-sm text-white font-medium mb-1"
              htmlFor="password"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full p-2 border rounded"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm mb-4 text-center">{error}</div>
          )}
          <div className="text-center text-white p-2 mb-2">
            No account? Please contact the GIS section.
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 w-full"
          >
            SIGN IN
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
