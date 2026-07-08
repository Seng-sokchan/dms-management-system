import React from "react";
import { render, renderHook } from "@testing-library/react-native";
import { AlertProvider } from "../context/AlertContext";
import { ThemeProvider } from "../context/ThemeContext";

function Providers({ children }) {
  return (
    <ThemeProvider initialPreference="light" initialFontSize="medium">
      <AlertProvider>{children}</AlertProvider>
    </ThemeProvider>
  );
}

export async function renderWithProviders(ui, options = {}) {
  return render(ui, {
    wrapper: Providers,
    ...options,
  });
}

export async function renderHookWithProviders(callback, options = {}) {
  return renderHook(callback, {
    wrapper: Providers,
    ...options,
  });
}
