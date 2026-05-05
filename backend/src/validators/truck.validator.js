const { z } = require("zod");

const truckBodySchema = z.object({
  code: z.string().min(2),
  plateNo: z.string().min(3),
  deliveryAgentId: z.string().nullable().optional(),
  capacityNote: z.string().max(255).optional().default(""),
});

const truckIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "Truck id must be numeric"),
});

module.exports = {
  truckBodySchema,
  truckIdParamsSchema,
};
