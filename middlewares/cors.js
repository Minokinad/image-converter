const origins = (process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

module.exports = (req, res, next) => {
  res.vary("Origin");
  if (origins.includes(req.headers.origin)) {
    res.set("Access-Control-Allow-Origin", req.headers.origin);
    res.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
};
