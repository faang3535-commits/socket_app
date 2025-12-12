
// middleware/requestLogger.js

/**
 * Validates that the request has a specific header (just as an example)
 * or simply logs the request time.
 */
const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  // You can also modify the request object here, e.g.
  req.requestTime = new Date().toISOString();
  next(); // Pass control to the next middleware or controller
};  

module.exports = requestLogger;
