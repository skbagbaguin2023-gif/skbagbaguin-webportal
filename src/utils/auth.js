const SESSION_KEY = 'sk-admin-authenticated';

// TEMPORARY: hardcoded client-side check. Replace with a real backend/auth service before production.
export async function login(username, password) {
  if (username !== 'admin' || password !== 'admin123') return false;

  sessionStorage.setItem(SESSION_KEY, 'true');
  return true;
}

export function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}
