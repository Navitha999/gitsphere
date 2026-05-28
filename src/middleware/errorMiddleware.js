/**
 * Centralized error handling middleware.
 * Ensures the API always returns a consistent, clean JSON structure on failures.
 */
export const errorHandler = (err, req, res, next) => {
  // Log the complete stack trace for internal debugging
  console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.url}:`);
  console.error(err.stack || err);

  const statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // 1. Database Connection and SQL Errors mapping
  if (err.code) {
    if (err.code === 'ECONNREFUSED') {
      message = 'Database connection refused. Please ensure your MySQL instance is running and reachable.';
      return res.status(503).json({ success: false, message });
    }
    if (err.code === 'ER_BAD_DB_ERROR') {
      message = 'Target database does not exist. Please check your DB_NAME setting.';
      return res.status(500).json({ success: false, message });
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      message = 'Database access denied. Please check your DB_USER and DB_PASSWORD configurations.';
      return res.status(401).json({ success: false, message });
    }
    if (err.code === 'ER_NO_SUCH_TABLE') {
      message = 'Required database table not found. Auto-initialization may have failed or tables were deleted.';
      return res.status(500).json({ success: false, message });
    }
  }

  // 2. Handle JWT or auth related errors if present
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ success: false, message: 'Invalid or missing authentication token' });
  }

  // 3. Send standard structured error response
  res.status(statusCode).json({
    success: false,
    message: message
  });
};

/**
 * Middleware to handle unmatched (404) API routes.
 */
export const routeNotFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Requested route not found: ${req.method} ${req.originalUrl}`
  });
};
