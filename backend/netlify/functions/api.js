const serverless = require('serverless-http');
const app = require('../../server'); // Path to the exported express app

// Wrap the Express app. We set basePath to match the redirect in netlify.toml
module.exports.handler = serverless(app, {
  basePath: '/.netlify/functions/api/api'
});
