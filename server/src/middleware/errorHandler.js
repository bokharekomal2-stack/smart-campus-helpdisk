import multer from 'multer';

/**
 * Global 404 handler for API routes
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Global centralized error handler
 */
export const globalErrorHandler = (err, req, res, next) => {
  // Handle Multer upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Uploaded file exceeds the maximum allowed size limit.',
      });
    }
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`,
    });
  }

  // Handle custom validation or input errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred.';

  if (statusCode === 500) {
    console.error('[SERVER ERROR]', err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && statusCode === 500 ? { stack: err.stack } : {}),
  });
};
