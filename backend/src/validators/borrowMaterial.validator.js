const { z } = require("zod");

const createBorrowMaterialSchema = z.object({
  name: z.string().min(2),
  unit: z.string().optional().default(""),
  note: z.string().optional().default(""),
});

const updateBorrowMaterialSchema = createBorrowMaterialSchema;

const borrowMaterialIdParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  createBorrowMaterialSchema,
  updateBorrowMaterialSchema,
  borrowMaterialIdParamsSchema,
};
