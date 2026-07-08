import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import PaymentAmountCard from "../PaymentAmountCard";

jest.mock("../../../context/ThemeContext", () => ({
  useTheme: () => ({
    colors: {
      surface: "#ffffff",
      surfaceMuted: "#f3f4f6",
      border: "#e5e7eb",
      primary: "#2563eb",
      onPrimary: "#ffffff",
      textMuted: "#6b7280",
      textPrimary: "#111827",
      textSecondary: "#4b5563",
      warningSoft: "#FEF3C7",
    },
    spacing: { lg: 16, md: 12, sm: 8 },
    typography: {
      caption: 12,
      bodySmall: 14,
      body: 16,
      h1: 32,
    },
    radii: { lg: 12, md: 8, sm: 6 },
    borders: { panel: {} },
  }),
}));

describe("PaymentAmountCard", () => {
  const defaultProps = {
    label: "Amount to pay",
    amount: 40000,
    currency: "KHR",
    onCurrencyChange: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders KHR and USD segments", async () => {
    const { getByLabelText } = await render(<PaymentAmountCard {...defaultProps} />);
    expect(getByLabelText("KHR")).toBeTruthy();
    expect(getByLabelText("USD")).toBeTruthy();
  });

  it("highlights selected currency", async () => {
    const { getByLabelText } = await render(<PaymentAmountCard {...defaultProps} />);
    expect(getByLabelText("KHR").props.accessibilityState.selected).toBe(true);
    expect(getByLabelText("USD").props.accessibilityState.selected).toBe(false);
  });

  it("calls onCurrencyChange when segment is pressed", async () => {
    const onCurrencyChange = jest.fn();
    const { getByLabelText } = await render(
      <PaymentAmountCard {...defaultProps} onCurrencyChange={onCurrencyChange} />,
    );

    fireEvent.press(getByLabelText("USD"));
    expect(onCurrencyChange).toHaveBeenCalledWith("USD");
  });

  it("shows loading state", async () => {
    const { getByText } = await render(<PaymentAmountCard {...defaultProps} loading />);
    expect(getByText("payment.loadingAmount")).toBeTruthy();
  });

  it("formats KHR amount", async () => {
    const { getByText } = await render(<PaymentAmountCard {...defaultProps} />);
    expect(getByText((40000).toLocaleString())).toBeTruthy();
  });

  it("shows unavailable placeholder when amount is null", async () => {
    const { getByText } = await render(<PaymentAmountCard {...defaultProps} amount={null} />);
    expect(getByText("payment.amountUnavailable")).toBeTruthy();
  });
});
