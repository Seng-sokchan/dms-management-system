const { z } = require("zod");

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const registrationIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  registrationId: z.coerce.number().int().positive(),
});

const acceptAssignmentParamsSchema = z.object({
  registrationId: z.coerce.number().int().positive(),
});

const createSpecialDaySchema = z.object({
  name: z.string().trim().min(1).max(120),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  itemId: z.coerce.number().int().positive(),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(["open", "active", "closed"]).optional(),
});

const updateSpecialDaySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  itemId: z.coerce.number().int().positive().optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(["open", "active", "closed"]).optional(),
});

const upsertAssignmentSchema = z.object({
  registrationId: z.coerce.number().int().positive(),
  deliveryAgentId: z.coerce.number().int().positive(),
});

const createDeliverySchema = z.object({
  registrationId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
});

const listRegistrationsQuerySchema = z.object({
  provinceId: z.coerce.number().int().positive().optional(),
});

module.exports = {
  idParamsSchema,
  registrationIdParamsSchema,
  acceptAssignmentParamsSchema,
  createSpecialDaySchema,
  updateSpecialDaySchema,
  upsertAssignmentSchema,
  createDeliverySchema,
  listRegistrationsQuerySchema,
};
