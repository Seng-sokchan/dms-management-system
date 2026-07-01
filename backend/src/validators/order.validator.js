/**
 * Zod schemas for order endpoints.
 *
 * RULE: every schema used by an order route lives here. Controllers must
 * never call `safeParse` directly. The `validate()` middleware in
 * `validators/validate.js` consumes these and attaches the parsed value to
 * `req.body` / `req.params` / `req.query`.
 */
const { z } = require("zod");
const { isKnownStatus } = require("../services/rulesService");

// Reusable primitives -------------------------------------------------------

const idString = z.string().min(1);
const statusSchema = z.string().refine(isKnownStatus, { message: "Invalid status" });

// Body schemas --------------------------------------------------------------

const createOrderSchema = z.object({
  customerId: idString,
  itemId: idString,
  orderedQty: z.number().int().positive(),
  unitPrice: z.number().nonnegative().optional(),
  currency: z.enum(["USD", "KHR"]).optional().default("KHR"),
  producerId: idString.nullable().optional(),
});

const createOrderBatchLineSchema = z.object({
  itemId: idString,
  orderedQty: z.number().int().positive(),
  unitPrice: z.number().nonnegative().optional(),
  currency: z.enum(["USD", "KHR"]).optional().default("KHR"),
});

const createOrderBatchSchema = z.object({
  customerId: idString,
  lines: z.array(createOrderBatchLineSchema).min(1).max(50),
});

const depotBatchLineSchema = z.object({
  customerId: idString,
  itemId: idString,
  orderedQty: z.number().int().positive(),
  unitPrice: z.number().nonnegative().optional(),
  currency: z.enum(["USD", "KHR"]).optional().default("KHR"),
});

const createDepotBatchSchema = z.object({
  lines: z.array(depotBatchLineSchema).min(1).max(100),
});

const assignOrderSchema = z.object({
  producerId: idString.nullable().optional(),
  deliveryAgentId: idString.nullable().optional(),
  deliveryTime: z.string().datetime().optional(),
});

const updateOrderStatusSchema = z.object({
  status: statusSchema,
});

const confirmDeliverySchema = z.object({
  lossQty: z.coerce.number().int().min(0),
});

// Param + query schemas -----------------------------------------------------

const orderIdParamsSchema = z.object({
  id: idString,
});

const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: statusSchema.optional(),
  customerId: idString.optional(),
});

module.exports = {
  createOrderSchema,
  createOrderBatchSchema,
  createDepotBatchSchema,
  assignOrderSchema,
  updateOrderStatusSchema,
  confirmDeliverySchema,
  orderIdParamsSchema,
  listOrdersQuerySchema,
};
