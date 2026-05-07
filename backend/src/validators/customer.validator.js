const { z } = require("zod");

const nullableTrimmed = (maxLen) =>
  z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return null;
    const s = String(val).trim();
    return s === "" ? null : s;
  }, z.string().max(maxLen).nullable());

/** Empty string or whitespace → undefined so optional FK fields validate. */
const optionalIdString = z.preprocess((val) => {
  if (val === null || val === undefined) return undefined;
  const s = String(val).trim();
  return s === "" ? undefined : s;
}, z.string().min(1).optional());

const createCustomerSchema = z.object({
  name: z.string().trim().min(2),
  phone: nullableTrimmed(30).optional(),
  address: z.string().min(1),
  userId: nullableTrimmed(30).optional(),
  depotId: optionalIdString,
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
