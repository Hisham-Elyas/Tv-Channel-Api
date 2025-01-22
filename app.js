require("dotenv").config();
const express = require("express");
const cors = require("cors");
const userRoutes = require("./api/routes/user");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
// API Documentation Route
app.get("/", (req, res) => {
  const documentation = {
    message: "Welcome to the Authentication API",
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

      availableEndpoints: ["/api/users/signup", "/api/users/login"],
    });
  }
});

// Database connection
const db = require("./api/config/db");
db.initializeDatabase();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
