const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '⚠️ غير مصرح لك، لا يوجد توكن!' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({ message: '⚠️ غير مصرح لك، التوكن غير صالح أو انتهى!' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.userRole && (req.userRole === 'admin' || req.userRole === 'manager')) {
    return next();
  }
  return res.status(403).json({ message: '🚫 صلاحيات مرفوضة، هذا الإجراء للمسؤولين فقط!' });
};

module.exports = { protect, adminOnly };