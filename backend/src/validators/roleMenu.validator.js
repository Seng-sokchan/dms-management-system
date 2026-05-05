const { z } = require("zod");

const roleMenuBodySchema = z.object({
  menuKeys: z.array(z.string()).min(1, "Select at least one menu"),
});

const roleNameParamsSchema = z.object({
  roleName: z.string().min(1),
});

module.exports = {
  roleMenuBodySchema,
  roleNameParamsSchema,
};
