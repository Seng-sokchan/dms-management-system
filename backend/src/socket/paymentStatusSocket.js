const customerRepository = require("../repositories/customers");
const depotRepository = require("../repositories/depots");
const paymentRepository = require("../repositories/payments");

const CUSTOMER_ROOM_PREFIX = "customer:";
const DEPOT_ROOM_PREFIX = "depot:";

function customerRoom(customerId) {
  return `${CUSTOMER_ROOM_PREFIX}${customerId}`;
}

function depotRoom(depotId) {
  return `${DEPOT_ROOM_PREFIX}${depotId}`;
}

/**
 * Join customer or depot payment status rooms on connect.
 */
function attachPaymentStatusHandlers(io, socket) {
  const { user } = socket.data;

  if (user?.role === "Customer") {
    void customerRepository.getCustomerByUserId(user.sub).then((customer) => {
      if (!customer) return;
      socket.join(customerRoom(customer.id));
      socket.data.customerId = String(customer.id);
    });
  }

  if (user?.role === "Depot") {
    void depotRepository.getDepotByDepotUserId(user.sub).then((depot) => {
      if (!depot) return;
      socket.join(depotRoom(depot.id));
      socket.data.depotId = String(depot.id);
    });
  }

  socket.on("subscribe:payments", async (_payload, ack) => {
    if (user.role === "Customer") {
      const customer = await customerRepository.getCustomerByUserId(user.sub);
      if (!customer) {
        if (typeof ack === "function") ack({ ok: false, error: "Customer profile not found" });
        return;
      }
      socket.join(customerRoom(customer.id));
      socket.data.customerId = String(customer.id);
      if (typeof ack === "function") ack({ ok: true, customerId: String(customer.id) });
      return;
    }

    if (user.role === "Depot") {
      const depot = await depotRepository.getDepotByDepotUserId(user.sub);
      if (!depot) {
        if (typeof ack === "function") ack({ ok: false, error: "Depot profile not found" });
        return;
      }
      socket.join(depotRoom(depot.id));
      socket.data.depotId = String(depot.id);
      if (typeof ack === "function") ack({ ok: true, depotId: String(depot.id) });
      return;
    }

    if (typeof ack === "function") ack({ ok: false, error: "Forbidden" });
  });
}

async function emitPaymentStatus(payment) {
  const { getIo } = require("./ioRegistry");
  const io = getIo();
  if (!io || !payment) return;

  const orderIds = await paymentRepository.listOrderIdsByPaymentId(payment.id);

  const payload = {
    paymentId: payment.id,
    orderId: payment.orderId,
    orderIds: orderIds.length > 0 ? orderIds.map((id) => Number(id)) : undefined,
    status: payment.status,
    paidAt: payment.paidAt,
    amount: payment.amount,
    currency: payment.currency,
  };

  io.to(customerRoom(payment.customerId)).emit("payment:status", payload);

  try {
    const customer = await customerRepository.getCustomerById(payment.customerId);
    if (customer?.depotId) {
      io.to(depotRoom(customer.depotId)).emit("payment:status", payload);
    }
  } catch {
    /* optional depot notify */
  }
}

module.exports = {
  attachPaymentStatusHandlers,
  emitPaymentStatus,
  customerRoom,
  depotRoom,
};
