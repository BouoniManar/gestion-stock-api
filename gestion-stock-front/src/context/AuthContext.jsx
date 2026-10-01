import { createContext, useContext } from 'react';

export const AuthContext = createContext({ user: null, isAdmin: true });
export const useAuth = () => useContext(AuthContext);