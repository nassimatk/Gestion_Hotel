export default function AdminDisponibilitesPage() {
  return (
    <div style={{
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      padding: "48px 32px",
      textAlign: "center",
      border: "1px dashed #cbd5e1"
    }}>
      <div style={{
        width: "56px",
        height: "56px",
        margin: "0 auto 16px",
        borderRadius: "50%",
        backgroundColor: "#f5f3ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#8b5cf6"
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>

      <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px" }}>
        Module : Disponibilités & Calendrier
      </h2>
      <p style={{ color: "#64748b", fontSize: "14px", maxWidth: "520px", margin: "0 auto 24px", lineHeight: "1.6" }}>
        Cet espace est réservé pour l'intégration de <strong>disponibilites-service</strong> (port 8003).  
        Le responsable des disponibilités peut développer ses vues et plannings ici.
      </p>

      <div style={{
        display: "inline-block",
        backgroundColor: "#f8fafc",
        padding: "12px 20px",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        fontSize: "13px",
        color: "#475569"
      }}>
        📍 Fichier source : <code>frontend/src/pages/admin/disponibilites/AdminDisponibilitesPage.jsx</code>
      </div>
    </div>
  );
}
