function errorHandler(err, req, res, next) {
  console.error('[Error]', err.stack || err);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
}

function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `API Route Not Found - ${req.originalUrl}`,
  });
}

module.exports = {
  errorHandler,
  notFound,
};
