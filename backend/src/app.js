const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const apiRoutes = require("./routes");
const { notFound } = require("./middleware/notFound");
const { responsePolicy } = require("./middleware/responsePolicy");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, process.env.MOBILE_URL],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(morgan("dev"));
app.use(responsePolicy);

// Keep legacy '/api' routes and expose versioned '/api/v1' routes.
app.use("/api", apiRoutes);
app.use("/api/v1", apiRoutes);
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
