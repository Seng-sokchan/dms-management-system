const {
  listProvinces: listProvincesDb,
  createProvince: createProvinceDb,
  updateProvince: updateProvinceDb,
  deleteProvince: deleteProvinceDb,
} = require("../repositories");
const { NotFoundError } = require("../errors");

async function listProvinces() {
  return listProvincesDb();
}

async function createProvince(payload) {
  return createProvinceDb(payload);
}

async function updateProvince(provinceId, payload) {
  const row = await updateProvinceDb(provinceId, payload);
  if (!row) throw new NotFoundError("Province not found");
  return row;
}

async function deleteProvince(provinceId) {
  const deleted = await deleteProvinceDb(provinceId);
  if (!deleted) throw new NotFoundError("Province not found");
}

module.exports = {
  listProvinces,
  createProvince,
  updateProvince,
  deleteProvince,
};
