require("dotenv").config();
const express = require("express");
const { sequelize } = require("./models");
const imageRoutes = require("./routes/imageRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use("/auth", authRoutes);
app.use("/api/images", imageRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Image Converter & Editor API with JWT Auth is running",
    authEndpoints: "/auth/register, /auth/login, /auth/profile",
    imageEndpoints: "/api/images",
  });
});

app.use((req, res, next) => {
  res
    .status(404)
    .json({ success: false, error: `Маршрут ${req.originalUrl} не найден` });
});

app.use((err, req, res, next) => {
  console.error("Глобальная ошибка:", err);
  res
    .status(err.status || 500)
    .json({
      success: false,
      error: err.message || "Внутренняя ошибка сервера",
    });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Соединение с базой данных PostgreSQL успешно установлено.");

    app.listen(PORT, () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Ошибка подключения к БД:", error);
    process.exit(1);
  }
}

startServer();
