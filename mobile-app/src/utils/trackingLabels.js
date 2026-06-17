export function getSocketStatusLabel(socketState, t) {
  switch (socketState) {
    case "connected":
      return t("tracking.live");
    case "idle":
      return t("tracking.socketIdle");
    case "disconnected":
      return t("tracking.socketDisconnected");
    case "error":
      return t("tracking.socketError");
    default:
      return socketState;
  }
}
