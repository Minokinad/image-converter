const origins = require("../config/clientOrigins");

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
