function makeId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  // MySQL DATETIME expects "YYYY-MM-DD HH:mm:ss" (no timezone suffix).
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

module.exports = {
  makeId,
  nowIso,
};
