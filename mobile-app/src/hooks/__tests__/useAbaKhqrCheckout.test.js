import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import { useAbaKhqrCheckout } from "../useAbaKhqrCheckout";
import { resolveAbaPaymentRoute } from "../../utils/resolveAbaPaymentRoute";
import { openAbaPaywayCheckout } from "../../utils/openAbaPayway";
import {
  startPaymentLiveCheck,
  stopPaymentLiveCheck,
} from "../../services/paymentsApi";
import { setPendingPaymentReturn } from "../../services/paymentPendingStorage";
import { mockPaymentIntent } from "../../testUtils/paymentFixtures";
import { AlertProvider } from "../../context/AlertContext";
import { ThemeProvider } from "../../context/ThemeContext";

let mockPaymentStatus = "unpaid";
const mockShowError = jest.fn();
const mockShowWarning = jest.fn();

jest.mock("../../context/AlertContext", () => {
  const actual = jest.requireActual("../../context/AlertContext");
  return {
    ...actual,
    useAlert: () => ({
      showAlert: jest.fn(),
      hideAlert: jest.fn(),
      showError: (...args) => mockShowError(...args),
      showSuccess: jest.fn(),
      showWarning: (...args) => mockShowWarning(...args),
      showInfo: jest.fn(),
    }),
  };
});

jest.mock("../usePaymentStatus", () => ({
  usePaymentStatus: () => ({ status: mockPaymentStatus }),
}));

jest.mock("../../components/KhqrPaymentModal", () => {
  const React = require("react");
  const { View } = require("react-native");
  return function KhqrPaymentModal() {
    return React.createElement(View, { testID: "khqr-modal" });
  };
});

jest.mock("../../components/PaywayCheckoutModal", () => {
  const React = require("react");
  const { View } = require("react-native");
  return function PaywayCheckoutModal() {
    return React.createElement(View, { testID: "webview-modal" });
  };
});

jest.mock("../../utils/resolveAbaPaymentRoute", () => ({
  resolveAbaPaymentRoute: jest.fn(),
}));

jest.mock("../../utils/openAbaPayway", () => ({
  openAbaPaywayCheckout: jest.fn(),
}));

jest.mock("../../utils/resolvePaywayCheckoutIntent", () => ({
  resolvePaywayCheckoutIntent: jest.fn(async (_token, intent) => intent),
}));

jest.mock("../../services/paymentsApi", () => ({
  startPaymentLiveCheck: jest.fn(() => Promise.resolve()),
  stopPaymentLiveCheck: jest.fn(() => Promise.resolve()),
}));

jest.mock("../../services/paymentPendingStorage", () => ({
  setPendingPaymentReturn: jest.fn(() => Promise.resolve()),
}));

function Providers({ children }) {
  return (
    <ThemeProvider initialPreference="light" initialFontSize="medium">
      <AlertProvider>{children}</AlertProvider>
    </ThemeProvider>
  );
}

function mountCheckout(props) {
  const apiRef = { current: null };
  function Harness() {
    const checkout = useAbaKhqrCheckout(props);
    apiRef.current = checkout;
    return checkout.checkoutModals;
  }
  return { apiRef, Harness };
}

async function renderCheckout(props) {
  const { apiRef, Harness } = mountCheckout(props);
  await render(<Harness />, { wrapper: Providers });
  return apiRef;
}

describe("useAbaKhqrCheckout", () => {
  const onPaymentSuccess = jest.fn();
  const buildPendingReturn = jest.fn((intent) => ({ paymentId: intent.paymentId }));

  const defaultProps = {
    token: "test-token",
    user: { id: 1 },
    amountLabel: "40,000 KHR",
    merchantName: "DMS",
    buildPendingReturn,
    onPaymentSuccess,
    resumePaymentLookup: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPaymentStatus = "unpaid";
    resolveAbaPaymentRoute.mockResolvedValue({
      mode: "aba_app",
      deeplinkUrl: "abamobilebank://test",
      qrString: "qr",
      qrImageUrl: null,
      playStoreUrl: null,
      appStoreUrl: null,
      abaInstalled: true,
    });
    openAbaPaywayCheckout.mockResolvedValue({ opened: "aba" });
  });

  async function runCheckout(props, createIntentFn) {
    const apiRef = await renderCheckout(props);
    await waitFor(() => expect(apiRef.current).toBeTruthy());
    await act(async () => {
      await apiRef.current.startCheckout(createIntentFn);
    });
    return apiRef.current;
  }

  it("runs ABA app checkout path on startCheckout success without KHQR modal", async () => {
    const createIntentFn = jest.fn(() => Promise.resolve(mockPaymentIntent));
    const checkout = await runCheckout(defaultProps, createIntentFn);

    expect(createIntentFn).toHaveBeenCalled();
    expect(startPaymentLiveCheck).toHaveBeenCalledWith("test-token", "pay-001");
    expect(setPendingPaymentReturn).toHaveBeenCalled();
    expect(openAbaPaywayCheckout).toHaveBeenCalled();
    expect(checkout.activePaymentId).toBe("pay-001");
  });

  it("shows KHQR only when ABA is not installed", async () => {
    resolveAbaPaymentRoute.mockResolvedValue({
      mode: "khqr_qr",
      qrString: "qr",
      qrImageUrl: "https://example.com/qr.png",
      deeplinkUrl: "abamobilebank://test",
      abaInstalled: false,
    });

    await runCheckout(defaultProps, () => Promise.resolve(mockPaymentIntent));
    expect(openAbaPaywayCheckout).not.toHaveBeenCalled();
  });

  it("falls back to KHQR when ABA deeplink fails to open", async () => {
    openAbaPaywayCheckout.mockResolvedValue({ opened: "failed" });
    await runCheckout(defaultProps, () => Promise.resolve(mockPaymentIntent));
    expect(openAbaPaywayCheckout).toHaveBeenCalled();
  });

  it("alerts and falls back to webview when PayWay route resolution fails", async () => {
    resolveAbaPaymentRoute.mockRejectedValue(new Error("PayWay down"));
    await runCheckout(defaultProps, () => Promise.resolve(mockPaymentIntent));
    expect(mockShowError).toHaveBeenCalled();
  });

  it("alerts and skips checkout for expired intent", async () => {
    const expiredIntent = {
      ...mockPaymentIntent,
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    };
    await runCheckout(defaultProps, () => Promise.resolve(expiredIntent));
    expect(mockShowError).toHaveBeenCalled();
    expect(resolveAbaPaymentRoute).not.toHaveBeenCalled();
  });

  it("calls onPaymentSuccess when polled status becomes paid", async () => {
    mockPaymentStatus = "paid";
    await runCheckout(defaultProps, () => Promise.resolve(mockPaymentIntent));
    await waitFor(() => {
      expect(onPaymentSuccess).toHaveBeenCalledWith("pay-001", expect.any(Object));
    });
  });

  it("alerts and stops live check when status becomes expired", async () => {
    mockPaymentStatus = "expired";
    await runCheckout(defaultProps, () => Promise.resolve(mockPaymentIntent));
    await waitFor(() => {
      expect(mockShowWarning).toHaveBeenCalled();
      expect(stopPaymentLiveCheck).toHaveBeenCalledWith("test-token", "pay-001");
    });
  });

  it("does not start checkout without token", async () => {
    const createIntentFn = jest.fn();
    const apiRef = await renderCheckout({ ...defaultProps, token: "" });
    await waitFor(() => expect(apiRef.current).toBeTruthy());

    await act(async () => {
      await apiRef.current.startCheckout(createIntentFn);
    });

    expect(createIntentFn).not.toHaveBeenCalled();
  });
});
