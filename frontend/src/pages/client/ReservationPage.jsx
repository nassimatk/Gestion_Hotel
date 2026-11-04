import { useState } from "react";
import { client } from "../../services/http";
import { getDisponibilites, creerReservation } from "../../services/disponibilitesApi";
import "./ReservationPage.css";

const aujourdhui = new Date().toISOString().slice(0, 10);

function jourSuivant(dateStr) {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function nombreNuits(debut, fin) {
  return Math.round((new Date(fin) - new Date(debut)) / 86400000);
}

function formaterDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function messageErreur(err) {
  if (err.response?.status === 401) return "Veuillez vous connecter pour réserver.";
  return err.response?.data?.error ?? "Une erreur est survenue. Réessayez plus tard.";
}

async function chargerChambres() {
  try {
    const res = await client("chambres").get("/chambres");
    return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
  } catch {
    // chambres-service pas encore prêt : liste fictive (chambres 1 à 10)
    return Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
  }
}

export default function ReservationPage() {
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [periode, setPeriode] = useState(null); // dates réellement recherchées
  const [libres, setLibres] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enCours, setEnCours] = useState(null); // id de la chambre en cours de réservation

  function changerDebut(valeur) {
    setDateDebut(valeur);
    if (dateFin && dateFin <= valeur) setDateFin("");
  }

  async function rechercher(e) {
    e.preventDefault();
    setMessage(null);
    setLibres(null);
    setLoading(true);
    try {
      const [dispo, chambres] = await Promise.all([
        getDisponibilites({ date_debut: dateDebut, date_fin: dateFin }),
        chargerChambres(),
      ]);
      const occupees = dispo.data.chambres_occupees;
      setPeriode({ debut: dateDebut, fin: dateFin });
      setLibres(chambres.filter((c) => !occupees.includes(c.id)));
    } catch (err) {
      setMessage({ type: "error", text: messageErreur(err) });
    } finally {
      setLoading(false);
    }
  }

  async function reserver(chambreId) {
    setMessage(null);
    setEnCours(chambreId);
    try {
      await creerReservation({
        chambre_id: chambreId,
        date_debut: periode.debut,
        date_fin: periode.fin,
      });
      setMessage({
        type: "success",
        text: `Chambre ${chambreId} réservée du ${formaterDate(periode.debut)} au ${formaterDate(periode.fin)}.`,
      });
      setLibres((liste) => liste.filter((c) => c.id !== chambreId));
    } catch (err) {
      setMessage({ type: "error", text: messageErreur(err) });
    } finally {
      setEnCours(null);
    }
  }

  return (
    <section className="reservation">
      <div className="reservation__header">
        <span className="reservation__eyebrow">Réservation</span>
        <h1 className="reservation__title">Réservez votre chambre</h1>
        <p className="reservation__subtitle">
          Choisissez vos dates : nous affichons uniquement les chambres disponibles
          sur toute la durée de votre séjour.
        </p>
      </div>

      <form className="reservation__form" onSubmit={rechercher}>
        <label>
          <span>Arrivée</span>
          <input
            type="date"
            value={dateDebut}
            min={aujourdhui}
            required
            onChange={(e) => changerDebut(e.target.value)}
          />
        </label>
        <label>
          <span>Départ</span>
          <input
            type="date"
            value={dateFin}
            min={dateDebut ? jourSuivant(dateDebut) : aujourdhui}
            required
            onChange={(e) => setDateFin(e.target.value)}
          />
        </label>
        <button type="submit" className="reservation__search" disabled={loading}>
          {loading ? "Recherche..." : "Rechercher"}
        </button>
      </form>

      {message && (
        <p className={`reservation__message reservation__message--${message.type}`}>
          {message.text}
        </p>
      )}

      {libres && (
        <div className="reservation__results">
          <h2 className="reservation__results-title">
            {libres.length > 0
              ? `${libres.length} chambre${libres.length > 1 ? "s" : ""} disponible${libres.length > 1 ? "s" : ""}`
              : "Aucune chambre disponible"}
          </h2>
          <p className="reservation__results-period">
            Du {formaterDate(periode.debut)} au {formaterDate(periode.fin)} (
            {nombreNuits(periode.debut, periode.fin)} nuit
            {nombreNuits(periode.debut, periode.fin) > 1 ? "s" : ""})
          </p>

          {libres.length === 0 && (
            <p className="reservation__empty">
              Essayez d'autres dates pour trouver une chambre libre.
            </p>
          )}

          <ul className="reservation__list">
            {libres.map((c) => {
              const prix = c.prix_nuit ?? c.prix;
              return (
                <li key={c.id} className="reservation__card">
                  <div className="reservation__info">
                    <span className="reservation__badge">Disponible</span>
                    <h3>{c.nom ?? c.numero ?? `Chambre ${c.id}`}</h3>
                    {c.type && <p>{c.type}</p>}
                  </div>
                  <div className="reservation__action">
                    {prix != null && (
                      <span className="reservation__price">
                        {prix} {c.devise ?? "MAD"}<small> / nuit</small>
                      </span>
                    )}
                    <button
                      className="reservation__book"
                      onClick={() => reserver(c.id)}
                      disabled={enCours === c.id}
                    >
                      {enCours === c.id ? "Réservation..." : "Réserver"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}