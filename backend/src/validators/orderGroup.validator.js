const { z } = require("zod");

const orderGroupBodySchema = z.object({
  name: z.string().min(2),
});

const orderGroupIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "Order group id must be numeric"),
});

module.exports = {
  orderGroupBodySchema,
  orderGroupIdParamsSchema,
};
