function mapOrder(row) {
  const orderAddressName = row.order_address_name != null ? row.order_address_name : null;
  const customerSubAddress = row.customer_sub_address != null ? row.customer_sub_address : null;
  return {
    id: String(row.id),
    customerName: orderAddressName || row.customer_name,
    addressId: row.address != null ? String(row.address) : null,
    orderAddressName,
    customerAddressId: row.customer_address_id != null ? String(row.customer_address_id) : null,
    customerAddressName: row.customer_address_name != null ? row.customer_address_name : null,
    customerSubAddress,
    customerId: row.customer_id != null ? String(row.customer_id) : null,
    orderGroupId: row.order_group_id != null ? String(row.order_group_id) : null,
    orderGroupName: row.order_group_name != null ? row.order_group_name : null,
    customerPhone: row.customer_phone != null ? row.customer_phone : null,
    itemId: row.item_id != null ? String(row.item_id) : null,
    itemSku: row.item_sku != null ? row.item_sku : null,
    itemName: row.item_name,
    currency: (row.currency || "USD"),
    orderedQty: row.ordered_qty,
    unitPrice: Number(row.unit_price),
    producerId: row.producer_id != null ? String(row.producer_id) : null,
    truckId: row.truck_id != null ? String(row.truck_id) : null,
    deliveryAgentId: row.delivery_agent_id != null ? String(row.delivery_agent_id) : null,
    deliveryTime: row.delivery_time,
    producerName: row.producer_name != null ? row.producer_name : null,
    truckCode: row.truck_code != null ? row.truck_code : null,
    truckPlateNo: row.truck_plate_no != null ? row.truck_plate_no : null,
    deliveryAgentName: row.delivery_agent_name != null ? row.delivery_agent_name : null,
    deliveredQty: row.delivered_qty,
    lossQty: row.loss_qty,
    remainingQty: row.remaining_qty,
    discrepancy: row.discrepancy,
    amountTotal: Number(row.amount_total),
    amountPaid: Number(row.amount_paid),
    paymentStatus: row.payment_status,
    deliveryProofType: row.delivery_proof_type || null,
    deliveryProofValue: row.delivery_proof_value || null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProducer(row) {
  return {
    id: String(row.id),
    name: row.name,
    phone: row.phone,
    capacityNote: row.capacity_note,
  };
}

function mapDelivery(row) {
  return {
    id: String(row.id),
    name: row.name,
    phone: row.phone,
    vehicleType: row.vehicle_type,
  };
}

function mapTruck(row) {
  return {
    id: String(row.id),
    code: row.code,
    plateNo: row.plate_no,
    deliveryAgentId: row.delivery_agent_id != null ? String(row.delivery_agent_id) : "",
    deliveryAgentName: row.delivery_agent_name != null ? row.delivery_agent_name : null,
    capacityNote: row.capacity_note || "",
  };
}

function mapCustomer(row) {
  const subAddress = row.sub_address || "";
  return {
    id: String(row.id),
    name: row.name,
    phone: row.phone || "",
    address: row.address != null ? String(row.address) : "",
    userId: row.user_id != null ? String(row.user_id) : "",
    userName: row.user_name || "",
    userUsername: row.user_username || "",
    addressName: row.address_name || "",
    subAddress,
  };
}

function mapAddress(row) {
  return {
    id: String(row.id),
    name: row.name,
  };
}

function mapCatalog(row) {
  return {
    id: String(row.id),
    name: row.name,
    note: row.note || "",
  };
}

function mapItem(row) {
  const defaultUnitPriceUsd = row.default_unit_price_usd != null
    ? Number(row.default_unit_price_usd)
    : Number(row.default_unit_price);
  const defaultUnitPriceKhr = row.default_unit_price_khr != null
    ? Number(row.default_unit_price_khr)
    : Number(row.default_unit_price) * 4100;
  return {
    id: String(row.id),
    catalogId: String(row.catalog_id),
    catalogName: row.catalog_name != null ? row.catalog_name : null,
    customerId: row.customer_id != null ? String(row.customer_id) : null,
    customerName: row.customer_name != null ? row.customer_name : null,
    name: row.name,
    sku: row.sku || "",
    defaultUnitPrice: defaultUnitPriceUsd,
    defaultUnitPriceUsd,
    defaultUnitPriceKhr,
  };
}

function mapPayment(row) {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    orderCustomerName: row.order_customer_name != null ? row.order_customer_name : null,
    orderItemName: row.order_item_name != null ? row.order_item_name : null,
    amount: Number(row.amount),
    method: Number(row.method),
    methodName: row.method_name != null ? row.method_name : null,
    note: row.note,
    createdAt: row.created_at,
  };
}

function mapUser(row) {
  return {
    id: String(row.id),
    name: row.name,
    username: row.username,
    role: row.role,
    isActive: Boolean(row.is_active),
  };
}

module.exports = {
  mapOrder,
  mapProducer,
  mapDelivery,
  mapTruck,
  mapCustomer,
  mapCatalog,
  mapItem,
  mapAddress,
  mapPayment,
  mapUser,
};
