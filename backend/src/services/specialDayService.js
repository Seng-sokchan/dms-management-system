const specialDayRepository = require("../repositories/specialDay");
const orderRepository = require("../repositories/orders");
const itemRepository = require("../repositories/items");
const customerRepository = require("../repositories/customers");
const depotRepository = require("../repositories/depots");
const deliveryAgentRepository = require("../repositories/deliveryAgents");
const customerItemPriceRepository = require("../repositories/customerItemPrices");
const depotItemPriceRepository = require("../repositories/depotItemPrices");
const producerRepository = require("../repositories/producers");
const { ORDER_TYPE_CUSTOMER, ORDER_TYPE_DEPOT } = require("../constants/orderTypes");
const { getPool } = require("../../database/pool");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../errors");
const { emitSpecialDayEvent } = require("../socket/specialDaySocket");

const DEFAULT_NEW_ORDER_PRODUCER_ID = "1";
const EDITABLE_STATUSES = new Set(["open", "active", "closed"]);

async function list(user) {
  assertAdmin(user);
  return specialDayRepository.listSpecialDays();
}

async function listOpenForOptIn(_user) {
  return specialDayRepository.listOpenSpecialDays();
}

async function getById(user, id) {
  assertAdmin(user);
  const day = await specialDayRepository.getSpecialDayById(id);
  if (!day) throw new NotFoundError("Special day not found");
  return day;
}

async function create(user, payload) {
  assertAdmin(user);
  const item = await itemRepository.getItemById(payload.itemId);
  if (!item) throw new BadRequestError("Item not found");
  if (payload.status && !EDITABLE_STATUSES.has(payload.status)) {
    throw new BadRequestError("Invalid status");
  }
  return specialDayRepository.createSpecialDay({
    ...payload,
    createdBy: user.sub,
  });
}

async function update(user, id, payload) {
  assertAdmin(user);
  const existing = await specialDayRepository.getSpecialDayById(id);
  if (!existing) throw new NotFoundError("Special day not found");
  if (payload.itemId != null) {
    const item = await itemRepository.getItemById(payload.itemId);
    if (!item) throw new BadRequestError("Item not found");
  }
  if (payload.status && !EDITABLE_STATUSES.has(payload.status)) {
    throw new BadRequestError("Invalid status");
  }
  return specialDayRepository.updateSpecialDay(id, payload);
}

async function listRegistrations(user, specialDayId, query = {}) {
  assertAdmin(user);
  const day = await specialDayRepository.getSpecialDayById(specialDayId);
  if (!day) throw new NotFoundError("Special day not found");
  return specialDayRepository.listRegistrations(specialDayId, {
    provinceId: query.provinceId,
  });
}

async function listMyRegistrations(user) {
  if (user.role === "Customer") {
    const customer = await customerRepository.getCustomerByUserId(user.sub);
    if (!customer) throw new ForbiddenError("Customer profile not found");
    return specialDayRepository.listMyRegistrations({ customerId: customer.id });
  }
  if (user.role === "Depot") {
    const depot = await depotRepository.getDepotByDepotUserId(user.sub);
    if (!depot) throw new ForbiddenError("Depot profile not found");
    return specialDayRepository.listMyRegistrations({ depotId: depot.id });
  }
  throw new ForbiddenError("Forbidden for this role");
}

async function register(user, specialDayId) {
  const day = await specialDayRepository.getSpecialDayById(specialDayId);
  if (!day) throw new NotFoundError("Special day not found");
  if (day.status === "closed") {
    throw new BadRequestError("Special day is closed");
  }
  if (day.status !== "open" && day.status !== "active") {
    throw new BadRequestError("Registration is not open");
  }

  if (user.role === "Customer") {
    const customer = await customerRepository.getCustomerByUserId(user.sub);
    if (!customer) throw new ForbiddenError("Customer profile not found");
    const existing = await specialDayRepository.findAnyRegistration({
      specialDayId,
      customerId: customer.id,
    });
    if (existing?.status === "registered") {
      return existing;
    }
    if (existing) {
      return specialDayRepository.reactivateRegistration(existing.id, user.sub);
    }
    return specialDayRepository.createRegistration({
      specialDayId,
      targetType: ORDER_TYPE_CUSTOMER,
      customerId: customer.id,
      registeredByUserId: user.sub,
    });
  }

  if (user.role === "Depot") {
    const depot = await depotRepository.getDepotByDepotUserId(user.sub);
    if (!depot) throw new ForbiddenError("Depot profile not found");
    const existing = await specialDayRepository.findAnyRegistration({
      specialDayId,
      depotId: depot.id,
    });
    if (existing?.status === "registered") {
      return existing;
    }
    if (existing) {
      return specialDayRepository.reactivateRegistration(existing.id, user.sub);
    }
    return specialDayRepository.createRegistration({
      specialDayId,
      targetType: ORDER_TYPE_DEPOT,
      depotId: depot.id,
      registeredByUserId: user.sub,
    });
  }

  throw new ForbiddenError("Forbidden for this role");
}

async function cancelMyRegistration(user, specialDayId, registrationId) {
  const registration = await specialDayRepository.getRegistrationById(registrationId);
  if (!registration || String(registration.specialDayId) !== String(specialDayId)) {
    throw new NotFoundError("Registration not found");
  }
  if (registration.status === "cancelled") return registration;

  if (user.role === "Customer") {
    const customer = await customerRepository.getCustomerByUserId(user.sub);
    if (!customer || String(registration.customerId) !== String(customer.id)) {
      throw new ForbiddenError("Forbidden");
    }
  } else if (user.role === "Depot") {
    const depot = await depotRepository.getDepotByDepotUserId(user.sub);
    if (!depot || String(registration.depotId) !== String(depot.id)) {
      throw new ForbiddenError("Forbidden");
    }
  } else if (user.role === "Admin" || user.role === "Owner") {
    // admin may cancel
  } else {
    throw new ForbiddenError("Forbidden for this role");
  }

  return specialDayRepository.cancelRegistration(registrationId);
}

async function upsertAssignment(user, specialDayId, payload) {
  assertAdmin(user);
  const day = await specialDayRepository.getSpecialDayById(specialDayId);
  if (!day) throw new NotFoundError("Special day not found");
  if (day.status === "closed") throw new BadRequestError("Special day is closed");

  const registration = await specialDayRepository.getRegistrationById(payload.registrationId);
  if (!registration || String(registration.specialDayId) !== String(specialDayId)) {
    throw new NotFoundError("Registration not found");
  }
  if (registration.status !== "registered") {
    throw new BadRequestError("Registration is not active");
  }

  const agent = await deliveryAgentRepository.getDeliveryAgentById(payload.deliveryAgentId);
  if (!agent) throw new BadRequestError("Delivery agent not found");

  const assignment = await specialDayRepository.upsertAssignment({
    specialDayId,
    registrationId: payload.registrationId,
    deliveryAgentId: payload.deliveryAgentId,
    assignedBy: user.sub,
  });

  const progress = await specialDayRepository.getProgress(specialDayId);
  emitSpecialDayEvent(specialDayId, "special-day:assignment", {
    assignment,
    progress,
  });

  return assignment;
}

async function listDriverAssignments(user) {
  if (user.role !== "Delivery") {
    throw new ForbiddenError("Forbidden for this role");
  }
  const agentId = user.deliveryAgentId;
  if (!agentId) throw new ForbiddenError("Delivery agent profile not found");
  return specialDayRepository.listAssignmentsForAgent(agentId);
}

async function acceptAssignment(user, registrationId) {
  if (user.role !== "Delivery") {
    throw new ForbiddenError("Forbidden for this role");
  }
  const agentId = user.deliveryAgentId;
  if (!agentId) throw new ForbiddenError("Delivery agent profile not found");

  const registration = await specialDayRepository.getRegistrationById(registrationId);
  if (!registration || registration.status !== "registered") {
    throw new NotFoundError("Registration not found");
  }

  const day = await specialDayRepository.getSpecialDayById(registration.specialDayId);
  if (!day) throw new NotFoundError("Special day not found");
  if (day.status === "closed") throw new BadRequestError("Special day is closed");
  if (day.status !== "open" && day.status !== "active") {
    throw new BadRequestError("Special day is not available for delivery");
  }

  const assignment = await specialDayRepository.getAssignmentByRegistrationId(registration.id);
  if (!assignment || String(assignment.deliveryAgentId) !== String(agentId)) {
    throw new ForbiddenError("This stop is not assigned to you");
  }
  if (assignment.status === "accepted") {
    return assignment;
  }
  if (assignment.status !== "pending") {
    throw new BadRequestError("Assignment cannot be accepted");
  }

  const updated = await specialDayRepository.acceptAssignment(registration.id, agentId);
  if (!updated || updated.status !== "accepted") {
    throw new BadRequestError("Could not accept assignment");
  }

  const progress = await specialDayRepository.getProgress(day.id);
  emitSpecialDayEvent(day.id, "special-day:assignment", {
    assignment: updated,
    progress,
  });

  return updated;
}

async function getProgress(user, specialDayId) {
  assertAdmin(user);
  const day = await specialDayRepository.getSpecialDayById(specialDayId);
  if (!day) throw new NotFoundError("Special day not found");
  return specialDayRepository.getProgress(specialDayId);
}

async function fulfill(user, payload) {
  if (user.role !== "Delivery") {
    throw new ForbiddenError("Forbidden for this role");
  }
  const agentId = user.deliveryAgentId;
  if (!agentId) throw new ForbiddenError("Delivery agent profile not found");

  const quantity = Number(payload.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new BadRequestError("Quantity must be a positive number");
  }

  const registration = await specialDayRepository.getRegistrationById(payload.registrationId);
  if (!registration || registration.status !== "registered") {
    throw new NotFoundError("Registration not found");
  }

  const day = await specialDayRepository.getSpecialDayById(registration.specialDayId);
  if (!day) throw new NotFoundError("Special day not found");
  if (day.status === "closed") throw new BadRequestError("Special day is closed");
  if (day.status !== "open" && day.status !== "active") {
    throw new BadRequestError("Special day is not available for delivery");
  }

  const assignment = await specialDayRepository.getAssignmentByRegistrationId(registration.id);
  if (!assignment || String(assignment.deliveryAgentId) !== String(agentId)) {
    throw new ForbiddenError("This stop is not assigned to you");
  }
  if (assignment.status !== "accepted") {
    throw new BadRequestError("Accept this stop before recording delivery");
  }

  const item = await itemRepository.getItemById(day.itemId);
  if (!item) throw new BadRequestError("Special day item not found");

  const producer = await producerRepository.getProducerById(DEFAULT_NEW_ORDER_PRODUCER_ID);
  if (!producer) throw new BadRequestError("Default producer not found");

  const { customerId, masterOrderType, unitPrice, currency } = await resolveFulfillPricing(
    registration,
    day.itemId,
  );

  const pool = getPool();
  const conn = await pool.getConnection();
  let delivery;
  let order;
  try {
    await conn.beginTransaction();

    const master = await orderRepository.createMasterOrder(masterOrderType, conn);
    order = await orderRepository.createOrder(
      {
        customerId,
        itemId: day.itemId,
        orderedQty: quantity,
        unitPrice,
        currency,
        producerId: DEFAULT_NEW_ORDER_PRODUCER_ID,
        masterOrderId: master.id,
      },
      conn,
    );

    await specialDayRepository.finalizeOrderAsReceived(
      order.id,
      {
        deliveredQty: quantity,
        deliveryAgentId: agentId,
      },
      conn,
    );

    delivery = await specialDayRepository.createDelivery(
      {
        specialDayId: day.id,
        registrationId: registration.id,
        deliveryAgentId: agentId,
        deliveredByUserId: user.sub,
        quantity,
        orderDetailId: order.id,
      },
      conn,
    );

    // Finish removes the assignment so the stop leaves the driver queue;
    // special_day_deliveries (and the created order) keep the finished record.
    await specialDayRepository.deleteAssignmentByRegistrationId(registration.id, conn);

    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }

  order = await orderRepository.getOrderById(order.id);
  delivery = await specialDayRepository.getDeliveryById(delivery.id);
  const progress = await specialDayRepository.getProgress(day.id);

  emitSpecialDayEvent(day.id, "special-day:delivery", {
    delivery,
    order,
    progress,
  });

  return { delivery, order, progress };
}

async function resolveFulfillPricing(registration, itemId) {
  const currency = "KHR";

  if (Number(registration.targetType) === ORDER_TYPE_DEPOT) {
    if (!registration.depotId) throw new BadRequestError("Depot registration is invalid");
    const customers = await customerRepository.listCustomersByDepotId(registration.depotId);
    const billCustomer = customers[0];
    if (!billCustomer) {
      throw new BadRequestError("Depot has no customers to attribute the order");
    }
    const depotPrice = await depotItemPriceRepository.getDepotItemPrice(
      registration.depotId,
      itemId,
      currency,
    );
    const customerPrice = await customerItemPriceRepository.getCustomerItemPrice(
      billCustomer.id,
      itemId,
      currency,
    );
    const unitPrice = depotPrice?.unitPrice ?? customerPrice?.unitPrice;
    if (unitPrice == null) {
      throw new BadRequestError("Depot/customer item price not found");
    }
    return {
      customerId: billCustomer.id,
      masterOrderType: ORDER_TYPE_DEPOT,
      unitPrice,
      currency,
    };
  }

  if (!registration.customerId) throw new BadRequestError("Customer registration is invalid");
  const mappedPrice = await customerItemPriceRepository.getCustomerItemPrice(
    registration.customerId,
    itemId,
    currency,
  );
  if (mappedPrice?.unitPrice == null) {
    throw new BadRequestError("Customer item price not found");
  }
  return {
    customerId: registration.customerId,
    masterOrderType: ORDER_TYPE_CUSTOMER,
    unitPrice: mappedPrice.unitPrice,
    currency,
  };
}

function assertAdmin(user) {
  if (user?.role !== "Admin" && user?.role !== "Owner") {
    throw new ForbiddenError("Forbidden for this role");
  }
}

module.exports = {
  list,
  listOpenForOptIn,
  getById,
  create,
  update,
  listRegistrations,
  listMyRegistrations,
  register,
  cancelMyRegistration,
  upsertAssignment,
  listDriverAssignments,
  acceptAssignment,
  getProgress,
  fulfill,
};
