const { z } = require("zod");

const deliveryBodySchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5),
  vehicleType: z.string().min(2),
});

const deliveryIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "Delivery agent id must be numeric"),
});

module.exports = {
  deliveryBodySchema,
  deliveryIdParamsSchema,
};
