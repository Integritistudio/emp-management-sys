const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    const status = res.statusCode;
    const level = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "INFO";

    console.log(
      `[${timestamp}] ${level} ${req.method} ${req.originalUrl} → ${status} (${duration}ms)`
    );
  });

  next();
};

module.exports = requestLogger;
