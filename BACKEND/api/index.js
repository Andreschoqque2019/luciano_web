// Vercel serverless entry when deploying BACKEND as standalone project
const app = require("../serve.js");

module.exports = (req, res) => app(req, res);
