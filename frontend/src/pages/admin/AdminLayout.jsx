import { Outlet, NavLink, Link } from "react-router-dom";
import "./AdminLayout.css";

export default function AdminLayout() {
  const navItems = [
    {
      to: "/admin",
      label: "Vue d'ensemble",
      end: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      )
    },
    {
      to: "/admin/chambres",
      label: "Gestion des Chambres",
      badge: "Cheffe de projet",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v14M21 7v14M3 14h18M3 7h18a2 2 0 0 1 2 2v5H1V9a2 2 0 0 1 2-2z"></path>
        </svg>
      )
    },
    {
      to: "/admin/avis",
      label: "Modération des Avis",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      )
    },
    {
      to: "/admin/tarifs",
      label: "Tarifs & Promotions",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      )
    },
    {
      to: "/admin/disponibilites",
      label: "Disponibilités & Calendrier",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      )
    }
  ];

  return (
    <div className="admin-layout">
      {/* Barre latérale (Sidebar) */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <Link to="/" className="admin-sidebar__logo">
            HOTELHUB
          </Link>
          <span className="admin-sidebar__badge">ADMINISTRATION</span>
        </div>

        <nav className="admin-sidebar__nav">
          <div className="admin-sidebar__section-title">MODULES GESTION</div>
          <ul className="admin-sidebar__menu">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `admin-sidebar__link ${isActive ? "active" : ""}`
                  }
                >
                  <span className="admin-sidebar__icon">{item.icon}</span>
                  <span className="admin-sidebar__label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="admin-sidebar__footer">
          <Link to="/" className="admin-sidebar__back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Retour au site client
          </Link>
        </div>
      </aside>

      {/* Contenu principal dynamique selon l'onglet */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__title">
            Tableau de Bord Administrateur
          </div>
          <div className="admin-topbar__user">
            <span className="admin-topbar__status-dot"></span>
            Mode Gestion Connecté
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
