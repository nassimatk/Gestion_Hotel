import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { mesReservations, annulerReservation } from "../../services/disponibilitesApi";
import "./MesReservationsPage.css";

function formaterDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function nombreNuits(debut, fin) {
  if (!debut || !fin) return 0;
  const diff = Math.round((new Date(fin) - new Date(debut)) / 86400000);
  return diff > 0 ? diff : 0;
}

function messageErreur(err) {
  if (err.response?.status === 401) {
    return "Veuillez vous connecter pour consulter vos réservations.";
  }
  return (
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Une erreur est survenue. Veuillez réessayer."
  );
}

export default function MesReservationsPage() {
  const [reservations, setReservations] = useState(null);
  const [message, setMessage] = useState(null);
  const [enCours, setEnCours] = useState(null);

  async function charger() {
    try {
      const res = await mesReservations();
      const liste = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setReservations(liste);
    } catch (err) {
      setReservations([]);
      setMessage({ type: "error", text: messageErreur(err) });
    }
  }

  useEffect(() => {
    charger();
  }, []);

  async function annuler(id) {
    if (!window.confirm("Voulez-vous vraiment annuler cette réservation ?")) return;
    setMessage(null);
    setEnCours(id);
    try {
      await annulerReservation(id);
      setMessage({ type: "success", text: "Votre réservation a bien été annulée." });
      await charger();
    } catch (err) {
      setMessage({ type: "error", text: messageErreur(err) });
    } finally {
      setEnCours(null);
    }
  }

  return (
      <section className="mes-page">
        <div className="mes-header">
          <div>
            <span className="badge">Espace client</span>
            <h1 className="section-title">Mes réservations</h1>
            <p className="section-subtitle" style={{ marginTop: 8 }}>
              Retrouvez l&apos;historique de vos séjours et gérez vos réservations en cours.
            </p>
          </div>

          <Link to="/reservation" className="btn-gold">
            + Nouvelle réservation
          </Link>
        </div>

        {message && (
            <div className={`mes-alert mes-alert--${message.type}`}>
              {message.text}
            </div>
        )}

        {reservations === null && (
            <div className="mes-loading">Chargement de vos réservations...</div>
        )}

        {reservations && reservations.length === 0 && !message && (
            <div className="mes-empty-card">
              <h3>Aucune réservation pour le moment</h3>
              <p>
                Vous n&apos;avez pas encore effectué de réservation sur HotelHub.
              </p>
              <Link to="/reservation" className="btn-dark">
                Réserver un séjour
              </Link>
            </div>
        )}

        {reservations && reservations.length > 0 && (
            <div className="mes-list">
              {reservations.map((r) => {
                const estAnnulee = r.statut === "ANNULEE";
                const nuits = nombreNuits(r.date_debut, r.date_fin);
                const personnes = r.nombre_personnes ?? r.nombrePersonnes;

                return (
                    <article
                        key={r.id}
                        className={`mes-card ${estAnnulee ? "mes-card--annulee" : ""}`}
                    >
                      <div className="mes-card__top">
                        <div>
                          <span className="mes-card__ref">Réservation #{r.id}</span>
                          <h2 className="mes-card__title">Chambre #{r.chambre_id}</h2>
                        </div>

                        <span
                            className={`mes-status ${
                                estAnnulee ? "mes-status--annulee" : "mes-status--confirmee"
                            }`}
                        >
                    {estAnnulee ? "Annulée" : "Confirmée"}
                  </span>
                      </div>

                      <div className="mes-card__grid">
                        <div className="mes-card__item">
                          <span>Arrivée</span>
                          <strong>{formaterDate(r.date_debut)}</strong>
                        </div>

                        <div className="mes-card__item">
                          <span>Départ</span>
                          <strong>{formaterDate(r.date_fin)}</strong>
                        </div>

                        <div className="mes-card__item">
                          <span>Durée</span>
                          <strong>
                            {nuits} nuit{nuits > 1 ? "s" : ""}
                          </strong>
                        </div>

                        {personnes != null && (
                            <div className="mes-card__item">
                              <span>Voyageurs</span>
                              <strong>
                                {personnes} personne{personnes > 1 ? "s" : ""}
                              </strong>
                            </div>
                        )}

                        {r.telephone && (
                            <div className="mes-card__item">
                              <span>Téléphone</span>
                              <strong>{r.telephone}</strong>
                            </div>
                        )}
                      </div>

                      <div className="mes-card__footer">
                  <span className="mes-card__payment">
                    Règlement sur place à l&apos;arrivée
                  </span>

                        {r.statut === "CONFIRMEE" && (
                            <button
                                type="button"
                                className="mes-cancel-btn"
                                onClick={() => annuler(r.id)}
                                disabled={enCours === r.id}
                            >
                              {enCours === r.id ? "Annulation..." : "Annuler la réservation"}
                            </button>
                        )}
                      </div>
                    </article>
                );
              })}
            </div>
        )}
      </section>
  );
}