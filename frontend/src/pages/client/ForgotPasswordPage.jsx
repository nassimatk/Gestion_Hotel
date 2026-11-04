import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { changePasswordDirect } from "../../services/authApi";
import "./Auth.css";

export default function ForgotPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  // Évaluation de la robustesse
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "Standard", percent: 0 };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (pass.length >= 12) score++;

    if (score <= 1) return { score: 1, label: "Faible", percent: 25 };
    if (score === 2) return { score: 2, label: "Moyen", percent: 50 };
    if (score === 3) return { score: 3, label: "Standard", percent: 75 };
    return { score: 4, label: "Robuste", percent: 100 };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Veuillez renseigner tous les champs obligatoires.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Le nouveau mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("La confirmation du mot de passe ne correspond pas.");
      return;
    }

    setLoading(true);

    try {
      await changePasswordDirect({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Erreur lors de la modification. Vérifiez votre mot de passe actuel.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── HEADER ── */}
      <header className="auth-header" style={{ justifyContent: "center" }}>
        <div className="auth-header__logo" style={{ fontSize: "28px" }}>
          HotelHub
          <span className="auth-header__dot"></span>
        </div>
      </header>

      {/* ── CONTENU PRINCIPAL ── */}
      <main className="auth-main" style={{ maxWidth: "520px" }}>
        <h1 className="auth-title">Modifier le mot de passe</h1>
        <p className="auth-subtitle" style={{ maxWidth: "420px" }}>
          Définissez un nouvel accès sécurisé pour protéger vos réservations
          d'exception et vos privilèges HotelHub.
        </p>

        <div className="auth-card" style={{ padding: "36px 36px 28px" }}>
          {error && (
            <div className="auth-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div style={{
              background: "#ecfdf5",
              color: "#065f46",
              border: "1px solid #a7f3d0",
              padding: "18px",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <p style={{ fontWeight: "700", fontSize: "16px", marginBottom: "6px" }}>
                Mot de passe mis à jour avec succès !
              </p>
              <p style={{ fontSize: "13.5px", color: "#047857" }}>
                Redirection automatique vers la connexion en cours...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* 1. Mot de passe actuel */}
              <div className="auth-field" style={{ marginBottom: "22px" }}>
                <label className="auth-label">Mot de passe actuel</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    {/* Cadenas */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    className="auth-input"
                    placeholder="••••••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-input-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label="Afficher ou masquer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 2. Nouveau mot de passe */}
              <div className="auth-field" style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className="auth-label">Nouveau mot de passe</label>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#9ca3af", letterSpacing: "0.5px" }}>
                    RECOMMANDÉ
                  </span>
                </div>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    {/* Clé / Sécurité avec flèche circulaire */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L10 10l-4-4L2 10l4 4 1-1 2 2 1.5-1.5L14 17l4.5-4.5 2 2" />
                    </svg>
                  </span>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="auth-input"
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-input-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label="Afficher ou masquer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Jauge de robustesse (4 segments) */}
              <div style={{ marginBottom: "22px" }}>
                <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      style={{
                        height: "4px",
                        flex: 1,
                        borderRadius: "2px",
                        backgroundColor:
                          step <= strength.score
                            ? strength.score === 1
                              ? "#ef4444"
                              : strength.score === 2
                              ? "#f59e0b"
                              : strength.score >= 3
                              ? "#10b981"
                              : "#e5e7eb"
                            : "#e5e7eb",
                        transition: "background-color 0.3s ease"
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#6b7280" }}>
                  <span>Minimum 8 caractères, dont un chiffre et un symbole</span>
                  <span style={{ fontWeight: "600", color: "#374151" }}>{strength.label}</span>
                </div>
              </div>

              {/* 3. Confirmer le mot de passe */}
              <div className="auth-field" style={{ marginBottom: "26px" }}>
                <label className="auth-label">Confirmer le mot de passe</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    {/* Bouclier avec coche */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="auth-input"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-input-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Afficher ou masquer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Bouton de soumission */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
                style={{ padding: "14px", fontSize: "14.5px" }}
              >
                {loading ? "Mise à jour en cours..." : "Mettre à jour le mot de passe →"}
              </button>
            </form>
          )}

          {/* Lien retour */}
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13.5px",
                fontWeight: "500",
                color: "#4b5563",
                textDecoration: "none"
              }}
            >
              ← Retour à la connexion
            </Link>
          </div>
        </div>

        {/* Support Conciergerie */}
        <div style={{ marginTop: "28px", textAlign: "center", fontSize: "12.5px", color: "#4b5563", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <span>🎧 Besoin d'aide immédiate ?</span>
          <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "var(--color-gold)", fontWeight: "600", textDecoration: "none" }}>
            Contacter la Conciergerie VIP
          </a>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="auth-footer" style={{ borderTop: "none" }}>
        <div className="auth-footer__links">
          <a href="#" onClick={(e) => e.preventDefault()}>Conditions d'utilisation</a>
          <span>•</span>
          <a href="#" onClick={(e) => e.preventDefault()}>Politique de confidentialité</a>
          <span>•</span>
          <a href="#" onClick={(e) => e.preventDefault()}>Conciergerie VIP</a>
        </div>
        <p className="auth-footer__copy" style={{ marginTop: "8px" }}>
          © 2026 HotelHub Hospitality Group. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
