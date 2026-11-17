require("dotenv").config();
const http = require("node:http");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("./middlewares/cors");
const { sequelize } = require("./models");
const imageRoutes = require("./routes/imageRoutes");
const authRoutes = require("./routes/authRoutes");
const presetRoutes = require("./routes/presetRoutes");
const attachNotifications = require("./realtime/notifications");

const app = express();
const server = http.createServer(app);
app.locals.publishTaskEvent = attachNotifications(server);
const PORT = process.env.PORT || 3000;

app.use(cors);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/presets", presetRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Image Converter & Editor API with JWT Auth is running",
    authEndpoints: "/auth/register, /auth/login, /auth/profile",
    imageEndpoints: "/api/images",
    presetEndpoints: "/api/presets",
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
    if (!process.env.MONGO_URI) throw new Error("Укажите MONGO_URI в файле .env");
    await sequelize.authenticate();
    console.log("Соединение с базой данных PostgreSQL успешно установлено.");
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("Соединение с базой данных MongoDB успешно установлено.");

    server.listen(PORT, () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Ошибка запуска сервера:", error.message);
    process.exit(1);
  }
}

startServer();
