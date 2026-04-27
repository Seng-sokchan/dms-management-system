const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const apiRoutes = require("./routes");
const { notFound } = require("./middleware/notFound");
const { responsePolicy } = require("./middleware/responsePolicy");
const { errorHandler } = require("./middleware/errorHandler");
const { activityLogger } = require("./middleware/activityLogger");
const { apiRateLimit } = require("./middleware/rateLimit");

function getAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function createApp() {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.use(cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin not allowed"));
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  }));
  app.use(helmet());
  app.use(express.json());
  app.use(morgan("dev"));
  app.use(responsePolicy);
  app.use(activityLogger);

  app.use("/api", apiRateLimit, apiRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
