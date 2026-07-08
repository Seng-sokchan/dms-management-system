import { renderHook, waitFor, act } from "@testing-library/react-native";
import { io } from "socket.io-client";
import { usePaymentStatus } from "../usePaymentStatus";
import { getPayment } from "../../services/paymentsApi";

jest.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ token: "test-token" }),
}));

jest.mock("../../services/paymentsApi", () => ({
  getPayment: jest.fn(),
}));

jest.mock("../../services/socketUrl", () => ({
  getSocketBaseUrl: () => "http://localhost:3000",
}));

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn(),
}));

describe("usePaymentStatus", () => {
  let socketHandlers;

  beforeEach(() => {
    jest.clearAllMocks();
    socketHandlers = {};
    io.mockImplementation(() => ({
      on: jest.fn((event, handler) => {
        socketHandlers[event] = handler;
      }),
      emit: jest.fn(),
      removeAllListeners: jest.fn(),
      disconnect: jest.fn(),
      connected: false,
    }));
    getPayment.mockResolvedValue({ paymentId: "pay-1", status: "unpaid" });
  });

  it("fetches initial payment status", async () => {
    const { result } = await renderHook(() => usePaymentStatus("pay-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getPayment).toHaveBeenCalledWith("test-token", "pay-1");
    expect(result.current.status).toBe("unpaid");
  });

  it("updates status from socket payment:status event", async () => {
    const { result } = await renderHook(() => usePaymentStatus("pay-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(socketHandlers["payment:status"]).toBeDefined());

    await act(async () => {
      socketHandlers["payment:status"]?.({
        paymentId: "pay-1",
        status: "paid",
      });
    });

    await waitFor(() => expect(result.current.status).toBe("paid"));
  });

  it("stays idle without paymentId", async () => {
    const { result } = await renderHook(() => usePaymentStatus(null));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getPayment).not.toHaveBeenCalled();
    expect(result.current.status).toBe("unpaid");
  });

  it("does not poll when autoRefresh is false", async () => {
    const { result } = await renderHook(() =>
      usePaymentStatus("pay-1", { autoRefresh: false }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    const initialCalls = getPayment.mock.calls.length;

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(getPayment.mock.calls.length).toBe(initialCalls);
    expect(result.current.status).toBe("unpaid");
  });
});
