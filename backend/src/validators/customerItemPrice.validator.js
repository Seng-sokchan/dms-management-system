const { z } = require("zod");

const customerItemPriceSchema = z.object({
  customerId: z.string().min(1),
  itemId: z.string().min(1),
  currency: z.enum(["USD", "KHR"]).optional().default("KHR"),
  unitPrice: z.coerce.number().nonnegative(),
});

const customerItemPriceIdParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  customerItemPriceSchema,
  customerItemPriceIdParamsSchema,
};
