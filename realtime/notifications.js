const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config/jwt");
const origins = require("../config/clientOrigins");

const formats = new Set(["all", "png", "jpeg", "webp", "avif"]);
const roomName = (format) => `tasks:${format}`;

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

  const participantCount = (room) => io.sockets.adapter.rooms.get(room)?.size ?? 0;

  function publishPresence(room, action) {
    io.to(room).emit("room:presence", {
      action,
      count: participantCount(room),
      at: new Date().toISOString(),
    });
  }

  io.on("connection", (socket) => {
    let room;
    const expiry = setTimeout(() => socket.disconnect(true), socket.data.expiresAt - Date.now());

    socket.on("room:join", (format, acknowledge) => {
      if (typeof acknowledge !== "function") return;
      if (!formats.has(format)) {
        acknowledge({ ok: false, error: "Неизвестная комната." });
        return;
      }

      const nextRoom = roomName(format);
      if (room !== nextRoom) {
        if (room) {
          socket.leave(room);
          publishPresence(room, "switched");
        }
        socket.join(nextRoom);
        room = nextRoom;
        socket.to(room).emit("room:presence", {
          action: "joined",
          count: participantCount(room),
          at: new Date().toISOString(),
        });
      }
      acknowledge({ ok: true, count: participantCount(room) });
    });

    socket.on("disconnect", () => {
      clearTimeout(expiry);
      if (room) publishPresence(room, "disconnected");
    });
  });

  return (action, image, previousFormat = image.targetFormat) => {
    // Include both affected format rooms if a task changes format.
    io.to([roomName("all"), roomName(image.targetFormat), roomName(previousFormat)])
      .emit("task:changed", {
        action,
        id: image.id,
        filename: image.filename,
        format: image.targetFormat,
        previousFormat,
        status: image.status,
        at: new Date().toISOString(),
      });
  };
}

module.exports = attachNotifications;
