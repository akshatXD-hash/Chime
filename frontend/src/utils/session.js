const KEY = 'chime_session';
let session;

export function getSession() {
  if (session !== undefined) return session;
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved !== null) {
      session = JSON.parse(saved);
    } else {
      const user = JSON.parse(localStorage.getItem('chime_user') || 'null');
      const token = localStorage.getItem('chime_token');
      session = user && token ? { user, token } : null;
      sessionStorage.setItem(KEY, JSON.stringify(session));
    }
  } catch { session = null; }
  return session;
}

export function saveSession(next) {
  session = next;
  try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  if (next) {
    try {
      localStorage.setItem('chime_user', JSON.stringify(next.user));
      localStorage.setItem('chime_token', next.token);
    } catch {}
  }
}

export function clearSession() {
  const token = getSession()?.token;
  saveSession(null);
  try {
    if (localStorage.getItem('chime_token') === token) {
      localStorage.removeItem('chime_user');
      localStorage.removeItem('chime_token');
    }
  } catch {}
}
