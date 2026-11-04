export default function AdminTarifsPage() {
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
        backgroundColor: "#ecfdf5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#10b981"
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      </div>

      <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px" }}>
        Module : Tarifs & Promotions
      </h2>
      <p style={{ color: "#64748b", fontSize: "14px", maxWidth: "520px", margin: "0 auto 24px", lineHeight: "1.6" }}>
        Cet espace est réservé pour l'intégration de <strong>tarifs-service</strong> (port 8004).  
        Le responsable des tarifs peut développer ses composants ici en toute autonomie.
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
        📍 Fichier source : <code>frontend/src/pages/admin/tarifs/AdminTarifsPage.jsx</code>
      </div>
    </div>
  );
}
