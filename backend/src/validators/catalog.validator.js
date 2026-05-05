const { z } = require("zod");

const catalogBodySchema = z.object({
  name: z.string().min(2),
  note: z.string().optional().default(""),
});

const catalogIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "Catalog id must be numeric"),
});

module.exports = {
  catalogBodySchema,
  catalogIdParamsSchema,
};
