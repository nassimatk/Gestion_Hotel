import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Veuillez renseigner votre email et votre mot de passe.");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      // Redirection vers l'accueil après connexion
      navigate("/");
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Erreur de connexion. Vérifiez que le serveur est démarré.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── HEADER ── */}
      <header className="auth-header">
        <Link to="/" className="auth-header__back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Retour à l'accueil
        </Link>

        <div className="auth-header__logo">
          HotelHub
          <span className="auth-header__dot"></span>
        </div>
      </header>

      {/* ── CONTENU PRINCIPAL ── */}
      <main className="auth-main">
        <h1 className="auth-title">Connexion</h1>
        <p className="auth-subtitle">
          Connectez-vous pour accéder à vos réservations et vos privilèges HotelHub.
        </p>

        <div className="auth-card">
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
            {/* Adresse Email */}
            <div className="auth-field">
              <label className="auth-label">Adresse Email</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="alexandre.durand@hotelhub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="auth-field">
              <label className="auth-label">Mot de passe</label>
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
                  placeholder="•••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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

            {/* Options : Se souvenir de moi & Mot de passe oublié */}
            <div className="auth-options">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Se souvenir de moi
              </label>

              <a href="#" className="auth-forgot" onClick={(e) => e.preventDefault()}>
                Mot de passe oublié ?
              </a>
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? "Connexion en cours..." : "Se connecter →"}
            </button>
          </form>

          {/* Lien vers Inscription */}
          <div className="auth-switch">
            Vous n'avez pas encore de compte ?
            <Link to="/register">Créer un compte</Link>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="auth-footer">
        <div className="auth-footer__links">
          <a href="#">Conditions d'utilisation</a>
          <span>·</span>
          <a href="#">Politique de confidentialité</a>
        </div>
        <p className="auth-footer__copy">
          © 2025 HotelHub. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
