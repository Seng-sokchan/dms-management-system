const { z } = require("zod");

const createBorrowMaterialMonthlyScheduleBodySchema = z.object({
  materialId: z.string().min(1),
  totalAmount: z.coerce.number().positive(),
  currency: z.enum(["USD", "KHR"]).optional().default("KHR"),
  totalPeriod: z.coerce.number().int().positive(),
  startDueDate: z.string().min(1),
  note: z.string().optional().default(""),
});

const customerBorrowMonthlyScheduleParamsSchema = z.object({
  customerId: z.string().min(1),
});

const customerBorrowMonthlyScheduleDetailParamsSchema = z.object({
  customerId: z.string().min(1),
  scheduleId: z.string().min(1),
});

const customerBorrowMonthlyScheduleDeleteParamsSchema = z.object({
  customerId: z.string().min(1),
  id: z.string().min(1),
});

module.exports = {
  createBorrowMaterialMonthlyScheduleBodySchema,
  customerBorrowMonthlyScheduleParamsSchema,
  customerBorrowMonthlyScheduleDetailParamsSchema,
  customerBorrowMonthlyScheduleDeleteParamsSchema,
};
