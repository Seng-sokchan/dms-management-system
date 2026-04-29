/**
 * Data transfer objects for the Order resource.
 * Keeps API response shapes decoupled from the database row shape.
 */

function toOrderItemDto(row) {
  return {
    itemId: row.item_id ?? row.itemId,
    name: row.item_name ?? row.name,
    quantity: Number(row.quantity ?? 0),
    unitPrice: Number(row.unit_price ?? row.unitPrice ?? 0),
    subtotal: Number(row.subtotal ?? 0),
  };
}

function toOrderDto(row, { items } = {}) {
  if (!row) return null;
  return {
    id: row.id,
    customerId: row.customer_id ?? row.customerId,
    addressId: row.address_id ?? row.addressId,
    status: row.status,
    paymentStatus: row.payment_status ?? row.paymentStatus,
    total: Number(row.total ?? 0),
    notes: row.notes || null,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
    items: Array.isArray(items) ? items.map(toOrderItemDto) : undefined,
  };
}

function toOrderListDto(rows = []) {
  return rows.map((r) => toOrderDto(r));
}

module.exports = { toOrderDto, toOrderItemDto, toOrderListDto };
