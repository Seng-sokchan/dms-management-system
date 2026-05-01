const { z } = require("zod");

const createPaymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
  method: z.coerce.number().int().positive(),
  note: z.string().optional().default(""),
});

const generatePaymentKhqrSchema = z.object({
  orderId: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  currency: z.enum(["USD", "KHR"]).optional(),
});

const checkPaymentKhqrByMd5ListSchema = z.array(z.string().min(1)).min(1);

const confirmPaymentKhqrTransactionSchema = z.object({
  orderId: z.string().min(1).optional(),
  orderIds: z.array(z.string().min(1)).min(1).optional(),
  transaction: z.object({
    md5: z.string().min(1),
    status: z.string().min(1),
    message: z.string().optional(),
    data: z.object({
      hash: z.string().optional().nullable(),
      fromAccountId: z.string().optional().nullable(),
      toAccountId: z.string().optional().nullable(),
      currency: z.string().optional().nullable(),
      amount: z.coerce.number().positive(),
      description: z.string().optional().nullable(),
      createdDateMs: z.coerce.number().optional().nullable(),
      acknowledgedDateMs: z.coerce.number().optional().nullable(),
      trackingStatus: z.string().optional().nullable(),
      receiverBank: z.string().optional().nullable(),
      receiverBankAccount: z.string().optional().nullable(),
      instructionRef: z.string().optional().nullable(),
      externalRef: z.string().optional().nullable(),
    }).optional().nullable(),
  }),
});

const saveBakongTokenSchema = z.object({
  accessToken: z.string().min(20),
});

module.exports = {
  createPaymentSchema,
  generatePaymentKhqrSchema,
  checkPaymentKhqrByMd5ListSchema,
  confirmPaymentKhqrTransactionSchema,
  saveBakongTokenSchema,
};
