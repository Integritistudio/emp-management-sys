const rateLimit = require("express-rate-limit");

const RATE_LIMIT_MESSAGE = {
  message: "Too many requests, please try again later.",
};

// CORS preflight OPTIONS requests are not real API usage — do not count them.
const skipPreflight = (req) => req.method === "OPTIONS";

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
  message: RATE_LIMIT_MESSAGE,
});

// Brute-force protection on login only — keep this strict in every environment.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    message: "Too many login attempts, please try again later.",
  },
});

module.exports = {
  apiLimiter,
  loginLimiter,
};
