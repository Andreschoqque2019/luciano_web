// Vercel serverless handler for /api/solicitudes
// Reuses the same Express app — keeps logic in BACKEND/routes/solicitudes.js
const app = require("../BACKEND/serve.js");

module.exports = (req, res) => app(req, res);
