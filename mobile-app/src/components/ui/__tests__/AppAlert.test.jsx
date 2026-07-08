import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import AppAlert from "../AppAlert";
import { useAlert } from "../../../context/AlertContext";
import { ThemeProvider } from "../../../context/ThemeContext";
import { renderWithProviders } from "../../../testUtils/renderWithProviders";
function ThemeOnly({ children }) {
  return (
    <ThemeProvider initialPreference="light" initialFontSize="medium">
      {children}
    </ThemeProvider>
  );
}

describe("AppAlert", () => {
  it("renders tone icon, title, and message", async () => {
    const view = await render(
      <AppAlert visible title="Submit failed" message="Could not submit batch." tone="error" />,
      { wrapper: ThemeOnly },
    );

    expect(view.getByTestId("app-alert")).toBeTruthy();
    expect(view.getByTestId("app-alert-icon-error")).toBeTruthy();
    expect(view.getByText("Submit failed")).toBeTruthy();
    expect(view.getByText("Could not submit batch.")).toBeTruthy();
  });

  it("calls action onPress and onRequestClose", async () => {
    const onPress = jest.fn();
    const onRequestClose = jest.fn();

    const view = await render(
      <AppAlert
        visible
        title="Payment required"
        message="Pay before placing a new order."
        tone="warning"
        onRequestClose={onRequestClose}
        actions={[{ text: "Pay now", onPress }]}
      />,
      { wrapper: ThemeOnly },
    );

    fireEvent.press(view.getByTestId("app-alert-action-0"));
    expect(onRequestClose).toHaveBeenCalled();
    expect(onPress).toHaveBeenCalled();
  });
});

function AlertHarness({ onReady }) {
  const alert = useAlert();

  useEffect(() => {
    onReady?.(alert);
  }, [alert, onReady]);

  return (
    <View>
      <Text testID="alert-harness">ready</Text>
    </View>
  );
}

describe("useAlert", () => {
  it("shows success and error alerts via helpers", async () => {
    let api;
    const view = await renderWithProviders(
      <AlertHarness
        onReady={(value) => {
          api = value;
        }}
      />,
    );

    await waitFor(() => expect(api).toBeTruthy());
    expect(view.getByTestId("alert-harness")).toBeTruthy();

    await act(async () => {
      api.showSuccess("Ready", "Pre-order submitted");
    });
    await waitFor(() => {
      expect(view.getByText("Ready")).toBeTruthy();
      expect(view.getByTestId("app-alert-icon-success")).toBeTruthy();
    });

    await act(async () => {
      api.hideAlert();
    });
    await waitFor(() => {
      expect(view.queryByText("Ready")).toBeNull();
    });

    await act(async () => {
      api.showError("Login failed", "Invalid credentials");
    });
    await waitFor(() => {
      expect(view.getByText("Login failed")).toBeTruthy();
      expect(view.getByTestId("app-alert-icon-error")).toBeTruthy();
    });
  });
});
