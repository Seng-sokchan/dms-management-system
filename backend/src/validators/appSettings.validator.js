const { z } = require("zod");

const updateSpecialDaySchema = z.object({
  enabled: z.boolean(),
});

module.exports = {
  updateSpecialDaySchema,
};
