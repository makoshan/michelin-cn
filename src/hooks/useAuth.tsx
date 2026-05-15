import { useState, useEffect, createContext, useContext } from "react";
import { trpc } from "@/providers/trpc";

interface User {
  id: number;
  username: string;
  name: string | null;
  email: string | null;
  role: string;
  avatar: string | null;
}

interface AuthContext {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: Partial<User> & { id: number; username: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContext>({
  user: null,
  isLoading: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: oauthUser } = trpc.auth.me.useQuery(undefined, { retry: false });
  const { data: localUser } = trpc.localAuth.me.useQuery(undefined, { retry: false });

  useEffect(() => {
    if (oauthUser) {
      setUser({
        id: oauthUser.id,
        username: oauthUser.username || oauthUser.unionId || "user",
        name: oauthUser.name,
        email: oauthUser.email,
        role: oauthUser.role,
        avatar: oauthUser.avatar,
      });
      setIsLoading(false);
    } else if (localUser) {
      setUser(localUser as User);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [oauthUser, localUser]);

  const login = (token: string, userData: Partial<User> & { id: number; username: string }) => {
    localStorage.setItem("local_auth_token", token);
    setUser(userData as User);
    window.location.reload();
  };

  const logout = () => {
    localStorage.removeItem("local_auth_token");
    setUser(null);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
