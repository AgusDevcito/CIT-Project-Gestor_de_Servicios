import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

// /profile devuelve el perfil con el usuario anidado en "User".
const normalizeProfile = (profile) => {
  if (!profile?.User) return null;
  return {
    userId: profile.User.id,
    profileId: profile.id,
    username: profile.User.username,
    email: profile.User.email,
    role: profile.User.role,
    firstName: profile.first_name,
    lastName: profile.last_name,
    avatarUrl: profile.avatar_url,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkSession = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      const normalized = normalizeProfile(profile);
      setUser(normalized);
      return normalized;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    checkSession().finally(() => setLoading(false));
  }, [checkSession]);

  // El apiClient dispara este evento cuando el backend responde 401.
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      if (!window.location.pathname.startsWith('/login')) {
        navigate('/login');
      }
    };
    window.addEventListener('cit:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('cit:unauthorized', handleUnauthorized);
  }, [navigate]);

  const login = async (username, password) => {
    await authService.login(username, password);
    await checkSession();
  };

  const register = async (formData) => authService.register(formData);

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
