// middleware/errorMiddleware.js
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
  };
  
 // middleware/errorMiddleware.js
const errorHandler = (err, req, res, next) => {
  // Log full error details for debugging
  console.error('Error Details:', {
    message: err.message,
    stack: err.stack,
    body: req.body,
    method: req.method,
    url: req.originalUrl
  });

  // Determine status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
  
  module.exports = {
    notFound,
    errorHandler
  };