const { NEXT_STATUS, ORDER_STATUS } = require("../constants");

function getNextAllowedStatuses(currentStatus, orderedStatuses = ORDER_STATUS) {
  if (Array.isArray(orderedStatuses) && orderedStatuses.length > 1) {
    const currentIndex = orderedStatuses.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < orderedStatuses.length - 1) {
      return [orderedStatuses[currentIndex + 1]];
    }
    if (currentIndex === orderedStatuses.length - 1) {
      return [];
    }
  }
  return NEXT_STATUS[currentStatus] || [];
}

module.exports = {
  getNextAllowedStatuses,
};
