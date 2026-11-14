import axios from "axios";

// Render's free tier cold-starts the backend on the first request after it
// sleeps, which can take 60–120s (Express boot + MongoDB connect + SMTP send).
// We use a long timeout so the initial cold start has time to complete.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 150000, // 150s, comfortably covers Render's cold start

  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error),
);

// Cold-start retry: Render's free tier sleeps after inactivity. The very first
// request usually triggers a multi-second warm-up. If it fails due to a network
// error or timeout (no HTTP response received), retry ONCE without an auth/CSRF
// guard. NOTE: this relies on the backend's /auth/send-otp being idempotent so
// the retry does not send duplicate OTP emails.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // Only retry when the request never got a response (network error / timeout)
    // and we haven't already retried.
    const retriable =
      !response &&
      config &&
      config.method &&
      ["post", "put", "patch", "get", "delete"].includes(config.method.toLowerCase()) &&
      !config.__retried;

    if (retriable) {
      config.__retried = true;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return api(config);
    }

    return Promise.reject(error);
  },
);

export default api;
