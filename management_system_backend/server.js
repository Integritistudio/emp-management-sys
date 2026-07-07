require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const initDatabase = require("./db/init");
const routes = require("./routes");
const swaggerSpec = require("./config/swagger");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

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

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
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

app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

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
    console.error("[STARTUP] Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
