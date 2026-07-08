const errorHandler = (err, req, res, next) => {
  console.error(`💥 Error Logged: ${err.message}`);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    message: err.message || 'خطأ داخلي في السيرفر',
    // بنظهر الـ stack فقط في مرحلة التطوير ومش في الـ Production
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;