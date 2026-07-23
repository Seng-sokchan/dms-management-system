const { canSubscribeSocket } = require("../constants/roleAccessRules");
const { getIo } = require("./ioRegistry");

const ROOM_PREFIX = "special-day:";

function specialDayRoom(specialDayId) {
  return `${ROOM_PREFIX}${specialDayId}`;
}

function attachSpecialDayHandlers(_io, socket) {
  const { user } = socket.data;

  socket.on("subscribe:special-day", (payload, ack) => {
    if (!canSubscribeSocket(user.role, "special-day-watcher")) {
      if (typeof ack === "function") ack({ ok: false, error: "Forbidden" });
      return;
    }
    const specialDayId = String(payload?.specialDayId || "").trim();
    if (!specialDayId) {
      if (typeof ack === "function") ack({ ok: false, error: "Missing specialDayId" });
      return;
    }
    socket.join(specialDayRoom(specialDayId));
    if (typeof ack === "function") ack({ ok: true, specialDayId });
  });

  socket.on("unsubscribe:special-day", (payload, ack) => {
    const specialDayId = String(payload?.specialDayId || "").trim();
    if (specialDayId) {
      socket.leave(specialDayRoom(specialDayId));
    }
    if (typeof ack === "function") ack({ ok: true });
  });
}

function emitSpecialDayEvent(specialDayId, eventName, payload) {
  const io = getIo();
  if (!io) return;
  io.to(specialDayRoom(specialDayId)).emit(eventName, {
    specialDayId: String(specialDayId),
    ...payload,
  });
}

module.exports = {
  attachSpecialDayHandlers,
  emitSpecialDayEvent,
  specialDayRoom,
};
