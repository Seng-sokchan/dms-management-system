/** Shared Socket.IO instance for emitting payment events from webhook handlers. */
let ioInstance = null;

function setIo(io) {
  ioInstance = io;
}

function getIo() {
  return ioInstance;
}

module.exports = { setIo, getIo };
