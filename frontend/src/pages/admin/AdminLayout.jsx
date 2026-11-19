import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminLayout.css";

const adminLinks = [
  { label: "Dashboard",          to: "/admin",          icon: "⌂", end: true  },
  { label: "Gestion des chambres", to: "/admin/chambres", icon: "▦", end: false },
  { label: "Réservations",       to: "/admin/reservations", icon: "📅", end: false },
  { label: "Clients",            to: "/admin/clients",   icon: "👥", end: false },
  { label: "Avis",               to: "/admin/avis",      icon: "☆", end: false },
  { label: "Paramètres",         to: "/admin/parametres", icon: "⚙", end: false },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-layout">

      <aside className="admin-sidebar">

        {/* Logo */}
        <div className="admin-brand">
          <div className="admin-brand-mark">
            <span>H</span>
          </div>

          <div className="admin-brand-copy">
            <strong>HotelHub Prestige</strong>
            <span>Grand Palace Property</span>
          </div>
        </div>

        {/* Ajouter une chambre */}
        <NavLink
          to="/admin/chambres/ajouter"
          className="admin-add-room"
        >
          <span className="admin-add-icon">⊕</span>
          <span>Ajouter une chambre</span>
        </NavLink>

        {/* Navigation */}
        <nav className="admin-navigation">
          {adminLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="admin-nav-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bas de sidebar */}
        <div className="admin-sidebar-bottom">

          {/* Infos utilisateur connecté */}
          {user && (
            <div style={{
              padding: "10px 14px",
              marginBottom: "8px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "rgba(255,255,255,0.65)",
              lineHeight: "1.5"
            }}>
              <div style={{ fontWeight: "600", color: "rgba(255,255,255,0.9)", marginBottom: "2px" }}>
                {user.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{
                  background: "#c5a880",
                  color: "#fff",
                  fontSize: "9px",
                  padding: "1px 5px",
                  borderRadius: "3px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  {user.role || "admin"}
                </span>
                <span>{user.email}</span>
              </div>
            </div>
          )}

          <a
            className="admin-support-link"
            href="mailto:support@hotelhub.com"
          >
            <span>◉</span>
            <span>Assistance 24/7</span>
          </a>

          <button
            type="button"
            className="admin-logout-link"
            onClick={handleLogout}
          >
            <span>⇥</span>
            <span>Déconnexion</span>
          </button>

        </div>
      </aside>

     <main className="admin-main">
  <Outlet />
</main>

    </div>
  );
}
