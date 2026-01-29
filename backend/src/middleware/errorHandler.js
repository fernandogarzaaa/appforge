/**
 * Global Error Handler Middleware
 * Catches all errors and formats them consistently
 */

const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error
  console.error(`[ERROR] ${status} - ${message}`, {
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Validation errors (Joi or custom validation)
  if (err.details && Array.isArray(err.details)) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details.map(d => ({
        field: d.path?.join?.('.') || d.field || 'unknown',
        message: d.message,
        type: d.type
      })),
      timestamp: new Date().toISOString()
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid Token',
      message: 'The provided token is invalid or expired',
      timestamp: new Date().toISOString()
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      error: 'Validation Error',
      details: errors,
      timestamp: new Date().toISOString()
    });
  }

  // Mongoose cast errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID',
      message: `Invalid ${err.path}: ${err.value}`,
      timestamp: new Date().toISOString()
    });
  }

  // Duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: `${field} already exists`,
      timestamp: new Date().toISOString()
    });
  }

  // Custom API errors
  res.status(status).json({
    error: err.name || 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
};

export default errorHandler;
