// backend/server.js
<<<<<<< HEAD
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
=======

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

>>>>>>> 8c93e3b9f1bdd4cbb096647dc86598597feff1cd
const connectDB = require("./data/conn");

const mobileRoutes = require("./routes/router");
const accessoryRoutes = require("./routes/accessoryRoutes");
const soldMobileRoutes = require("./routes/soldMobileRoutes");
<<<<<<< HEAD
const soldAccessoryRoutes = require("./routes/soldAccessoryRoutes"); // <-- make sure file name matches
=======
const soldAccessoryRoutes = require("./routes/soldAccessoryRoutes");
>>>>>>> 8c93e3b9f1bdd4cbb096647dc86598597feff1cd

dotenv.config();

const app = express();

<<<<<<< HEAD
app.use(cors());
app.use(express.json());

// API routes
=======
// ----------------------
// Middleware
// ----------------------
app.use(cors());
app.use(express.json());

// ----------------------
// API Routes
// ----------------------
>>>>>>> 8c93e3b9f1bdd4cbb096647dc86598597feff1cd
app.use("/api/mobiles", mobileRoutes);
app.use("/api/accessories", accessoryRoutes);
app.use("/api/soldmobiles", soldMobileRoutes);
app.use("/api/soldaccessories", soldAccessoryRoutes);

<<<<<<< HEAD
// Health check
app.get("/", (req, res) => {
  res.json({ message: "Mobile Inventory API Running" });
});

// 404 for unknown routes
=======
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
>>>>>>> 8c93e3b9f1bdd4cbb096647dc86598597feff1cd
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

<<<<<<< HEAD
// Global error handler (optional but useful)
=======
// ----------------------
// Global Error Handler
// ----------------------
>>>>>>> 8c93e3b9f1bdd4cbb096647dc86598597feff1cd
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

<<<<<<< HEAD
const PORT = process.env.PORT || 5000;
=======
// ----------------------
// Start Server
// ----------------------
const PORT = process.env.PORT || 8080;
>>>>>>> 8c93e3b9f1bdd4cbb096647dc86598597feff1cd

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
