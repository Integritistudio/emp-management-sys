const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const route = `${req.method} ${req.originalUrl}`;

  console.error(`[${timestamp}] ERROR ${route}`);
  console.error(`  Message: ${err.message}`);
  if (process.env.NODE_ENV === "development" && err.stack) {
    console.error(`  Stack: ${err.stack}`);
  }

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
