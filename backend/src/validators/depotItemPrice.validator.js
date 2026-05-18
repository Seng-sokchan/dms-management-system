const { z } = require("zod");

const depotItemPriceSchema = z.object({
  depotId: z.string().min(1),
  itemId: z.string().min(1),
  currency: z.enum(["USD", "KHR"]).optional().default("KHR"),
  unitPrice: z.coerce.number().nonnegative(),
});

const depotItemPriceIdParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  depotItemPriceSchema,
  depotItemPriceIdParamsSchema,
};
