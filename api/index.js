// Vercel serverless entry — re-exports Express app from BACKEND/serve.js
// Allows Vercel to handle all routes (/ , /api/solicitudes, etc.) via a single function
const app = require("../BACKEND/serve.js");

module.exports = (req, res) => app(req, res);
