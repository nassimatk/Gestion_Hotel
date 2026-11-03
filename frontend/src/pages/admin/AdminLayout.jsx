
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./AdminLayout.css";

const adminLinks = [
    { label: "Dashboard", to: "/admin/dashboard", icon: "⌂" },

    { label: "Gestion des chambres", to: "/admin/chambres", icon: "▦" },

  { label: "Réservations", to: "/admin/reservations", icon: "" },
  { label: "Clients", to: "/admin/clients", icon: "" },
  { label: "Avis", to: "/admin/avis", icon: "☆" },
  { label: "Paramètres", to: "/admin/parametres", icon: "" },
];
export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Ajoutez ici votre logique de déconnexion
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
              end
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
