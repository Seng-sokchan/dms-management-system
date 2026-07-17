const { z } = require("zod");
const { isKnownRole } = require("../services/rulesService");
const { isAutoCredentialRole } = require("../utils/userCredentials");

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

const optionalDepotId = z.preprocess((val) => {
  if (val === null) return null;
  if (val === undefined) return undefined;
  const s = String(val).trim();
  if (s === "") return null;
  return s;
}, z.union([z.string().regex(/^\d+$/), z.null()]).optional());

function optionalNonEmptyString(minLength) {
  return z.preprocess((val) => {
    if (val === null || val === undefined) return undefined;
    const s = String(val).trim();
    return s === "" ? undefined : s;
  }, z.string().min(minLength).optional());
}

const createUserSchema = z
  .object({
    name: z.string().min(2),
    username: optionalNonEmptyString(3),
    password: optionalNonEmptyString(6),
    role: z.string().refine(isKnownRole, { message: "Unknown role" }),
    deliveryAgentId: optionalDeliveryAgentId,
    depotId: optionalDepotId,
  })
  .superRefine((val, ctx) => {
    const isAutoRole = isAutoCredentialRole(val.role);
    if (!isAutoRole) {
      if (!val.username || val.username.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["username"],
          message: "Username is required (min 3 characters)",
        });
      }
      if (!val.password || val.password.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "Password is required (min 6 characters)",
        });
      }
    }
  });

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
  role: z.string().refine(isKnownRole, { message: "Unknown role" }).optional(),
  customerId: optionalCustomerId,
  deliveryAgentId: optionalDeliveryAgentId,
  depotId: optionalDepotId,
});

const userIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "User id must be numeric"),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  userIdParamsSchema,
};
