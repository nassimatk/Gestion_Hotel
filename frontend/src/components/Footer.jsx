import "./Footer.css";

export default function Footer() {
  const navigation = [
    { label: "Accueil", href: "/" },
    { label: "Chambres & Suites", href: "/chambres" },
    { label: "À propos du Groupe", href: "/apropos" },
    { label: "Contact & Presse", href: "/contact" },
  ];

  const services = [
    { label: "Conciergerie VIP", href: "#" },
    { label: "Assistance 24/7", href: "#" },
    { label: "Transferts Aéroports Privés", href: "#" },
    { label: "Programme Membre Privilège", href: "#" },
  ];

  const mentions = [
    { label: "Mentions Légales", href: "#" },
    { label: "Confidentialité", href: "#" },
    { label: "Conditions Générales", href: "#" },
    { label: "Presse", href: "#" },
  ];

  const cities = ["Paris", "Monaco", "Genève", "Dubaï"];

  return (
    <footer className="footer">
      <div className="footer__top">
        {/* Colonne brand */}
        <div>
          <div className="footer__brand-logo">
            <span className="footer__brand-logo-icon">H</span>
            HotelHub
          </div>
          <p className="footer__brand-desc">
            La référence pour la réservation de résidences hôtelières prestigieuses et
            de suites d'exception à travers les plus belles destinations mondiales.
          </p>
          <div className="footer__social">
            {/* Icône partage */}
            <button className="footer__social-btn" aria-label="Partager">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
            {/* Icône email */}
            <button className="footer__social-btn" aria-label="Nous contacter">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Colonne Navigation */}
        <div>
          <p className="footer__col-title">Navigation</p>
          <ul className="footer__col-links">
            {navigation.map(({ label, href }) => (
              <li key={label}>
                <a href={href} className="footer__col-link">{label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Colonne Services */}
        <div>
          <p className="footer__col-title">Services & Conciergerie</p>
          <ul className="footer__col-links">
            {services.map(({ label, href }) => (
              <li key={label}>
                <a href={href} className="footer__col-link">{label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Colonne Mentions */}
        <div>
          <p className="footer__col-title">Mentions & Confidentialité</p>
          <ul className="footer__col-links">
            {mentions.map(({ label, href }) => (
              <li key={label}>
                <a href={href} className="footer__col-link">{label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bas du footer */}
      <div className="footer__bottom">
        <p className="footer__copyright">
          © 2024 HotelHub Hospitality Group. Tous droits réservés.
        </p>
        <div className="footer__cities">
          {cities.map((city, i) => (
            <span key={city} className="footer__city">
              {i > 0 && <span style={{ marginRight: 20, opacity: 0.3 }}>·</span>}
              {city}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
