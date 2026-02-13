// backend/server.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./data/conn");

const mobileRoutes = require("./routes/router");
const accessoryRoutes = require("./routes/accessoryRoutes");
const soldMobileRoutes = require("./routes/soldMobileRoutes");
const soldAccessoryRoutes = require("./routes/soldAccessoryRoutes");

dotenv.config();

const app = express();

// ----------------------
// Middleware
// ----------------------
app.use(cors());
app.use(express.json());

// ----------------------
// API Routes
// ----------------------
app.use("/api/mobiles", mobileRoutes);
app.use("/api/accessories", accessoryRoutes);
app.use("/api/soldmobiles", soldMobileRoutes);
app.use("/api/soldaccessories", soldAccessoryRoutes);

// ----------------------
// Health Check
// ----------------------
app.get("/api/health", (req, res) => {
  res.json({ message: "Mobile Inventory API Running" });
});

// ----------------------
// Serve Frontend (Vite build)
// ----------------------
const frontendPath = path.join(__dirname, "../frontend/dist");

// Serve static files
app.use(express.static(frontendPath));

// For any route NOT starting with /api,
// send back React index.html
app.get("*", (req, res, next) => {
  if (req.originalUrl.startsWith("/api")) {
    return next(); // skip API routes
  }
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ----------------------
// 404 for unknown API routes
// ----------------------
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ----------------------
// Global Error Handler
// ----------------------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// ----------------------
// Start Server
// ----------------------
const PORT = process.env.PORT || 8080;

connectDB(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });

module.exports = app;
