const { z } = require("zod");

const createBorrowMaterialOrderLoanBodySchema = z.object({
  materialId: z.string().min(1),
  orderId: z.string().min(1),
  fixedUnitPrice: z.coerce.number().positive(),
  note: z.string().optional().default(""),
});

const customerBorrowOrderLoanParamsSchema = z.object({
  customerId: z.string().min(1),
});

const customerBorrowOrderLoanDeleteParamsSchema = z.object({
  customerId: z.string().min(1),
  id: z.string().min(1),
});

module.exports = {
  createBorrowMaterialOrderLoanBodySchema,
  customerBorrowOrderLoanParamsSchema,
  customerBorrowOrderLoanDeleteParamsSchema,
};
