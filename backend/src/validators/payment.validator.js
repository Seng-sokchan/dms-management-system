const { z } = require("zod");

const createPaymentIntentSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  currency: z.enum(["USD", "KHR"]).optional(),
  paymentOption: z.string().max(32).optional(),
  idempotencyKey: z.string().max(64).optional(),
});

const paymentIdParamsSchema = z.object({
  paymentId: z.string().uuid(),
});

const orderIdPaymentParamsSchema = z.object({
  orderId: z.coerce.number().int().positive(),
});

const createBatchPaymentIntentSchema = z.object({
  masterOrderId: z.coerce.number().int().positive(),
  currency: z.enum(["USD", "KHR"]).optional(),
  paymentOption: z.string().max(32).optional(),
  idempotencyKey: z.string().max(64).optional(),
});

const paymentAmountOptionsSchema = z.object({
  orderIds: z.array(z.coerce.number().int().positive()).min(1),
});

module.exports = {
  createPaymentIntentSchema,
  createBatchPaymentIntentSchema,
  paymentAmountOptionsSchema,
  paymentIdParamsSchema,
  orderIdPaymentParamsSchema,
};
