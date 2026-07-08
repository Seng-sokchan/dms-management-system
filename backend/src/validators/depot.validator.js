const { z } = require("zod");

const optionalDepotUserId = z.preprocess((val) => {
  if (val === null) return null;
  if (val === undefined) return undefined;
  const s = String(val).trim();
  if (s === "") return null;
  return s;
}, z.union([z.string().regex(/^\d+$/), z.null()]).optional());

const createDepotSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  depotUserId: optionalDepotUserId,
});

const updateDepotSchema = createDepotSchema;

const depotIdParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  createDepotSchema,
  updateDepotSchema,
  depotIdParamsSchema,
};
