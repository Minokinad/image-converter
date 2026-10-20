const authMiddleware = (req, res, next) => {
  const isAuthQuery = req.query.auth === '1';

  if (isAuthQuery) {
    req.user = {
      name: 'Администратор',
      role: 'admin',
      isAuth: true
    };
  } else {
    req.user = {
      name: 'Гость',
      role: 'guest',
      isAuth: false
    };
  }

  res.locals.user = req.user;
  res.locals.authQuery = req.user.isAuth ? '?auth=1' : '';
  res.locals.currentPath = req.path;

  next();
};

module.exports = authMiddleware;