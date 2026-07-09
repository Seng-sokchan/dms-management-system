import { resolvePaymentReturnNavigation } from "../paymentReturnRouting";
import { getPayment } from "../../services/paymentsApi";
import {
  navigateToBatchOrderPaymentDeferred,
  navigateToOrderPaymentDeferred,
  navigateToPaymentResultDeferred,
} from "../../navigation/paymentReturnNavigation";

jest.mock("../../services/paymentsApi", () => ({
  getPayment: jest.fn(),
}));

jest.mock("../../navigation/paymentReturnNavigation", () => ({
  navigateToBatchOrderPaymentDeferred: jest.fn(() => Promise.resolve(true)),
  navigateToOrderPaymentDeferred: jest.fn(() => Promise.resolve(true)),
  navigateToPaymentResultDeferred: jest.fn(() => Promise.resolve(true)),
}));

describe("resolvePaymentReturnNavigation", () => {
  const token = "test-token";
  const paymentId = "pay-001";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns false when token or paymentId is missing", async () => {
    expect(await resolvePaymentReturnNavigation(null, { paymentId })).toBe(false);
    expect(await resolvePaymentReturnNavigation(token, {})).toBe(false);
  });

  it("navigates to payment result when status is paid", async () => {
    getPayment.mockResolvedValue({ status: "paid", orderId: 42 });
    const result = await resolvePaymentReturnNavigation(token, {
      paymentId,
      orderId: 42,
      fromAbaReturn: true,
    });
    expect(navigateToPaymentResultDeferred).toHaveBeenCalledWith({
      paymentId,
      orderId: 42,
      masterOrderId: undefined,
      orderIds: undefined,
      fromAbaReturn: true,
      role: "Customer",
    });
    expect(result).toBe(true);
  });

  it("resumes order checkout when unpaid", async () => {
    getPayment.mockResolvedValue({ status: "unpaid", orderId: 42 });
    await resolvePaymentReturnNavigation(token, { paymentId, orderId: 42 });
    expect(navigateToOrderPaymentDeferred).toHaveBeenCalledWith({
      order: { id: 42 },
      role: "Customer",
    });
  });

  it("resumes batch checkout when unpaid with masterOrderId", async () => {
    getPayment.mockResolvedValue({ status: "unpaid", orderIds: [1, 2] });
    await resolvePaymentReturnNavigation(token, {
      paymentId,
      masterOrderId: 12,
      orderIds: [1, 2],
      orders: [{ id: 1 }, { id: 2 }],
      role: "Depot",
    });
    expect(navigateToBatchOrderPaymentDeferred).toHaveBeenCalledWith({
      masterOrderId: 12,
      orders: [{ id: 1 }, { id: 2 }],
      role: "Depot",
    });
  });

  it("does not navigate when status is expired", async () => {
    getPayment.mockResolvedValue({ status: "expired", orderId: 42 });
    const result = await resolvePaymentReturnNavigation(token, { paymentId, orderId: 42 });
    expect(result).toBe(false);
    expect(navigateToPaymentResultDeferred).not.toHaveBeenCalled();
    expect(navigateToOrderPaymentDeferred).not.toHaveBeenCalled();
  });

  it("does not navigate when intent is expired by expiresAt", async () => {
    getPayment.mockResolvedValue({
      status: "unpaid",
      orderId: 42,
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });
    const result = await resolvePaymentReturnNavigation(token, { paymentId, orderId: 42 });
    expect(result).toBe(false);
    expect(navigateToOrderPaymentDeferred).not.toHaveBeenCalled();
  });

  it("returns false when API fails", async () => {
    getPayment.mockRejectedValue(new Error("network"));
    const result = await resolvePaymentReturnNavigation(token, { paymentId, orderId: 42 });
    expect(result).toBe(false);
  });
});
