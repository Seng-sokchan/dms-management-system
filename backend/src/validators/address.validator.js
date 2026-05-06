const { z } = require("zod");

const addressBodySchema = z.object({
  name: z.string().trim().min(2).max(255),
});

const addressIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "Address id must be numeric"),
});

module.exports = {
  addressBodySchema,
  addressIdParamsSchema,
};
