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

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") }));
app.use(express.json());
app.use(morgan("dev"));
app.use(responsePolicy);
app.use(activityLogger);

// Keep legacy '/api' routes and expose versioned '/api/v1' routes.
app.use("/api", apiRateLimit, apiRoutes);
app.use("/api/v1", apiRateLimit, apiRoutes);
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
