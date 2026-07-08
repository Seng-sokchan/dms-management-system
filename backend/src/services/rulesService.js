const {
  isKnownRole,
  isKnownStatus,
  getRoleNames,
  getStatusNames,
  getTransitionsMap,
  refreshRulesCache,
} = require("./rulesCache");
const { listRoles } = require("../repositories/roles");

async function getRoles() {
  return listRoles();
}

module.exports = {
  getRoles,
  isKnownRole,
  isKnownStatus,
  getRoleNames,
  getStatusNames,
  getTransitionsMap,
  refreshRulesCache,
};
