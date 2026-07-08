export const mockPaywayCheckout = {
  action: "https://checkout.payway.com.kh/api/payment-gateway/v1/payments/purchase",
  fields: {
    merchant_id: "merchant-1",
    tran_id: "txn-123",
    hash: "abc123",
  },
};

export const mockPaywaySuccessResponse = {
  status: { code: "00", message: "Success" },
  data: {
    qrString: "00020101021234567890",
    qrImage: "https://payway.example/qr.png",
    abapay_deeplink: "abamobilebank://ababank.com?type=payway&qrcode=encoded",
    play_store: "market://details?id=com.paygo24.ibank",
    app_store: "https://apps.apple.com/app/aba-mobile",
  },
};

export const mockPaymentIntent = {
  paymentId: "pay-001",
  orderId: 42,
  expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  paywayCheckout: mockPaywayCheckout,
};

export const mockOrder = {
  id: 42,
  amountTotal: 40000,
  currency: "KHR",
};

export const mockBatchOrders = [
  { id: 1, amountTotal: 20000, currency: "KHR" },
  { id: 2, amountTotal: 30000, currency: "KHR" },
];
