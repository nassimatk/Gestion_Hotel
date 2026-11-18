export default function AdminAvisPage() {
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
        backgroundColor: "#eff6ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#3b82f6"
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </div>

      <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px" }}>
        Module : Modération des Avis Clients
      </h2>
      <p style={{ color: "#64748b", fontSize: "14px", maxWidth: "520px", margin: "0 auto 24px", lineHeight: "1.6" }}>
        Cet espace est réservé pour l'intégration de <strong>avis-service</strong> (port 8002).  
        Votre collègue responsable des avis peut développer ses composants ici en toute autonomie.
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
        📍 Fichier source : <code>frontend/src/pages/admin/avis/AdminAvisPage.jsx</code>
      </div>
    </div>
  );
}
