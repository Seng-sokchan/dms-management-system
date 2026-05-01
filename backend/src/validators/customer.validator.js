const { z } = require("zod");

const createCustomerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().default(""),
  address: z.string().min(1),
  userId: z.string().min(1),
  subAddress: z.string().optional().default(""),
});

const updateCustomerSchema = createCustomerSchema;

const customerIdParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamsSchema,
};
