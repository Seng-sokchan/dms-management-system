function mapOrder(row) {
  const orderAddressName = row.order_address_name != null ? row.order_address_name : null;
  return {
    id: String(row.id),
    customerName: orderAddressName || row.customer_name,
    addressId: row.address != null ? String(row.address) : null,
    orderAddressName,
    customerAddressId: row.customer_address_id != null ? String(row.customer_address_id) : null,
    customerAddressName: row.customer_address_name != null ? row.customer_address_name : null,
    customerId: row.customer_id != null ? String(row.customer_id) : null,
    orderGroupId: row.order_group_id != null ? String(row.order_group_id) : null,
    orderGroupName: row.order_group_name != null ? row.order_group_name : null,
    customerPhone: row.customer_phone != null ? row.customer_phone : null,
    itemId: row.item_id != null ? String(row.item_id) : null,
    itemSku: row.item_sku != null ? row.item_sku : null,
    itemName: row.item_name,
    currency: row.currency || "KHR",
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
    amountTotal: Number(row.amount_total),
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
  return {
    id: String(row.id),
    name: row.name,
    phone: row.phone != null && String(row.phone).trim() !== "" ? String(row.phone) : null,
    address: row.address != null ? String(row.address) : "",
    userId: row.user_id != null ? String(row.user_id) : "",
    userName: row.user_name || "",
    userUsername: row.user_username || "",
    depotId: row.depot_id != null ? String(row.depot_id) : "",
    depotName: row.depot_name || "",
    addressName: row.address_name || "",
  };
}

function mapDepot(row) {
  return {
    id: String(row.id),
    name: row.name,
    phone: row.phone || "",
    address: row.address || "",
    ownerUserId: row.owner_user_id != null ? String(row.owner_user_id) : "",
    ownerUserName: row.owner_user_name || "",
    depotUserId: row.depot_user_id != null ? String(row.depot_user_id) : "",
    depotUserName: row.depot_user_name || "",
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
  const defaultUnitPriceUsd =
    row.default_unit_price_usd != null
      ? Number(row.default_unit_price_usd)
      : Number(row.default_unit_price);
  const defaultUnitPriceKhr =
    row.default_unit_price_khr != null
      ? Number(row.default_unit_price_khr)
      : Number(row.default_unit_price) * 4100;
  return {
    id: String(row.id),
    catalogId: String(row.catalog_id),
    catalogName: row.catalog_name != null ? row.catalog_name : null,
    name: row.name,
    sku: row.sku || "",
    defaultUnitPrice: defaultUnitPriceUsd,
    defaultUnitPriceUsd,
    defaultUnitPriceKhr,
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

function mapBorrowMaterial(row) {
  return {
    id: String(row.id),
    name: row.name,
    unit: row.unit || "",
    note: row.note || "",
  };
}

function mapCustomerBorrowedMaterial(row) {
  return {
    id: String(row.id),
    customerId: row.customer_id != null ? String(row.customer_id) : "",
    customerName: row.customer_name || "",
    materialId: row.material_id != null ? String(row.material_id) : "",
    materialName: row.material_name || "",
    unit: row.unit || "",
    qty: Number(row.qty || 0),
    note: row.note || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBorrowMaterialOrderLoan(row) {
  return {
    id: String(row.id),
    customerId: row.customer_id != null ? String(row.customer_id) : "",
    customerName: row.customer_name || "",
    materialId: row.material_id != null ? String(row.material_id) : "",
    materialName: row.material_name || "",
    unit: row.unit || "",
    orderId: row.order_id != null ? String(row.order_id) : "",
    fixedUnitPrice: Number(row.fixed_unit_price),
    currency: row.currency || "KHR",
    orderedQty: Number(row.ordered_qty || 0),
    computedLineTotal: Number(row.computed_line_total),
    note: row.note || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBorrowMaterialMonthlySchedule(row) {
  return {
    id: String(row.id),
    customerId: row.customer_id != null ? String(row.customer_id) : "",
    customerName: row.customer_name || "",
    materialId: row.material_id != null ? String(row.material_id) : "",
    materialName: row.material_name || "",
    unit: row.unit || "",
    totalAmount: Number(row.total_amount),
    currency: row.currency || "KHR",
    totalPeriod: Number(row.total_period || 0),
    startDueDate: row.start_due_date,
    note: row.note || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBorrowMaterialMonthlyInstallment(row) {
  return {
    id: String(row.id),
    scheduleId: row.schedule_id != null ? String(row.schedule_id) : "",
    periodNo: Number(row.period_no || 0),
    dueDate: row.due_date,
    amountDue: Number(row.amount_due),
    status: Number(row.status ?? 0),
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  mapOrder,
  mapProducer,
  mapDelivery,
  mapTruck,
  mapCustomer,
  mapDepot,
  mapCatalog,
  mapItem,
  mapAddress,
  mapUser,
  mapBorrowMaterial,
  mapCustomerBorrowedMaterial,
  mapBorrowMaterialOrderLoan,
  mapBorrowMaterialMonthlySchedule,
  mapBorrowMaterialMonthlyInstallment,
};
