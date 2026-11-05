import { useEffect, useState } from "react";
import { mesReservations, annulerReservation } from "../../services/disponibilitesApi";
import "./ReservationPage.css";
import "./MesReservationsPage.css";

function formaterDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}

function messageErreur(err) {
  if (err.response?.status === 401) return "Veuillez vous connecter pour voir vos réservations.";
  return err.response?.data?.error ?? "Une erreur est survenue. Réessayez plus tard.";
}

export default function MesReservationsPage() {
  const [reservations, setReservations] = useState(null);
  const [message, setMessage] = useState(null);
  const [enCours, setEnCours] = useState(null);

  async function charger() {
    try {
      const res = await mesReservations();
      setReservations(res.data);
    } catch (err) {
      setReservations([]);
      setMessage({ type: "error", text: messageErreur(err) });
    }
  }

  useEffect(() => {
    charger();
  }, []);

  async function annuler(id) {
    if (!window.confirm("Annuler cette réservation ?")) return;
    setMessage(null);
    setEnCours(id);
    try {
      await annulerReservation(id);
      setMessage({ type: "success", text: "Réservation annulée." });
      await charger();
    } catch (err) {
      setMessage({ type: "error", text: messageErreur(err) });
    } finally {
      setEnCours(null);
    }
  }

  return (
    <section className="reservation">
      <div className="reservation__header">
        <span className="reservation__eyebrow">Espace client</span>
        <h1 className="reservation__title">Mes réservations</h1>
      </div>

      {message && (
        <p className={`reservation__message reservation__message--${message.type}`}>
          {message.text}
        </p>
      )}

      {reservations === null && <p>Chargement...</p>}
      {reservations && reservations.length === 0 && !message && (
        <p className="reservation__empty">Vous n'avez aucune réservation.</p>
      )}

      {reservations && reservations.length > 0 && (
        <ul className="reservation__list">
          {reservations.map((r) => (
            <li key={r.id} className="reservation__card">
              <div className="reservation__info">
                <span
                  className={`reservation__badge ${r.statut === "ANNULEE" ? "mes__badge--annulee" : ""}`}
                >
                  {r.statut === "ANNULEE" ? "Annulée" : "Confirmée"}
                </span>
                <h3>Chambre {r.chambre_id}</h3>
                <p>
                  Du {formaterDate(r.date_debut)} au {formaterDate(r.date_fin)}
                </p>
              </div>
              {r.statut === "CONFIRMEE" && (
                <button
                  className="reservation__book mes__cancel"
                  onClick={() => annuler(r.id)}
                  disabled={enCours === r.id}
                >
                  {enCours === r.id ? "Annulation..." : "Annuler"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}