// Catches 404s for unmatched routes
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Centralized error handler - every thrown/passed error ends up here
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose bad ObjectId (e.g. a malformed :id in the URL)
  if (err.name === 'CastError' && err.kind === 'ObjectId' && err.path === '_id') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (err.name === 'CastError') {
    // Any other bad field cast (e.g. an invalid date/number sent for a
    // field) — a client-side data problem, not a server crash.
    statusCode = 400;
    message = `Invalid value for field "${err.path}"`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} "${err.keyValue[field]}" already exists`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };