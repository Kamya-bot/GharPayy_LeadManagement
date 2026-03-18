import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  identity?: string;
  zone?: string | null;
  zoneId?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isZoneAdmin: boolean;
  signOut: () => Promise<void>;
  checkUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isZoneAdmin: false,
  signOut: async () => {},
  checkUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser({
          id: data.user._id || data.user.id,
          email: data.user.email,
          fullName: data.user.fullName,
          role: data.user.role,
          identity: data.user.identity || null,
          zone: data.user.zone || null,
          zoneId: data.user.zoneId || null,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/auth';
    } catch {
      console.error('Logout failed');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isZoneAdmin = user?.role === 'zone_admin';

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isZoneAdmin, signOut, checkUser }}>
      {children}
    </AuthContext.Provider>
  );
};