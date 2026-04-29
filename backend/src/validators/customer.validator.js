/**
 * Zod schemas for customer endpoints.
 */
const { z } = require("zod");

const phoneRegex = /^[0-9+\-()\s]{6,20}$/;

const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().regex(phoneRegex, "Invalid phone number").optional(),
  email: z.string().email().optional(),
  addressId: z.string().optional(),
});

const updateCustomerSchema = createCustomerSchema.partial();

const customerIdParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamsSchema,
};
