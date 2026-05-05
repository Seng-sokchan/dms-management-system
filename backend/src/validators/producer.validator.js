const { z } = require("zod");

const producerBodySchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5),
  capacityNote: z.string().optional().default(""),
});

const producerIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "Producer id must be numeric"),
});

module.exports = {
  producerBodySchema,
  producerIdParamsSchema,
};
