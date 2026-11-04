import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const cards = [
    {
      title: "Chambres",
      desc: "Catalogue, équipements, tarifs par nuit et disponibilité.",
      link: "/admin/chambres",
      badge: "Actif",
      color: "#c5a880"
    },
    {
      title: "Avis Clients",
      desc: "Modération des avis, validation et notes moyennes.",
      link: "/admin/avis",
      badge: "En attente",
      color: "#3b82f6"
    },
    {
      title: "Tarifs & Promotions",
      desc: "Gestion des prix saisonniers et remises exceptionnelles.",
      link: "/admin/tarifs",
      badge: "En attente",
      color: "#10b981"
    },
    {
      title: "Disponibilités",
      desc: "Calendrier des réservations et blocages de périodes.",
      link: "/admin/disponibilites",
      badge: "En attente",
      color: "#8b5cf6"
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px" }}>
          Bienvenue sur le portail de gestion HotelHub
        </h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "14.5px" }}>
          Sélectionnez un module ci-dessous pour gérer les opérations de l'établissement.
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "20px"
      }}>
        {cards.map((c) => (
          <div
            key={c.title}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ fontSize: "17px", fontWeight: "600", margin: 0, color: "#0f172a" }}>
                  {c.title}
                </h3>
                <span style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  backgroundColor: c.badge === "Actif" ? "#fef3c7" : "#f1f5f9",
                  color: c.badge === "Actif" ? "#92400e" : "#64748b"
                }}>
                  {c.badge}
                </span>
              </div>
              <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: "1.5", margin: "0 0 20px" }}>
                {c.desc}
              </p>
            </div>

            <Link
              to={c.link}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13.5px",
                fontWeight: "600",
                color: c.color,
                textDecoration: "none"
              }}
            >
              Accéder au module →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
