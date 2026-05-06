const { z } = require("zod");

const nullableTrimmed = (maxLen) =>
  z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return null;
    const s = String(val).trim();
    return s === "" ? null : s;
  }, z.string().max(maxLen).nullable());

const createCustomerSchema = z.object({
  name: z.string().trim().min(2),
  phone: nullableTrimmed(30).optional(),
  address: z.string().min(1),
  userId: nullableTrimmed(30).optional(),
  depotId: z.string().min(1).optional(),
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
