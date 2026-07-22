require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const initDatabase = require("./db/init");
const seedAdminIfNeeded = require("./db/seedAdmin");
const routes = require("./routes");
const swaggerSpec = require("./config/swagger");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiters");

const app = express();
const PORT = process.env.PORT || 5000;

// Required when deployed behind nginx / load balancer so rate limits use the real client IP.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Log unhandled errors — do NOT let the server silently crash
process.on("unhandledRejection", (reason) => {
  console.error("[FATAL] Unhandled promise rejection:");
  console.error(reason);
});

process.on("uncaughtException", (error) => {
  console.error("[FATAL] Uncaught exception:");
  console.error(error);
});

app.use(requestLogger);

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (
        process.env.NODE_ENV !== "production" &&
        /^http:\/\/localhost:\d+$/.test(origin)
      ) {
        return callback(null, origin);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, origin);
      }

      // Never pass Error here — it crashes the entire server
      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// General API limit — applies in all environments; OPTIONS preflight is excluded.
app.use(apiLimiter);

// Dynamic API data must not be cached — stale 304 responses hid tasks/projects on detail pages
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  next();
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

async function startServer() {
  if (!process.env.JWT_SECRET) {
    console.error("[STARTUP] JWT_SECRET is required in .env");
    process.exit(1);
  }

  try {
    console.log("[STARTUP] Connecting to PostgreSQL...");
    await initDatabase();
    await seedAdminIfNeeded();

    const server = app.listen(PORT, () => {
      console.log("-------------------------------------------");
      console.log(`[STARTUP] Server running on port ${PORT}`);
      console.log(`[STARTUP] API base: http://localhost:${PORT}/api`);
      console.log(`[STARTUP] Swagger:  http://localhost:${PORT}/api/docs`);
      console.log(`[STARTUP] CORS allowed: localhost (dev) + ${allowedOrigins.join(", ")}`);
      console.log("-------------------------------------------");
      console.log("[READY] Waiting for requests... (Ctrl+C to stop)");
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`[STARTUP] Port ${PORT} is already in use. Kill the other process or change PORT in .env`);
      } else {
        console.error("[STARTUP] Server error:", error.message);
      }
      process.exit(1);
    });
  } catch (error) {
    const detail =
      error.message ||
      error.code ||
      (Array.isArray(error.errors) && error.errors.map((e) => e.message).join("; ")) ||
      String(error);
    console.error("[STARTUP] Failed to start server:", detail);
    if (error.code === "ECONNREFUSED") {
      console.error(
        `[STARTUP] Cannot reach PostgreSQL at ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 5432}. Start Postgres or fix DB_HOST/DB_PORT in .env.`
      );
    }
    process.exit(1);
  }
}

startServer();
