import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const { pathname } = useLocation();

  const links = [
    { to: "/", label: "Accueil" },
    { to: "/chambres", label: "Chambres" },
    { to: "/apropos", label: "À propos" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar__logo">
        <span className="navbar__logo-icon">H</span>
        HotelHub
      </Link>

      {/* Liens de navigation */}
      <ul className="navbar__links">
        {links.map(({ to, label }) => (
          <li key={to}>
            <Link
              to={to}
              className={`navbar__link ${pathname === to ? "active" : ""}`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Actions droite */}
      <div className="navbar__actions">
        {/* Icône langue */}
        <button className="navbar__globe" aria-label="Changer de langue">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
          </svg>
        </button>

        <button className="navbar__connexion">Connexion</button>
        <button className="navbar__inscription">Inscription</button>
      </div>
    </nav>
  );
}
