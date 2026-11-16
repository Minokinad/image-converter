module.exports = (
  process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173,http://localhost:5173"
).split(",").map((origin) => origin.trim());
