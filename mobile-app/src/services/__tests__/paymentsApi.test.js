import {
  createPaymentIntent,
  createBatchPaymentIntent,
  getPaymentAmountOptions,
  getPayment,
  startPaymentLiveCheck,
  stopPaymentLiveCheck,
  submitPaymentPurchase,
} from "../paymentsApi";
import { apiClient, authConfig, unwrapApiData } from "../apiClient";

jest.mock("../apiClient", () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
  authConfig: jest.fn((token) => ({
    headers: { Authorization: `Bearer ${token}` },
  })),
  unwrapApiData: jest.fn((payload) => payload?.data ?? payload),
}));

describe("paymentsApi", () => {
  const token = "test-token";

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.post.mockResolvedValue({ data: { data: { paymentId: "p1" } } });
    apiClient.get.mockResolvedValue({ data: { data: { status: "unpaid" } } });
  });

  it("createPaymentIntent posts to /payments/intents", async () => {
    await createPaymentIntent(token, {
      orderId: 42,
      paymentOption: "checkout",
      currency: "KHR",
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      "/payments/intents",
      { orderId: 42, paymentOption: "checkout", currency: "KHR" },
      authConfig(token),
    );
    expect(unwrapApiData).toHaveBeenCalled();
  });

  it("createBatchPaymentIntent posts to /payments/batch-intents", async () => {
    await createBatchPaymentIntent(token, {
      masterOrderId: 12,
      paymentOption: "checkout",
      currency: "USD",
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      "/payments/batch-intents",
      { masterOrderId: 12, paymentOption: "checkout", currency: "USD" },
      authConfig(token),
    );
  });

  it("getPaymentAmountOptions posts order ids", async () => {
    await getPaymentAmountOptions(token, { orderIds: [1, 2] });
    expect(apiClient.post).toHaveBeenCalledWith(
      "/payments/amount-options",
      { orderIds: [1, 2] },
      authConfig(token),
    );
  });

  it("getPayment fetches payment by id", async () => {
    await getPayment(token, "pay-123");
    expect(apiClient.get).toHaveBeenCalledWith("/payments/pay-123", authConfig(token));
  });

  it("startPaymentLiveCheck posts to live-check/start", async () => {
    await startPaymentLiveCheck(token, "pay-123");
    expect(apiClient.post).toHaveBeenCalledWith(
      "/payments/pay-123/live-check/start",
      {},
      authConfig(token),
    );
  });

  it("stopPaymentLiveCheck posts to live-check/stop", async () => {
    await stopPaymentLiveCheck(token, "pay-123");
    expect(apiClient.post).toHaveBeenCalledWith(
      "/payments/pay-123/live-check/stop",
      {},
      authConfig(token),
    );
  });

  it("submitPaymentPurchase posts to purchase", async () => {
    await submitPaymentPurchase(token, "pay-123");
    expect(apiClient.post).toHaveBeenCalledWith(
      "/payments/pay-123/purchase",
      {},
      authConfig(token),
    );
  });
});
