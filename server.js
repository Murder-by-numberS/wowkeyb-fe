// server.js
const express = require('express');
const app = express();
const path = require('path');
// Run the app by serving the static files
// in the dist directory
app.use(express.static(`${__dirname}/dist/fuse/`));

// Nice and done!
app.get('/backend', (req, res) => {
  res.send({ url: process.env.BE_API });
});


// For all GET requests, send back index.html
// so that PathLocationStrategy can be used
app.get('/*', (req, res) => {
  res.sendFile(path.join(`${__dirname}/dist/fuse/index.html`));
});

// Start the app by listening on the default
app.listen(process.env.PORT || 8080);
