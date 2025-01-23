require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const userRoutes = require("./api/routes/user");
const today_matchesRoutes = require("./api/routes/today_matches");
const scrapeTodayMatches = require("./scrape");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
// Routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});
app.use("/api/users", userRoutes);
app.use("/api/today_matches", today_matchesRoutes);
// API Documentation Route
app.get("/", (req, res) => {
  const documentation = {
    message: "Welcome to the TV API",
    endpoints: [
      {
        method: "POST",
        path: "/api/users/signup",
        description: "Create new user",
        body: {
          username: "string",
          email: "string",
          password: "string",
          phone: "string",
        },
      },
      {
        method: "POST",
        path: "/api/users/login",
        description: "User login",
        body: {
          email: "string",
          password: "string",
        },
      },
      {
        method: "DELETE",
        path: "/api/users/delete",
        description: "Delete user account",
        headers: {
          Authorization: "Bearer <token>",
        },
      },
      {
        method: "GET",
        path: "/api/today_matches",
        description: "Get today's matches",
      },
    ],
    note: "All other endpoints will redirect here",
  };
  res.json(documentation);
});
// Return documentation with 404 status
app.use((req, res) => {
  if (req.accepts("html")) {
    res.redirect("/");
  } else {
    res.status(404).json({
      error: "Endpoint not found",

      availableEndpoints: [
        "/api/users/signup",
        "/api/users/login",
        "/api/today_matches",
      ],
    });
  }
});
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

// Database connection
const db = require("./api/config/db");
db.initializeDatabase();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
// scrapeTodayMatches();
setInterval(scrapeTodayMatches, 43200000); // Scrape every 12 hours
  console.log(`Server running on port ${PORT}`);
});
