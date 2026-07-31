const { z } = require("zod");

const provinceIdQuerySchema = z.object({
  provinceId: z.string().min(1),
});

const reorderCustomerPrioritiesSchema = z.object({
  provinceId: z.string().min(1),
  customerIds: z.array(z.string().min(1)).min(0),
});

module.exports = {
  provinceIdQuerySchema,
  reorderCustomerPrioritiesSchema,
};
