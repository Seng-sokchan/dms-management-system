const {
  listAddresses: listAddressesDb,
  createAddress: createAddressDb,
  updateAddress: updateAddressDb,
  deleteAddress: deleteAddressDb,
} = require("../repositories");
const { ConflictError, NotFoundError } = require("../errors");

async function listAddresses() {
  return listAddressesDb();
}

async function createAddress(payload) {
  return createAddressDb(payload);
}

async function updateAddress(addressId, payload) {
  const row = await updateAddressDb(addressId, payload);
  if (!row) throw new NotFoundError("Address not found");
  return row;
}

async function deleteAddress(addressId) {
  let deleted = false;
  try {
    deleted = await deleteAddressDb(addressId);
  } catch (error) {
    if (error && (error.code === "ER_ROW_IS_REFERENCED_2" || error.errno === 1451)) {
      throw new ConflictError("Address is in use and cannot be deleted");
    }
    throw error;
  }
  if (!deleted) throw new NotFoundError("Address not found");
}

module.exports = {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};
