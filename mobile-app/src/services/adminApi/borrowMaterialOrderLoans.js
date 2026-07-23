import { apiClient, authConfig, unwrapApiData } from "../apiClient";

export async function fetchBorrowMaterialOrderLoans(token) {
  const res = await apiClient.get("/customer-borrow-material-order-loans", authConfig(token));
  const rows = unwrapApiData(res.data);
  return Array.isArray(rows) ? rows : [];
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
