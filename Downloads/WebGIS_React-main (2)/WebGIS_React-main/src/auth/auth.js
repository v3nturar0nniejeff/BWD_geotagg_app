// src/auth.js
// import axios from "axios";

// const API_URL = "http://5.16.255.254:4000/api/auth/login/";

// export const login = async (username, password) => {
//   try {
//     const response = await axios.post(API_URL, {
//       username,
//       password,
//     });

//     // Store the token in localStorage or sessionStorage
//     // localStorage.setItem("token", token);
//     // console.log("Login successful:", token);
//     // Store tokens
//     localStorage.setItem("access_token", response.data.access_token);
//     localStorage.setItem("refresh_token", response.data.refresh_token);

//     return response.data;
//   } catch (error) {
//     console.error("Login failed:", error);
//     throw new Error("Invalid credentials");
//   }
// };

import axios from "axios";
const API_URL = "http://5.16.255.254:4000/api/auth/login/";

export const login = async (username, password) => {
  try {
    const response = await axios.post(API_URL, {
      username,
      password,
    });

    // Store tokens
    localStorage.setItem("access_token", response.data.access_token);
    localStorage.setItem("refresh_token", response.data.refresh_token);

    return response.data;
  } catch (error) {
    console.error("Login failed:", error);
    throw new Error("Invalid credentials");
  }
};
