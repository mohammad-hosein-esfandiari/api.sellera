const app = require('./src/app'); 
const path = require("path");
const express = require('express');


// Importing the Express application instance
const port = process.env.PORT || 3000; // Setting the port from environment variables or defaulting to 3000

app.use('/public', express.static(path.join(__dirname, 'public')));


// Starting the server and listening for incoming requests on the specified port
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`); 
});
