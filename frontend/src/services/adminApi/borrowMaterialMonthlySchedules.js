import { apiClient, authConfig } from "../apiClient";

export async function fetchBorrowMaterialMonthlySchedules(token) {
  return apiClient.get("/customer-borrow-material-monthly-schedules", authConfig(token));
}

export async function createBorrowMaterialMonthlySchedule(token, customerId, payload) {
  return apiClient.post(
    `/customers/${customerId}/borrow-material-monthly-schedules`,
    payload,
    authConfig(token),
  );
}

export async function fetchBorrowMaterialMonthlyScheduleDetail(token, customerId, scheduleId) {
  return apiClient.get(
    `/customers/${customerId}/borrow-material-monthly-schedules/${scheduleId}`,
    authConfig(token),
  );
}

export async function deleteBorrowMaterialMonthlySchedule(token, customerId, id) {
  return apiClient.delete(
    `/customers/${customerId}/borrow-material-monthly-schedules/${id}`,
    authConfig(token),
  );
}
