import { createContext, useContext, useState, useEffect } from "react";
import { login as apiLogin, register as apiRegister, logout as apiLogout, me as apiMe } from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger le profil de l'utilisateur si un token existe
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    apiMe()
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        // Token invalide ou expiré
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email, password) => {
    const res = await apiLogin({ email, password });
    // Récupérer les informations de l'utilisateur connecté
    const meRes = await apiMe();
    setUser(meRes.data);
    return res;
  };

  const register = async (name, email, password) => {
    const res = await apiRegister({ name, email, password });
    // Auto-login après inscription
    await login(email, password);
    return res;
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
}
