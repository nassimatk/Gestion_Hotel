import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getChambres, deleteChambre } from "../../../services/chambresApi";
import ChambreFormModal from "./ChambreFormModal";
import "./AdminChambres.css";

// Photos élégantes de secours si l'enregistrement n'a pas d'image
const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80",
  "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600&q=80",
];

export default function AdminChambresPage() {
  const [chambres, setChambres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Message de confirmation / alerte en haut
  const [alertMessage, setAlertMessage] = useState(
    "La chambre Suite Royale Atlas a été mise à jour avec succès."
  );
  const [alertSub, setAlertSub] = useState(
    "Modifications tarifaires et inventaire synchronisés sur l'ensemble des canaux."
  );
  const [showAlert, setShowAlert] = useState(true);

  // Modale édition / création
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChambre, setEditingChambre] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchChambres = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getChambres();
      setChambres(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Impossible de charger les chambres.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChambres();
  }, []);

  const handleOpenEdit = (chambre) => {
    setEditingChambre(chambre);
    setIsModalOpen(true);
  };

  const handleDelete = async (chambre) => {
    if (window.confirm(`Voulez-vous vraiment supprimer la chambre N° ${chambre.numero} ?`)) {
      try {
        await deleteChambre(chambre.id);
        setAlertMessage(`La chambre N° ${chambre.numero} a été supprimée avec succès.`);
        setAlertSub("La chambre a été archivée (Soft Delete) conformément aux règles d'intégrité.");
        setShowAlert(true);
        fetchChambres();
      } catch (err) {
        alert("Erreur lors de la suppression : " + err.message);
      }
    }
  };

  const handleSaved = () => {
    setIsModalOpen(false);
    setEditingChambre(null);
    setAlertMessage("La chambre a été enregistrée avec succès.");
    setAlertSub("Données synchronisées dans la base de données PostgreSQL de chambres-service.");
    setShowAlert(true);
    fetchChambres();
  };

  // Formatage des montants
  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-FR").format(Number(price || 0));
  };

  // Calcul pagination
  const totalItems = chambres.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentChambres = chambres.slice(startIndex, endIndex);

  return (
    <div className="admin-chambres-page">
      {/* Bannière de notification supérieure */}
      {showAlert && (
        <div className="admin-alert-banner">
          <div className="admin-alert-content">
            <div className="admin-alert-icon-wrapper">
              <span>✓</span>
            </div>
            <div>
              <div className="admin-alert-text">
                {alertMessage}
              </div>
              <div className="admin-alert-sub">{alertSub}</div>
            </div>
          </div>
          <button
            type="button"
            className="admin-alert-close"
            onClick={() => setShowAlert(false)}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      )}

      {/* État de chargement / erreur */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7280" }}>
          Chargement des chambres en cours...
        </div>
      )}

      {error && !loading && (
        <div style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#991b1b",
          padding: "16px",
          borderRadius: "10px",
          marginBottom: "24px",
          textAlign: "center"
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Grille des cartes de chambres (3 colonnes) */}
      {!loading && !error && (
        <>
          <div className="admin-rooms-grid">
            {currentChambres.map((c, idx) => {
              // Récupérer une image
              const imageSrc =
                Array.isArray(c.images) && c.images.length > 0
                  ? c.images[0]
                  : DEFAULT_IMAGES[idx % DEFAULT_IMAGES.length];

              // Normalisation statut
              const statut = c.statut || "disponible";
              const statutLabel =
                statut === "disponible"
                  ? "DISPONIBLE"
                  : statut === "occupee"
                  ? "OCCUPÉE"
                  : "MAINTENANCE";

              // Titre raffiné
              const displayTitle = c.nom || `Chambre ${c.type ? c.type.toUpperCase() : "STANDARD"} N° ${c.numero}`;

              // Description
              const displayDesc =
                c.description || "Vue panoramique d'exception, finitions de prestige et confort sur-mesure.";

              // Étage label
              const etageLabel = c.etage ? `Étage ${c.etage}` : "RDC";

              return (
                <div key={c.id} className="room-card-prestige">
                  {/* Photo & Badges flottants */}
                  <div className="room-card-media">
                    <img
                      src={imageSrc}
                      alt={displayTitle}
                      onError={(e) => {
                        e.target.src = DEFAULT_IMAGES[0];
                      }}
                    />

                    {/* Statut (haut droite) */}
                    <div className={`room-card-status-badge ${statut}`}>
                      <span className="status-dot-sm"></span>
                      <span>{statutLabel}</span>
                    </div>

                    {/* Numéro & Étage (bas gauche) */}
                    <div className="room-card-number-badge">
                      N° {c.numero} • {etageLabel}
                    </div>
                  </div>

                  {/* Corps de la carte */}
                  <div className="room-card-content">
                    <h3 className="room-card-title">{displayTitle}</h3>
                    <p className="room-card-desc">{displayDesc}</p>

                    {/* Grille des caractéristiques */}
                    <div className="room-card-features-grid">
                      <div className="room-feature-item">
                        <span className="room-feature-icon">◲</span>
                        <span>{etageLabel}</span>
                      </div>
                      <div className="room-feature-item">
                        <span className="room-feature-icon">👥</span>
                        <span>{c.capacite || 2} adultes</span>
                      </div>
                      <div className="room-feature-item">
                        <span className="room-feature-icon">🛏</span>
                        <span>1 Lit King Size</span>
                      </div>
                      <div className="room-feature-item">
                        <span className="room-feature-icon">📐</span>
                        <span>{c.superficie || 45} m²</span>
                      </div>
                    </div>

                    {/* Ligne Tarif */}
                    <div className="room-card-pricing-row">
                      <div className="room-pricing-left">
                        <span className="room-pricing-label">TARIF STANDARD</span>
                        <div className="room-pricing-amount-group">
                          <span className="room-pricing-amount">
                            {formatPrice(c.prix_nuit)}
                          </span>
                          <span className="room-pricing-unit">MAD / nuit</span>
                        </div>
                      </div>
                      <div className="room-pricing-right">
                        <span>Taxes et services<br />inclus</span>
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="room-card-actions">
                      <Link
                        to={`/admin/chambres/modifier/${c.id}`}
                        className="room-btn-edit"
                        style={{ textDecoration: "none" }}
                      >
                        <span>✎</span>
                        <span>Modifier</span>
                      </Link>
                      <button
                        type="button"
                        className="room-btn-delete"
                        onClick={() => handleDelete(c)}
                        title="Archiver cette chambre"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination inférieure conforme à la maquette */}
          <div className="admin-pagination-bar">
            <div>
              Affichage de <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong> à{" "}
              <strong>{endIndex}</strong> sur <strong>{totalItems}</strong> chambres
            </div>

            <div className="admin-pagination-pages">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                ›
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modale d'édition */}
      {isModalOpen && (
        <ChambreFormModal
          chambre={editingChambre}
          onClose={() => {
            setIsModalOpen(false);
            setEditingChambre(null);
          }}
          onSuccess={handleSaved}
        />
      )}
    </div>
  );
}
