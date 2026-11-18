import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { login as apiLogin, register as apiRegister, logout as apiLogout, me as apiMe } from "../services/authApi";

const AuthContext = createContext(null);

/**
 * Vérifie si un objet utilisateur a le rôle "admin".
 * Compatible avec { role: "admin" } et { role: { name: "admin" } }
 */
function checkIsAdmin(user) {
  if (!user) return false;
  return user.role === "admin" || user?.role?.name === "admin";
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Chargement initial : rehydrater depuis le token localStorage ──────────
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
        // Token invalide ou expiré → nettoyage
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await apiLogin({ email, password });
    // Récupérer le profil complet (incluant le rôle)
    const meRes = await apiMe();
    setUser(meRes.data);
    return meRes.data;          // ← retourne l'utilisateur (avec son rôle)
  }, []);

  // ── register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    const res = await apiRegister({ name, email, password });
    // Auto-login après inscription
    return await login(email, password);
  }, [login]);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  const isAdmin = checkIsAdmin(user);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      isAdmin,
    }}>
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
