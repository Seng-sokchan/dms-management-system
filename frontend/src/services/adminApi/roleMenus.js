import { apiClient, authConfig } from "../apiClient";

export async function fetchRoleMenus(token) {
  const response = await apiClient.get("/role-menus", authConfig(token));
  return response.data;
}

export async function updateRoleMenus(token, roleName, menuKeys) {
  const response = await apiClient.post(`/role-menus/${encodeURIComponent(roleName)}`, { menuKeys }, authConfig(token));
  return response.data;
}
