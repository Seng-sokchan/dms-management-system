import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "dms_mobile_token";
const USER_KEY = "dms_mobile_user";

export async function saveSession({ token, user }) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token || ""],
    [USER_KEY, JSON.stringify(user || null)],
  ]);
}

export async function loadSession() {
  const [[, token], [, userJson]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
  return {
    token: token || "",
    user: userJson ? JSON.parse(userJson) : null,
  };
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
