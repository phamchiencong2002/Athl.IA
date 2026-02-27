import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'athlia.token';
const REFRESH_KEY = 'athlia.refreshToken';
const ACCOUNT_ID_KEY = 'athlia.accountId';

export async function persistSession(token: string, refreshToken: string, accountId: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(REFRESH_KEY, refreshToken);
  await AsyncStorage.setItem(ACCOUNT_ID_KEY, accountId);
}

export async function clearSession() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_KEY);
  await AsyncStorage.removeItem(ACCOUNT_ID_KEY);
}

export async function getSession() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const refreshToken = await AsyncStorage.getItem(REFRESH_KEY);
  const accountId = await AsyncStorage.getItem(ACCOUNT_ID_KEY);
  return { token, refreshToken, accountId };
}
