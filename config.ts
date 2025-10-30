// config.ts
// For development: use localhost for web/simulator, IP for physical device
const isDev = __DEV__;
const isWeb = typeof window !== "undefined";

export const API_URL = isDev
  ? isWeb
    ? "http://localhost:5000"
    : "http://172.16.2.8:5000"
  : "http://localhost:5000"; // Replace with production URL

export const API_BASE_URL = `${API_URL}/api`;
