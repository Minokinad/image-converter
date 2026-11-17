const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config/jwt");
const origins = require("../config/clientOrigins");

const queue = "conversion-queue";

function attachNotifications(server) {
  const io = new Server(server, {
    cors: { origin: origins },
    allowRequest: (request, callback) => {
      const origin = request.headers.origin;
      callback(null, !origin || origins.includes(origin));
    },
    maxHttpBufferSize: 4096,
  });

  io.use((socket, next) => {
    try {
      const user = jwt.verify(socket.handshake.auth.token, JWT_SECRET);
      socket.data.expiresAt = user.exp * 1000;
      next();
    } catch {
      next(Object.assign(new Error("Требуется вход в аккаунт."), {
        data: { code: "UNAUTHORIZED" },
      }));
    }
  });

  const participantCount = () => io.sockets.adapter.rooms.get(queue)?.size ?? 0;
  const presence = (action) => ({
    action,
    count: participantCount(),
    at: new Date().toISOString(),
  });

  io.on("connection", (socket) => {
    let watching = false;
    const expiry = setTimeout(() => socket.disconnect(true), socket.data.expiresAt - Date.now());

    socket.on("queue:watch", (acknowledge) => {
      if (typeof acknowledge !== "function") return;
      if (!watching) {
        socket.join(queue);
        watching = true;
        socket.to(queue).emit("queue:presence", presence("joined"));
      }
      acknowledge({ count: participantCount() });
    });

    socket.on("disconnect", () => {
      clearTimeout(expiry);
      if (watching) io.to(queue).emit("queue:presence", presence("disconnected"));
    });
  });

  return (action, image) => {
    io.to(queue).emit("task:changed", {
      action,
      id: image.id,
      filename: image.filename,
      format: image.targetFormat,
      status: image.status,
      at: new Date().toISOString(),
    });
  };
}

module.exports = attachNotifications;
