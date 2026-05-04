import { apiClient, authConfig } from "../apiClient";

export async function fetchBorrowMaterialOrderLoans(token) {
  return apiClient.get("/customer-borrow-material-order-loans", authConfig(token));
}

export async function createBorrowMaterialOrderLoan(token, customerId, payload) {
  return apiClient.post(
    `/customers/${customerId}/borrow-material-order-loans`,
    payload,
    authConfig(token),
  );
}

export async function deleteBorrowMaterialOrderLoan(token, customerId, id) {
  return apiClient.delete(
    `/customers/${customerId}/borrow-material-order-loans/${id}`,
    authConfig(token),
  );
}
