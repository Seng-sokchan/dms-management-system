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

const optionalLatitude = z.preprocess((val) => {
  if (val === null || val === undefined || val === "") return undefined;
  const n = typeof val === "number" ? val : Number(String(val).trim());
  return Number.isFinite(n) ? n : NaN;
}, z.number().min(-90).max(90).optional());

const optionalLongitude = z.preprocess((val) => {
  if (val === null || val === undefined || val === "") return undefined;
  const n = typeof val === "number" ? val : Number(String(val).trim());
  return Number.isFinite(n) ? n : NaN;
}, z.number().min(-180).max(180).optional());

const createCustomerSchema = z
  .object({
    name: z.string().trim().min(2),
    phone: nullableTrimmed(30).optional(),
    userId: nullableTrimmed(30).optional(),
    depotId: optionalIdString,
    latitude: optionalLatitude,
    longitude: optionalLongitude,
  })
  .refine(
    (data) =>
      (data.latitude === undefined && data.longitude === undefined) ||
      (data.latitude !== undefined && data.longitude !== undefined),
    { message: "Latitude and longitude must both be provided or both omitted", path: ["longitude"] },
  );

const updateCustomerSchema = createCustomerSchema;

const customerIdParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamsSchema,
};
