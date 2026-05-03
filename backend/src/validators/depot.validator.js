const { z } = require("zod");

const createDepotSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  ownerUserId: z.string().min(1).optional(),
  depotUserId: z.string().min(1).optional(),
});

const updateDepotSchema = createDepotSchema;

const depotIdParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  createDepotSchema,
  updateDepotSchema,
  depotIdParamsSchema,
};
