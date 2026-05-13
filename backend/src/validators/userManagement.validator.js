const { z } = require("zod");
const { ROLES } = require("../constants");

const optionalCustomerId = z.preprocess((val) => {
  if (val === null) return null;
  if (val === undefined) return undefined;
  const s = String(val).trim();
  if (s === "") return null;
  return s;
}, z.union([z.string().regex(/^\d+$/), z.null()]).optional());

const optionalDeliveryAgentId = z.preprocess((val) => {
  if (val === null) return null;
  if (val === undefined) return undefined;
  const s = String(val).trim();
  if (s === "") return null;
  return s;
}, z.union([z.string().regex(/^\d+$/), z.null()]).optional());

const createUserSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(ROLES),
  deliveryAgentId: optionalDeliveryAgentId,
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(ROLES).optional(),
  customerId: optionalCustomerId,
  deliveryAgentId: optionalDeliveryAgentId,
});

const userIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "User id must be numeric"),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  userIdParamsSchema,
};
