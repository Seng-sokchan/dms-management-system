const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const apiRoutes = require("./routes");
const { notFound } = require("./middleware/notFound");
const { responsePolicy } = require("./middleware/responsePolicy");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// Behind Caddy/reverse proxy so express-rate-limit can use X-Forwarded-For safely.
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 1));

function parseCorsOrigins() {
  const origins = new Set();
  for (const key of ["FRONTEND_URL", "MOBILE_URL"]) {
    const raw = String(process.env[key] || "").trim();
    if (!raw) continue;
    try {
      origins.add(new URL(raw).origin);
    } catch {
      // ignore invalid URL
    }
  }
  return [...origins];
}

const corsOrigins = parseCorsOrigins();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Non-browser clients (curl, mobile native, server-to-server) often omit Origin.
      if (!origin) {
        callback(null, true);
        return;
      }
      if (corsOrigins.length === 0) {
        callback(null, process.env.NODE_ENV !== "production");
        return;
      }
      callback(null, corsOrigins.includes(origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(morgan("dev"));
app.use(responsePolicy);

app.use("/v1", apiRoutes);
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
