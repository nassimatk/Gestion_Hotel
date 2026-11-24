import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * RequireAdmin — Garde de route côté frontend
 *
 * - Si le chargement est en cours → affiche un spinner
 * - Si l'utilisateur n'est pas connecté → redirige vers /login
 * - Si l'utilisateur est connecté mais n'est pas admin → affiche une page "Accès refusé"
 * - Sinon → affiche les enfants (routes admin)
 */
export default function RequireAdmin({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. En cours de chargement du profil
  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#faf9f5",
        flexDirection: "column",
        gap: "16px"
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "3px solid #e5e7eb",
          borderTop: "3px solid #c5a880",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#6b7280", fontSize: "14px" }}>Vérification des autorisations…</p>
      </div>
    );
  }

  // 2. Non connecté → rediriger vers login en gardant l'URL cible
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Connecté mais pas admin → page "Accès refusé"
  const isAdmin = user?.role === "admin" || user?.role?.name === "admin";
  if (!isAdmin) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#faf9f5",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>
        <div style={{
          textAlign: "center",
          maxWidth: "480px",
          padding: "48px 32px",
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)"
        }}>
          {/* Icône */}
          <div style={{
            width: "72px",
            height: "72px",
            background: "#fef2f2",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "32px"
          }}>
            🚫
          </div>

          <h1 style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#111827",
            margin: "0 0 12px"
          }}>
            Accès refusé
          </h1>

          <p style={{
            color: "#6b7280",
            fontSize: "14.5px",
            lineHeight: "1.6",
            margin: "0 0 8px"
          }}>
            Cette zone est réservée aux administrateurs HotelHub.
          </p>

          <p style={{
            color: "#9ca3af",
            fontSize: "13px",
            margin: "0 0 32px"
          }}>
            Votre compte <strong style={{ color: "#374151" }}>{user?.name}</strong> a le rôle{" "}
            <span style={{
              background: "#f3f4f6",
              padding: "2px 8px",
              borderRadius: "4px",
              fontWeight: "600",
              color: "#374151"
            }}>
              {user?.role || "client"}
            </span>
            {" "}et ne dispose pas des droits nécessaires.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="/"
              style={{
                background: "#0f1d2d",
                color: "#fff",
                padding: "10px 24px",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "14px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              ← Retour à l'accueil
            </a>
            <a
              href="/login"
              style={{
                background: "#fff",
                color: "#374151",
                padding: "10px 24px",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                textDecoration: "none"
              }}
            >
              Se connecter en tant qu'admin
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 4. Admin vérifié → accès accordé
  return children;
}
