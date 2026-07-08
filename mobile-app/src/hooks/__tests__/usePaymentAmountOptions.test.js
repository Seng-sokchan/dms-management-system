import { renderHook, waitFor, act } from "@testing-library/react-native";
import { usePaymentAmountOptions } from "../usePaymentAmountOptions";
import { getPaymentAmountOptions } from "../../services/paymentsApi";
import { mockOrder } from "../../testUtils/paymentFixtures";

jest.mock("../../services/paymentsApi", () => ({
  getPaymentAmountOptions: jest.fn(),
}));

const singleOrder = [mockOrder];
const emptyOrders = [];

describe("usePaymentAmountOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPaymentAmountOptions.mockResolvedValue({
      amounts: { KHR: 50000, USD: 12.5 },
      defaultCurrency: "KHR",
    });
  });

  it("loads amounts from API on mount", async () => {
    const { result } = await renderHook(() =>
      usePaymentAmountOptions({ token: "token", orders: singleOrder }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getPaymentAmountOptions).toHaveBeenCalledWith("token", { orderIds: [42] });
    expect(result.current.amounts.KHR).toBe(50000);
    expect(result.current.amount).toBe(50000);
  });

  it("falls back to order totals when API fails", async () => {
    getPaymentAmountOptions.mockRejectedValue(new Error("network"));
    const { result } = await renderHook(() =>
      usePaymentAmountOptions({ token: "token", orders: singleOrder }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.amounts.KHR).toBe(40000);
    expect(result.current.currency).toBe("KHR");
  });

  it("switches amount when currency changes", async () => {
    const { result } = await renderHook(() =>
      usePaymentAmountOptions({ token: "token", orders: singleOrder }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.setCurrency("USD");
    });

    await waitFor(() => expect(result.current.currency).toBe("USD"));
    expect(result.current.amount).toBe(12.5);
  });

  it("skips API call without token or orders", async () => {
    const { result } = await renderHook(() =>
      usePaymentAmountOptions({ token: "", orders: emptyOrders }),
    );

    expect(getPaymentAmountOptions).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});
