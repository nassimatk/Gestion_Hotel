import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword, validateResetToken } from "../../services/authApi";
import "./Auth.css";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Jeton de réinitialisation manquant dans l'URL.");
      setCheckingToken(false);
      return;
    }

    validateResetToken(token)
      .then(() => {
        setTokenValid(true);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Le lien de réinitialisation est invalide ou expiré.");
      })
      .finally(() => {
        setCheckingToken(false);
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || !passwordConfirmation) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("La confirmation du mot de passe ne correspond pas.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword({
        token,
        password,
        password_confirmation: passwordConfirmation,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Erreur lors de la réinitialisation du mot de passe.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── HEADER ── */}
      <header className="auth-header">
        <Link to="/login" className="auth-header__back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Retour à la connexion
        </Link>

        <div className="auth-header__logo">
          HotelHub
          <span className="auth-header__dot"></span>
        </div>
      </header>

      {/* ── CONTENU PRINCIPAL ── */}
      <main className="auth-main">
        <h1 className="auth-title">Nouveau mot de passe</h1>
        <p className="auth-subtitle">
          Choisissez un nouveau mot de passe robuste pour votre compte.
        </p>

        <div className="auth-card">
          {checkingToken ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#6b7280" }}>
              Vérification du lien de réinitialisation...
            </div>
          ) : error && !tokenValid ? (
            <div>
              <div className="auth-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <Link to="/forgot-password" className="auth-forgot" style={{ fontSize: "14px", fontWeight: "600" }}>
                  Refaire une demande de réinitialisation →
                </Link>
              </div>
            </div>
          ) : success ? (
            <div style={{
              background: "#ecfdf5",
              color: "#065f46",
              border: "1px solid #a7f3d0",
              padding: "16px",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <p style={{ fontWeight: "700", fontSize: "15px", marginBottom: "6px" }}>
                Mot de passe mis à jour avec succès !
              </p>
              <p style={{ fontSize: "13px", color: "#047857" }}>
                Redirection automatique vers la page de connexion en cours...
              </p>
            </div>
          ) : (
            <>
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

              <form onSubmit={handleSubmit}>
                {/* Nouveau Mot de passe */}
                <div className="auth-field">
                  <label className="auth-label">Nouveau mot de passe</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="auth-input"
                      placeholder="Au moins 8 caractères"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-input-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Afficher ou masquer le mot de passe"
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirmation mot de passe */}
                <div className="auth-field">
                  <label className="auth-label">Confirmez le nouveau mot de passe</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="auth-input"
                      placeholder="Répétez le mot de passe"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? "Modification en cours..." : "Valider le nouveau mot de passe"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="auth-footer">
        <p className="auth-footer__copy">
          © 2026 HotelHub. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
