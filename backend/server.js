// backend/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./data/conn");

const mobileRoutes = require("./routes/router");
const accessoryRoutes = require("./routes/accessoryRoutes");
const soldMobileRoutes = require("./routes/soldMobileRoutes");
const soldAccessoryRoutes = require("./routes/soldAccessoryRoutes"); // <-- make sure file name matches

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/mobiles", mobileRoutes);
app.use("/api/accessories", accessoryRoutes);
app.use("/api/soldmobiles", soldMobileRoutes);
app.use("/api/soldaccessories", soldAccessoryRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Mobile Inventory API Running" });
});

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler (optional but useful)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

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
