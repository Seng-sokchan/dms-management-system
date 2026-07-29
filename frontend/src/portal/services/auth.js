import { apiClient, authConfig } from "../../services/apiClient";

export async function deleteMyAccount(token) {
  await apiClient.delete("/users/me", authConfig(token));
}
