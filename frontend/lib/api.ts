// Central API base URL
// In production: set NEXT_PUBLIC_API_URL in Vercel environment variables
// Example: https://your-backend.onrender.com
const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:5000";

export default API_BASE;
