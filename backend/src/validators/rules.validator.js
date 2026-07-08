const { z } = require("zod");
const { isKnownRole } = require("../services/rulesService");

const roleNameParamsSchema = z.object({
  roleName: z.string().refine(isKnownRole, { message: "Unknown role" }),
});

module.exports = {
  roleNameParamsSchema,
};
