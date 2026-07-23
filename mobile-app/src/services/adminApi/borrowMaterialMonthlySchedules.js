import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchBorrowMaterialMonthlySchedules(token) {
  const res = await apiClient.get("/customer-borrow-material-monthly-schedules", authConfig(token));
  const rows = unwrapApiData(res.data);
  return Array.isArray(rows) ? rows : [];
}

export async function createBorrowMaterialMonthlySchedule(token, customerId, payload) {
  return apiClient.post(
    `/customers/${customerId}/borrow-material-monthly-schedules`,
    payload,
    authConfig(token),
  );
}

export async function deleteBorrowMaterialMonthlySchedule(token, customerId, id) {
  return apiClient.delete(
    `/customers/${customerId}/borrow-material-monthly-schedules/${id}`,
    authConfig(token),
  );
}
