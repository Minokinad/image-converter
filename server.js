require("dotenv").config();
const express = require("express");
const { sequelize } = require("./models");
const imageRoutes = require("./routes/imageRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use("/api/images", imageRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Image Converter API with PostgreSQL & Sequelize is active",
    endpoints: "/api/images",
  });
});

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Маршрут ${req.originalUrl} не найден на сервере`,
  });
});

app.use((err, req, res, next) => {
  console.error("Глобальная ошибка сервера:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Внутренняя ошибка сервера",
  });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Соединение с базой данных PostgreSQL успешно установлено.");

    app.listen(PORT, () => {
      console.log(
        `Сервер запущен и ожидает запросы на http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error("Не удалось подключиться к базе данных:", error);
    process.exit(1);
  }
}

startServer();
