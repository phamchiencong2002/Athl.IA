import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'athlia.token';
const REFRESH_KEY = 'athlia.refreshToken';
const ACCOUNT_ID_KEY = 'athlia.accountId';
const USERNAME_KEY = 'athlia.username';

export async function persistSession(
  token: string,
  refreshToken: string,
  accountId: string,
  username: string,
) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(REFRESH_KEY, refreshToken);
  await AsyncStorage.setItem(ACCOUNT_ID_KEY, accountId);
  await AsyncStorage.setItem(USERNAME_KEY, username);
}

export async function clearSession() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_KEY);
  await AsyncStorage.removeItem(ACCOUNT_ID_KEY);
  await AsyncStorage.removeItem(USERNAME_KEY);
}

export async function getSession() {
  const [token, refreshToken, accountId, username] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(REFRESH_KEY),
    AsyncStorage.getItem(ACCOUNT_ID_KEY),
    AsyncStorage.getItem(USERNAME_KEY),
  ]);
  return { token, refreshToken, accountId, username };
}
