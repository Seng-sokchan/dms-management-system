/** Resolved customer item price (customer override, else depot default). */

const RESOLVED_CUSTOMER_ITEM_PRICE_SQL = `
SELECT
  ranked.id,
  ranked.customer_id,
  ranked.customer_name,
  ranked.item_id,
  ranked.item_name,
  ranked.item_sku,
  ranked.currency,
  ranked.unit_price,
  ranked.created_at,
  ranked.updated_at
FROM (
  SELECT
    1 AS priority,
    cip.id,
    cip.customer_id,
    c.name AS customer_name,
    cip.item_id,
    i.name AS item_name,
    i.sku AS item_sku,
    cip.currency,
    cip.unit_price,
    cip.created_at,
    cip.updated_at
  FROM customer_item_prices cip
  INNER JOIN customers c ON c.id = cip.customer_id AND c.is_active = 1
  INNER JOIN items i ON i.id = cip.item_id AND i.is_active = 1
  WHERE cip.customer_id = ?
    AND cip.item_id = ?
    AND cip.currency = ?
  UNION ALL
  SELECT
    2 AS priority,
    dip.id,
    c.id AS customer_id,
    c.name AS customer_name,
    dip.item_id,
    i.name AS item_name,
    i.sku AS item_sku,
    dip.currency,
    dip.unit_price,
    dip.created_at,
    dip.updated_at
  FROM customers c
  INNER JOIN depot_item_prices dip ON dip.depot_id = c.depot_id
  INNER JOIN items i ON i.id = dip.item_id AND i.is_active = 1
  INNER JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
  WHERE c.id = ?
    AND c.is_active = 1
    AND c.depot_id IS NOT NULL
    AND dip.item_id = ?
    AND dip.currency = ?
    AND NOT EXISTS (
      SELECT 1
      FROM customer_item_prices cip2
      WHERE cip2.customer_id = ?
        AND cip2.item_id = ?
        AND cip2.currency = ?
    )
) ranked
ORDER BY ranked.priority
LIMIT 1`;

module.exports = {
  RESOLVED_CUSTOMER_ITEM_PRICE_SQL,
};
