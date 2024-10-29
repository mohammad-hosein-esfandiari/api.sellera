const express = require("express");
const routes = require("./routes");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
require("dotenv").config();
const path = require("path");
const jsonContentMiddleware = require("./middlewares/jsonContentMiddleWare");
const checkBodySyntax = require("./middlewares/checkBodySyntax");

const app = express(); // Creating an instance of an Express application

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI) // Connecting to MongoDB using the URI from environment variables
  .then(() => console.log("MongoDB connected")) // Log success message on successful connection
  .catch((err) => console.error("MongoDB connection error:", err)); // Log error message on connection failure

// Setting up session store with MongoDB
const store = new MongoDBStore({
  uri: process.env.MONGODB_URI, // Using the environment variable for the MongoDB connection URI
  collection: "sessions", // Name of the collection where sessions will be stored
});

// Configuring session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Secret key for signing the session ID
    resave: false, // Prevents resaving session if it hasn't changed
    saveUninitialized: false, // Prevents saving new sessions that haven't been modified
    store: store, // Store sessions in MongoDB
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // Cookie expiration time set to one day
    },
  })
);

// CORS options configuration
const corsOptions = {
  origin: "http://127.0.0.1:5500", // Allowed origin for CORS
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers for requests
  credentials: true, // Allow credentials (cookies) to be sent with requests
};

// schedule for website payment for everyday (cron)
// startSubscriptionJob()

// Middleware for images in public folder
app.use("/images", express.static(path.join(__dirname, "public/images")));

// Using CORS middleware with the specified options
app.use(cors());

// Middleware for parsing JSON request bodies
app.use(express.json());

// Defining routes for the API
app.use("/api", routes); // Mounting the routes under '/api'

// check jsonj content
app.use(jsonContentMiddleware);

// Middleware to catch JSON parsing errors
app.use(checkBodySyntax);

// Exporting the app for use in other files (e.g., for starting the server)
module.exports = app;
