const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Доступ запрещен. Заголовок авторизации отсутствует",
      });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        error: "Неверный формат токена. Ожидается: Bearer <token>",
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "super_secret_image_converter_jwt_key_2026",
    );

    req.user = decoded; // { id, email, role, iat, exp }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Недействительный или истекший токен авторизации",
    });
  }
};
