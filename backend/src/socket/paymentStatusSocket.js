const customerRepository = require("../repositories/customers");
const depotRepository = require("../repositories/depots");
const orderRepository = require("../repositories/orders");
const { hasDataScope, getDepotForUser } = require("../services/accessScopeService");

const CUSTOMER_ROOM_PREFIX = "customer:";
const DEPOT_ROOM_PREFIX = "depot:";

function customerRoom(customerId) {
  return `${CUSTOMER_ROOM_PREFIX}${customerId}`;
}

function depotRoom(depotId) {
  return `${DEPOT_ROOM_PREFIX}${depotId}`;
}

function attachPaymentStatusHandlers(io, socket) {
  const { user } = socket.data;

  if (hasDataScope(user, "customer")) {
    void customerRepository.getCustomerByUserId(user.sub).then((customer) => {
      if (!customer) return;
      socket.join(customerRoom(customer.id));
      socket.data.customerId = String(customer.id);
    });
  }

  if (hasDataScope(user, "depot")) {
    void getDepotForUser(user).then((depot) => {
      if (!depot) return;
      socket.join(depotRoom(depot.id));
      socket.data.depotId = String(depot.id);
    });
  }

  socket.on("subscribe:payments", async (_payload, ack) => {
    if (hasDataScope(user, "customer")) {
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

    if (hasDataScope(user, "depot")) {
      const depot = await getDepotForUser(user);
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

  const orderId = payment.orderId;
  const detailIds = await orderRepository.listOrderDetailIdsByMasterOrderId(orderId);
  const firstDetailId = detailIds[0] || orderId;
  const order = await orderRepository.getOrderById(firstDetailId);
  if (!order) return;

  const payload = {
    paymentId: payment.id,
    orderId: Number(firstDetailId),
    masterOrderId: Number(orderId),
    status: payment.status || "paid",
    amount: payment.amount,
    currency: payment.currency,
    paidAt: payment.paidAt,
  };

  io.to(customerRoom(order.customerId)).emit("payment:status", payload);

  const customer = await customerRepository.getCustomerById(order.customerId);
  if (customer?.depotId) {
    io.to(depotRoom(customer.depotId)).emit("payment:status", payload);
  }
}

module.exports = {
  attachPaymentStatusHandlers,
  emitPaymentStatus,
  customerRoom,
  depotRoom,
};
