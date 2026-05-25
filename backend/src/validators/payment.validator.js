const { z } = require("zod");

const createPaymentIntentSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  paymentOption: z.string().max(32).optional(),
  idempotencyKey: z.string().max(64).optional(),
});

const paymentIdParamsSchema = z.object({
  paymentId: z.string().uuid(),
});

const orderIdPaymentParamsSchema = z.object({
  orderId: z.coerce.number().int().positive(),
});

module.exports = {
  createPaymentIntentSchema,
  paymentIdParamsSchema,
  orderIdPaymentParamsSchema,
};
