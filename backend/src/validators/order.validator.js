/**
 * Zod schemas for order endpoints.
 * Extend these as you migrate inline validation out of orderController.
 */
const { z } = require("zod");
const { ORDER_STATUS, PAYMENT_STATUS } = require("../constants/general");

const orderItemSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

const createOrderSchema = z.object({
  customerId: z.string().min(1),
  addressId: z.string().min(1),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  notes: z.string().max(500).optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUS),
});

const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(PAYMENT_STATUS),
});

const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(ORDER_STATUS).optional(),
  customerId: z.string().optional(),
});

const orderIdParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  listOrdersQuerySchema,
  orderIdParamsSchema,
};
