const { getPool } = require("../../database/pool");
const { getProvinceById } = require("../repositories");
const provinceCustomerPriority = require("../repositories/provinceCustomerPriority");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../errors");

function assertAdmin(user) {
  if (user?.role !== "Admin" && user?.role !== "Owner") {
    throw new ForbiddenError("Forbidden for this role");
  }
}

async function assertActiveProvince(provinceId) {
  const province = await getProvinceById(provinceId);
  if (!province) throw new NotFoundError("Province not found");
  return province;
}

async function getForProvince(user, provinceId) {
  assertAdmin(user);
  const province = await assertActiveProvince(provinceId);
  const customers = await provinceCustomerPriority.listOrderedCustomersForProvince(provinceId);
  return {
    provinceId: String(province.id),
    provinceName: province.name,
    customers,
  };
}

async function reorder(user, payload) {
  assertAdmin(user);
  const provinceId = payload.provinceId;
  const customerIds = (payload.customerIds || []).map((id) => String(id));
  const province = await assertActiveProvince(provinceId);

  const uniqueIds = new Set(customerIds);
  if (uniqueIds.size !== customerIds.length) {
    throw new BadRequestError("Duplicate customer ids in priority list");
  }

  const activeIds = await provinceCustomerPriority.listActiveCustomerIdsForProvince(provinceId);
  const activeSet = new Set(activeIds.map((id) => String(id)));
  const requestedSet = new Set(customerIds);

  if (activeSet.size !== requestedSet.size) {
    throw new BadRequestError(
      "Priority list must include every active customer in the province exactly once",
    );
  }
  for (const id of customerIds) {
    if (!activeSet.has(id)) {
      throw new BadRequestError(`Customer ${id} does not belong to this province`);
    }
  }

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await provinceCustomerPriority.replaceProvincePriorities(provinceId, customerIds, conn);
    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }

  const customers = await provinceCustomerPriority.listOrderedCustomersForProvince(provinceId);
  return {
    provinceId: String(province.id),
    provinceName: province.name,
    customers,
  };
}

module.exports = {
  getForProvince,
  reorder,
};
