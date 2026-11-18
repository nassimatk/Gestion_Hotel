
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import "./ReservationPage.css";

// ==============================
// FORMATAGE DU PRIX
// ==============================
const formatPrix = (valeur) =>
  `${Number(valeur || 0).toLocaleString("fr-FR")} DH`;

// ==============================
// PAGE RÉSERVATION
// ==============================
function ReservationPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // ==============================
  // RÉCUPÉRATION DES DONNÉES
  // ==============================
  const reservation = location.state;

  const chambre = reservation?.chambre;

  // ==============================
  // VALIDATION DES DONNÉES
  // ==============================
  const donneesValides =
    reservation &&
    chambre &&
    chambre.id !== undefined &&
    chambre.id !== null;

  // ==============================
  // CALCUL DU TOTAL
  // ==============================
  const prixTotalCalcule = useMemo(() => {
    if (!donneesValides) return 0;

    return (
      Number(chambre.prixNuit || 0) *
      Number(reservation.nombreNuits || 0)
    );
  }, [donneesValides, chambre, reservation]);

  if (!donneesValides) {
    return (
      <div className="reservation-page">
        <div className="reservation-empty">
          <h2>Aucune réservation sélectionnée</h2>

          <p>
            Veuillez sélectionner une chambre depuis notre catalogue.
          </p>

          <button
            type="button"
            onClick={() => navigate("/chambres")}
          >
            Découvrir les chambres
          </button>
        </div>
      </div>
    );
  }

  const {
    dateArrivee,
    dateDepart,
    nombrePersonnes,
    nombreNuits,
  } = reservation;

  // ==============================
  // RETOUR
  // ==============================
  const handleRetour = () => {
    navigate(`/chambres/${chambre.id}`);
  };

  // ==============================
  // CONFIRMATION
  // ==============================
  const handleConfirmer = () => {
    alert(
      "Récapitulatif validé. La création définitive nécessite la connexion au backend Réservation."
    );
  };

  // ==============================
  // AFFICHAGE
  // ==============================
  return (
    <div className="reservation-page">
      <div className="reservation-container">

        {/* HEADER */}
        <div className="reservation-page-header">
          <span>HOTELHUB</span>
          <h1>Votre réservation</h1>
          <p>Vérifiez les informations de votre séjour.</p>
        </div>

        <div className="reservation-layout">

          {/* ==============================
              INFORMATIONS CHAMBRE
          ============================== */}
          <section className="reservation-details">

            <div className="reservation-section-title">
              <span>01</span>
              <h2>Votre chambre</h2>
            </div>

            <div className="reservation-room-card">

              {/* IMAGE */}
              {chambre.images?.length > 0 ? (
                <img
                  src={chambre.images[0]}
                  alt={`Chambre ${chambre.numero}`}
                  className="reservation-room-image"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="no-image">
                  Aucune image disponible
                </div>
              )}

              {/* INFORMATIONS */}
              <div className="reservation-room-info">

                <span className="reservation-eyebrow">
                  HOTELHUB
                </span>

                <h3>
                  {chambre.titre || chambre.type || "Chambre"}
                </h3>

                <p>
                  Chambre N° {chambre.numero || chambre.id}
                </p>

                <p>
                  {chambre.superficie || 0} m²
                </p>

                <p>
                  Capacité : {chambre.capacite} voyageurs
                </p>

                <p>
                  Vue : {chambre.vue || "Non précisée"}
                </p>

                <strong>
                  {formatPrix(chambre.prixNuit)} / nuit
                </strong>

              </div>
            </div>

            {/* ==============================
                INFORMATIONS SÉJOUR
            ============================== */}
            <div className="reservation-section-title">
              <span>02</span>
              <h2>Votre séjour</h2>
            </div>

            <div className="reservation-stay-card">

              <div className="reservation-stay-item">
                <span>Arrivée</span>
                <strong>{dateArrivee}</strong>
              </div>

              <div className="reservation-stay-item">
                <span>Départ</span>
                <strong>{dateDepart}</strong>
              </div>

              <div className="reservation-stay-item">
                <span>Durée</span>
                <strong>{nombreNuits} nuit(s)</strong>
              </div>

              <div className="reservation-stay-item">
                <span>Voyageurs</span>
                <strong>{nombrePersonnes}</strong>
              </div>

            </div>

            {/* RETOUR */}
            <button
              type="button"
              className="reservation-back-btn"
              onClick={handleRetour}
            >
              ← Modifier mon séjour
            </button>

          </section>

          {/* ==============================
              RÉCAPITULATIF
          ============================== */}
          <aside className="reservation-summary">

            <span className="reservation-eyebrow">
              RÉCAPITULATIF
            </span>

            <h2>Résumé de votre réservation</h2>

            <div className="summary-line">
              <span>Chambre</span>
              <strong>{chambre.numero || chambre.id}</strong>
            </div>

            <div className="summary-line">
              <span>Prix par nuit</span>
              <strong>
                {formatPrix(chambre.prixNuit)}
              </strong>
            </div>

            <div className="summary-line">
              <span>Nombre de nuits</span>
              <strong>{nombreNuits}</strong>
            </div>

            <div className="summary-line">
              <span>Voyageurs</span>
              <strong>{nombrePersonnes}</strong>
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Total du séjour</span>
              <strong>
                {formatPrix(prixTotalCalcule)}
              </strong>
            </div>

            {/* CONFIRMATION */}
            <button
              type="button"
              className="reservation-confirm-btn"
              onClick={handleConfirmer}
            >
              Confirmer la réservation
            </button>

            <p className="reservation-note">
              Le montant affiché correspond au prix calculé
              pour la durée sélectionnée.
            </p>

          </aside>

        </div>
      </div>
    </div>
  );
}

export default ReservationPage;
