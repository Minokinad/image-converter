const express = require("express");
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
    message: "Image Converter & Editor API is running",
    docs: "/api/images",
  });
});

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Маршрут ${req.originalUrl} не существует на сервере`,
  });
});

app.use((err, req, res, next) => {
  console.error("Глобальная ошибка сервера:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Внутренняя ошибка сервера",
  });
});

app.listen(PORT, () => {
  console.log(`Сервер успешно запущен на порту http://localhost:${PORT}`);
});
