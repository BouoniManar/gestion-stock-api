import API from './api';

const KEY = 'stockmanager_session';

export const getSession = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
export const clearSession = () => localStorage.removeItem(KEY);

// Envoie automatiquement le token Sanctum avec chaque requête
API.interceptors.request.use((cfg) => {
  const s = getSession();
  if (s?.token) cfg.headers.Authorization = `Bearer ${s.token}`;
  cfg.headers.Accept = 'application/json';
  return cfg;
});

// Appelle fn() si le token est refusé (expiré ou supprimé)
export const onUnauthorized = (fn) => {
  const id = API.interceptors.response.use((r) => r, (err) => {
    if (err.response?.status === 401 && !String(err.config?.url).includes('/login')) fn();
    return Promise.reject(err);
  });
  return () => API.interceptors.response.eject(id);
};

export const login = async (email, password) => {
  const res = await API.post('/login', { email, password });
  const session = { token: res.data.token, user: res.data.user };
  localStorage.setItem(KEY, JSON.stringify(session));
  return session;
};

export const register = async (data) => {
  // On adapte le champ 'nom' du front vers 'name' attendu par Laravel, 
  // et on garde 'password_confirmation' pour la règle '|confirmed'
  const payload = {
    name: data.nom,
    email: data.email,
    password: data.password,
    password_confirmation: data.password_confirmation || data.password
  };

  const res = await API.post('/register', payload);
  
  // Normalisation : si Laravel renvoie 'name', on ajoute aussi 'nom' 
  // pour que session.user.nom fonctionne direct dans ton Toast/App.jsx
  const user = res.data.user;
  if (user && user.name && !user.nom) {
    user.nom = user.name;
  }

  const session = { token: res.data.access_token || res.data.token, user: user };
  localStorage.setItem(KEY, JSON.stringify(session));
  return session;
};
export const logout = async () => {
  try { await API.post('/logout'); } catch { /* token déjà invalide */ }
  clearSession();
};