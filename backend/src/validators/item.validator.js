const { z } = require("zod");

const itemBodySchema = z.object({
  catalogId: z.string().min(1),
  name: z.string().min(2),
  sku: z.string().max(40).optional().default(""),
});

const itemIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "Item id must be numeric"),
});

module.exports = {
  itemBodySchema,
  itemIdParamsSchema,
};
