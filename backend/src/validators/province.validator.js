const { z } = require("zod");

const provinceBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
});

const provinceIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "Province id must be numeric"),
});

module.exports = {
  provinceBodySchema,
  provinceIdParamsSchema,
};
