const { z } = require("zod");

const upsertCustomerBorrowedMaterialSchema = z.object({
  materialId: z.string().min(1),
  qty: z.coerce.number().int().nonnegative(),
  note: z.string().optional().default(""),
});

const customerBorrowParamsSchema = z.object({
  customerId: z.string().min(1),
});

const customerBorrowMaterialParamsSchema = z.object({
  customerId: z.string().min(1),
  materialId: z.string().min(1),
});

module.exports = {
  upsertCustomerBorrowedMaterialSchema,
  customerBorrowParamsSchema,
  customerBorrowMaterialParamsSchema,
};
