const logger = require('../config/logger');

/**
 * Custom error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle async errors
 * @param {Function} fn - Async function
 * @returns {Function}
 */
function catchAsync(fn) {
  return (...args) => fn(...args).catch(args[args.length - 1]);
}

/**
 * Global error handler
 * @param {Error} error - Error object
 * @returns {Object} - Error response
 */
function handleError(error) {
  logger.error('Error:', {
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode
  });

  if (error.isOperational) {
    return {
      status: 'error',
      message: error.message,
      statusCode: error.statusCode
    };
  }

  return {
    status: 'error',
    message: 'An unexpected error occurred',
    statusCode: 500
  };
}

module.exports = {
  AppError,
  catchAsync,
  handleError
};
