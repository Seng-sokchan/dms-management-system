import axios from "axios";
import { API_BASE_URL } from "../config/appConfig";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export function authConfig(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export function unwrapApiData(payload) {
  if (payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload.data;
  }
  return payload;
}

export function getApiErrorMessage(error, fallback = "Request failed") {
  return (
    error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.message
    || fallback
  );
}
