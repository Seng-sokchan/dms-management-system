const { z } = require("zod");
const { isKnownStatus, isKnownRole } = require("../services/rulesService");

const statusTransitionEntrySchema = z.object({
  fromStatus: z.string().refine(isKnownStatus, { message: "Unknown status" }),
  toStatuses: z.array(z.string().refine(isKnownStatus, { message: "Unknown status" })),
});

const statusTransitionsBodySchema = z.object({
  transitions: z.array(statusTransitionEntrySchema).min(1),
});

const roleNameParamsSchema = z.object({
  roleName: z.string().refine(isKnownRole, { message: "Unknown role" }),
});

const roleAccessBodySchema = z.object({
  dataScope: z.enum(["all", "owner", "depot", "customer", "delivery_agent", "none"]).optional(),
  clients: z.array(z.enum(["admin", "mobile"])).optional(),
  socketChannels: z.array(z.string().min(1)).optional(),
});

const roleStatusPermissionsBodySchema = z.object({
  matrix: z.record(z.string(), z.record(z.string(), z.array(z.enum(["update_status", "confirm_delivery"])))),
});

module.exports = {
  statusTransitionsBodySchema,
  roleNameParamsSchema,
  roleAccessBodySchema,
  roleStatusPermissionsBodySchema,
};
