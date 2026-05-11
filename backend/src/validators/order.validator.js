/**
 * Zod schemas for order endpoints.
 *
 * RULE: every schema used by an order route lives here. Controllers must
 * never call `safeParse` directly. The `validate()` middleware in
 * `validators/validate.js` consumes these and attaches the parsed value to
 * `req.body` / `req.params` / `req.query`.
 */
const { z } = require("zod");
const { ORDER_STATUS } = require("../constants/general");

// Reusable primitives -------------------------------------------------------

const idString = z.string().min(1);

// Body schemas --------------------------------------------------------------

const createOrderSchema = z.object({
  customerId: idString,
  itemId: idString,
  orderedQty: z.number().int().positive(),
  unitPrice: z.number().nonnegative().optional(),
  currency: z.enum(["USD", "KHR"]).optional().default("KHR"),
  producerId: idString.nullable().optional(),
});

const assignOrderSchema = z.object({
  producerId: idString.nullable().optional(),
  deliveryAgentId: idString.nullable().optional(),
  orderGroupId: idString.nullable().optional(),
  deliveryTime: z.string().datetime().optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUS),
});

const confirmDeliverySchema = z.object({}).passthrough();

// Param + query schemas -----------------------------------------------------

const orderIdParamsSchema = z.object({
  id: idString,
});

const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(ORDER_STATUS).optional(),
  customerId: idString.optional(),
});

module.exports = {
  createOrderSchema,
  assignOrderSchema,
  updateOrderStatusSchema,
  confirmDeliverySchema,
  orderIdParamsSchema,
  listOrdersQuerySchema,
};
