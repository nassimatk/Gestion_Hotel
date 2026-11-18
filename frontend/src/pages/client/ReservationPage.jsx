import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getChambres, getChambre } from "../../services/chambresApi";
import {
  getDisponibilites,
  verifierChambre,
  creerReservation,
} from "../../services/disponibilitesApi";
import { getTarifs } from "../../services/tarifsApi";
import "./ReservationPage.css";

const aujourdhui = new Date().toISOString().slice(0, 10);

const CHAMBRES_HOST = (
  import.meta.env.VITE_CHAMBRES_API_URL || "http://localhost:8001/api/chambres"
).replace(/\/api\/chambres\/?$/, "");

const IMAGES_SECOURS = [
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80",
];

function imageSecours(id) {
  const idx = Math.abs(Number(id || 1) - 1) % IMAGES_SECOURS.length;
  return IMAGES_SECOURS[idx];
}

function resoudreImageChambre(chambre) {
  const brut =
    chambre?.image_url ||
    chambre?.image ||
    chambre?.photo ||
    (Array.isArray(chambre?.images) ? chambre.images[0] : null);

  if (!brut) return imageSecours(chambre?.id);
  if (brut.startsWith("http://") || brut.startsWith("https://")) return brut;
  return `${CHAMBRES_HOST}${brut.startsWith("/") ? "" : "/"}${brut}`;
}

function nomChambre(chambre) {
  return (
    chambre?.nom ||
    (chambre?.numero ? `Chambre ${chambre.numero}` : `Chambre #${chambre?.id}`)
  );
}

function jourSuivant(dateStr) {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function nombreNuits(debut, fin) {
  if (!debut || !fin) return 0;
  const diff = Math.round((new Date(fin) - new Date(debut)) / 86400000);
  return diff > 0 ? diff : 0;
}

function formaterDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function messageErreur(err) {
  if (err.response?.status === 401) {
    return "Veuillez vous connecter pour finaliser votre réservation.";
  }
  return (
    err.response?.data?.message ||
    err.response?.data?.error ||
    "Une erreur est survenue. Veuillez réessayer."
  );
}

async function chargerChambres() {
  try {
    const res = await getChambres();
    return Array.isArray(res) ? res : res?.data ?? [];
  } catch {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      nom: `Suite Signature #${i + 1}`,
      type: "Suite Prestige",
      capacite: 4,
      prix_nuit: 540,
      devise: "MAD",
    }));
  }
}

async function chargerChambreParId(id) {
  try {
    const res = await getChambre(id);
    return res?.data ?? res;
  } catch {
    return {
      id: Number(id),
      nom: `Suite Signature #${id}`,
      type: "Suite Prestige",
      capacite: 4,
      prix_nuit: 540,
      devise: "MAD",
    };
  }
}

export default function ReservationPage() {
  const { chambreId: paramChambreId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const initialChambreId = paramChambreId || searchParams.get("chambreId") || "";
  const initialDebut = searchParams.get("date_debut") || aujourdhui;
  const initialFin = searchParams.get("date_fin") || jourSuivant(initialDebut);
  const initialPersonnes = Number(searchParams.get("adultes")) || 2;

  // États recherche (quand aucune chambre n'est encore sélectionnée)
  const [dateDebut, setDateDebut] = useState(initialDebut);
  const [dateFin, setDateFin] = useState(initialFin);
  const [nombrePersonnes, setNombrePersonnes] = useState(initialPersonnes);
  const [libres, setLibres] = useState(null);
  const [loadingRecherche, setLoadingRecherche] = useState(false);

  // États chambre sélectionnée & formulaire
  const [selectedChambre, setSelectedChambre] = useState(null);
  const [loadingChambre, setLoadingChambre] = useState(Boolean(initialChambreId));
  const [telephone, setTelephone] = useState("");
  const [nomClient, setNomClient] = useState("");
  const [emailClient, setEmailClient] = useState("");

  // Tarif calculé (service Tarifs ou fallback prix_nuit * nuits)
  const [prixTotalTarifs, setPrixTotalTarifs] = useState(null);

  // Soumission & Confirmation
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  // Préremplir depuis le profil connecté
  useEffect(() => {
    if (user) {
      setNomClient(user.name || "");
      setEmailClient(user.email || "");
    }
  }, [user]);

  // Charger directement la chambre si l'ID est présent dans l'URL
  useEffect(() => {
    if (!initialChambreId) return;
    let actif = true;
    setLoadingChambre(true);
    chargerChambreParId(initialChambreId).then((chambre) => {
      if (actif) {
        setSelectedChambre(chambre);
        setLoadingChambre(false);
      }
    });
    return () => {
      actif = false;
    };
  }, [initialChambreId]);

  // Lancer la recherche automatiquement si les dates viennent de HomePage
  useEffect(() => {
    if (!initialChambreId && searchParams.get("date_debut") && searchParams.get("date_fin")) {
      rechercherChambres();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Interroger le microservice Tarifs si disponible
  useEffect(() => {
    if (!selectedChambre || !dateDebut || !dateFin) return;
    const nuits = nombreNuits(dateDebut, dateFin);
    if (nuits <= 0) {
      setPrixTotalTarifs(null);
      return;
    }

    let actif = true;
    getTarifs({
      chambre_id: selectedChambre.id,
      date_debut: dateDebut,
      date_fin: dateFin,
    })
      .then((res) => {
        if (!actif) return;
        const total = res.data?.total ?? res.data?.prix_total;
        setPrixTotalTarifs(typeof total === "number" ? total : null);
      })
      .catch(() => {
        if (actif) setPrixTotalTarifs(null);
      });

    return () => {
      actif = false;
    };
  }, [selectedChambre, dateDebut, dateFin]);

  function changerDebut(valeur) {
    setDateDebut(valeur);
    if (dateFin && dateFin <= valeur) {
      setDateFin(jourSuivant(valeur));
    }
  }

  async function rechercherChambres(e) {
    if (e) e.preventDefault();
    setMessage(null);
    setLibres(null);
    setLoadingRecherche(true);
    try {
      const [dispo, chambres] = await Promise.all([
        getDisponibilites({ date_debut: dateDebut, date_fin: dateFin }),
        chargerChambres(),
      ]);
      const occupees = dispo.data?.chambres_occupees ?? [];
      const disponibles = chambres.filter(
        (c) =>
          !occupees.includes(c.id) &&
          (!c.capacite || c.capacite >= Number(nombrePersonnes))
      );
      setLibres(disponibles);
    } catch (err) {
      setMessage({ type: "error", text: messageErreur(err) });
    } finally {
      setLoadingRecherche(false);
    }
  }

  async function confirmerReservation(e) {
    e.preventDefault();
    setMessage(null);

    if (!isAuthenticated) {
      setMessage({
        type: "error",
        text: "Vous devez être connecté pour confirmer une réservation.",
      });
      return;
    }

    if (!telephone.trim()) {
      setMessage({
        type: "error",
        text: "Veuillez saisir votre numéro de téléphone.",
      });
      return;
    }

    const nuits = nombreNuits(dateDebut, dateFin);
    if (nuits <= 0) {
      setMessage({
        type: "error",
        text: "La date de départ doit être après la date d'arrivée.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const check = await verifierChambre(selectedChambre.id, {
        date_debut: dateDebut,
        date_fin: dateFin,
      }).catch(() => null);

      if (check && check.data?.disponible === false) {
        setMessage({
          type: "error",
          text: "Désolé, cette chambre vient d'être réservée sur ces dates.",
        });
        setSubmitting(false);
        return;
      }

      const res = await creerReservation({
        chambre_id: Number(selectedChambre.id),
        date_debut: dateDebut,
        date_fin: dateFin,
        nombre_personnes: Number(nombrePersonnes),
        telephone: telephone.trim(),
      });

      const prixNuit = selectedChambre.prix_nuit ?? selectedChambre.prix ?? 0;
      const total = prixTotalTarifs ?? prixNuit * nuits;

      setConfirmation({
        id: res.data?.id,
        chambre: selectedChambre,
        dateDebut,
        dateFin,
        nuits,
        nombrePersonnes: Number(nombrePersonnes),
        telephone: telephone.trim(),
        total,
        devise: selectedChambre.devise ?? "MAD",
      });
    } catch (err) {
      setMessage({ type: "error", text: messageErreur(err) });
    } finally {
      setSubmitting(false);
    }
  }

  // ── ÉCRAN 3 : CONFIRMATION DE RÉSERVATION ──
  if (confirmation) {
    return (
      <section className="res-page">
        <div className="res-confirm-card">
          <span className="res-confirm-card__badge">Réservation confirmée</span>
          <h1 className="res-confirm-card__title">
            Merci {nomClient || "pour votre confiance"} !
          </h1>
          <p className="res-confirm-card__subtitle">
            Votre séjour est enregistré
            {confirmation.id ? ` sous la référence #${confirmation.id}` : ""}.
            Le règlement s&apos;effectuera directement sur place à l&apos;arrivée.
          </p>

          <div className="res-confirm-card__grid">
            <div>
              <span>Hébergement</span>
              <strong>{nomChambre(confirmation.chambre)}</strong>
            </div>
            <div>
              <span>Dates du séjour</span>
              <strong>
                {formaterDate(confirmation.dateDebut)} →{" "}
                {formaterDate(confirmation.dateFin)} ({confirmation.nuits} nuit
                {confirmation.nuits > 1 ? "s" : ""})
              </strong>
            </div>
            <div>
              <span>Voyageurs</span>
              <strong>
                {confirmation.nombrePersonnes} personne
                {confirmation.nombrePersonnes > 1 ? "s" : ""}
              </strong>
            </div>
            <div>
              <span>Téléphone de contact</span>
              <strong>{confirmation.telephone}</strong>
            </div>
            <div>
              <span>Total à régler sur place</span>
              <strong>
                {confirmation.total.toLocaleString("fr-FR")} {confirmation.devise}
              </strong>
            </div>
          </div>

          <div className="res-confirm-card__actions">
            <Link to="/mes-reservations" className="btn-dark">
              Voir mes réservations
            </Link>
            <Link to="/" className="btn-gold">
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ── ÉCRAN 1 : RECHERCHE & SÉLECTION DE CHAMBRE ──
  if (!selectedChambre && !loadingChambre) {
    return (
      <section className="res-page">
        <div className="res-header">
          <span className="badge">Disponibilités en temps réel</span>
          <h1 className="section-title">Réservez votre séjour</h1>
          <p className="section-subtitle">
            Sélectionnez vos dates et le nombre de voyageurs pour consulter nos suites disponibles.
          </p>
        </div>

        <form className="res-search-bar" onSubmit={rechercherChambres}>
          <label className="res-search-bar__field">
            <span>Arrivée</span>
            <input
              type="date"
              value={dateDebut}
              min={aujourdhui}
              required
              onChange={(e) => changerDebut(e.target.value)}
            />
          </label>
          <label className="res-search-bar__field">
            <span>Départ</span>
            <input
              type="date"
              value={dateFin}
              min={dateDebut ? jourSuivant(dateDebut) : aujourdhui}
              required
              onChange={(e) => setDateFin(e.target.value)}
            />
          </label>
          <label className="res-search-bar__field">
            <span>Voyageurs</span>
            <select
              value={nombrePersonnes}
              onChange={(e) => setNombrePersonnes(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n > 1 ? "personnes" : "personne"}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="btn-dark res-search-bar__btn"
            disabled={loadingRecherche}
          >
            {loadingRecherche ? "Recherche..." : "Rechercher"}
          </button>
        </form>

        {message && (
          <div className={`res-alert res-alert--${message.type}`}>
            {message.text}
          </div>
        )}

        {libres && (
          <div className="res-results">
            <h2 className="res-results__heading">
              {libres.length > 0
                ? `${libres.length} chambre${libres.length > 1 ? "s" : ""} disponible${libres.length > 1 ? "s" : ""}`
                : "Aucune chambre disponible sur ces dates"}
            </h2>
            <div className="res-results__grid">
              {libres.map((chambre) => {
                const prix = chambre.prix_nuit ?? chambre.prix ?? 0;
                return (
                  <article key={chambre.id} className="res-room-card">
                    <div className="res-room-card__media">
                      <img
                        src={resoudreImageChambre(chambre)}
                        alt={nomChambre(chambre)}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = imageSecours(chambre.id);
                        }}
                      />
                    </div>

                    <div className="res-room-card__body">
                      <div className="res-room-card__top">
                        <span className="res-room-card__tag">Disponible</span>
                        {chambre.capacite && (
                          <span className="res-room-card__cap">
                            Max {chambre.capacite} pers.
                          </span>
                        )}
                      </div>
                      <h3>{nomChambre(chambre)}</h3>
                      {chambre.type && (
                        <p className="res-room-card__type">{chambre.type}</p>
                      )}
                      <div className="res-room-card__footer">
                        <div className="res-room-card__price">
                          <strong>
                            {prix} {chambre.devise ?? "MAD"}
                          </strong>
                          <span> / nuit</span>
                        </div>
                        <button
                          type="button"
                          className="btn-dark"
                          onClick={() => {
                            setMessage(null);
                            setSelectedChambre(chambre);
                          }}
                        >
                          Sélectionner
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>
    );
  }

  if (loadingChambre) {
    return (
      <section className="res-page">
        <p className="res-loading">Chargement de votre sélection...</p>
      </section>
    );
  }

  // ── ÉCRAN 2 : FINALISER VOTRE RÉSERVATION ──
  const nuits = nombreNuits(dateDebut, dateFin);
  const prixNuit = selectedChambre.prix_nuit ?? selectedChambre.prix ?? 0;
  const totalSejour = prixTotalTarifs ?? prixNuit * nuits;
  const devise = selectedChambre.devise ?? "MAD";
  const capaciteMax = selectedChambre.capacite ?? 4;

  return (
    <section className="res-page">
      <div className="res-topbar">
        <div className="res-breadcrumb">
          <Link to="/">Accueil</Link>
          <span>/</span>
          <button
            type="button"
            className="res-breadcrumb__link"
            onClick={() => setSelectedChambre(null)}
          >
            Chambres disponibles
          </button>
          <span>/</span>
          <strong>{nomChambre(selectedChambre)}</strong>
        </div>

        <div className="res-stepper">
          <div className="res-stepper__step is-active">
            <span className="res-stepper__num">1</span>
            <span>Coordonnées &amp; Séjour</span>
          </div>
          <div className="res-stepper__line" />
          <div className="res-stepper__step">
            <span className="res-stepper__num">2</span>
            <span>Confirmation</span>
          </div>
        </div>
      </div>

      <div className="res-checkout">
        {/* COLONNE GAUCHE : FORMULAIRE */}
        <div className="res-checkout__main">
          <div className="res-checkout__intro">
            <span className="badge">HotelHub — Réservation directe</span>
            <h1 className="section-title">Finaliser votre réservation</h1>
            <p className="section-subtitle">
              Vérifiez les détails de votre séjour et renseignez votre numéro de téléphone pour confirmer.
            </p>
          </div>

          {!isAuthenticated && (
            <div className="res-alert res-alert--warning">
              <span>Vous n&apos;êtes pas connecté.</span>
              <Link to="/login" className="res-alert__cta">
                Se connecter pour réserver →
              </Link>
            </div>
          )}

          {message && (
            <div className={`res-alert res-alert--${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={confirmerReservation} className="res-checkout__form">
            <div className="res-card">
              <h2 className="res-card__title">Coordonnées du voyageur principal</h2>
              <div className="res-form-grid">
                <label className="res-field">
                  <span>Nom complet</span>
                  <input
                    type="text"
                    value={nomClient}
                    readOnly={isAuthenticated}
                    placeholder="Votre nom complet"
                    onChange={(e) => setNomClient(e.target.value)}
                  />
                </label>

                <label className="res-field">
                  <span>Adresse e-mail</span>
                  <input
                    type="email"
                    value={emailClient}
                    readOnly={isAuthenticated}
                    placeholder="exemple@email.com"
                    onChange={(e) => setEmailClient(e.target.value)}
                  />
                </label>

                <label className="res-field">
                  <span>Téléphone *</span>
                  <input
                    type="tel"
                    value={telephone}
                    required
                    placeholder="Ex : 06 12 34 56 78"
                    onChange={(e) => setTelephone(e.target.value)}
                  />
                  <small>Pour la confirmation et le suivi de votre arrivée.</small>
                </label>

                <label className="res-field">
                  <span>Nombre de personnes *</span>
                  <select
                    value={nombrePersonnes}
                    onChange={(e) => setNombrePersonnes(Number(e.target.value))}
                  >
                    {Array.from({ length: capaciteMax }, (_, i) => i + 1).map(
                      (n) => (
                        <option key={n} value={n}>
                          {n} {n > 1 ? "personnes" : "personne"}
                        </option>
                      )
                    )}
                  </select>
                  <small>Capacité maximale : {capaciteMax} personnes.</small>
                </label>
              </div>
            </div>

            <div className="res-card">
              <h2 className="res-card__title">Dates du séjour</h2>
              <div className="res-form-grid">
                <label className="res-field">
                  <span>Date d&apos;arrivée *</span>
                  <input
                    type="date"
                    value={dateDebut}
                    min={aujourdhui}
                    required
                    onChange={(e) => changerDebut(e.target.value)}
                  />
                </label>
                <label className="res-field">
                  <span>Date de départ *</span>
                  <input
                    type="date"
                    value={dateFin}
                    min={dateDebut ? jourSuivant(dateDebut) : aujourdhui}
                    required
                    onChange={(e) => setDateFin(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="res-card res-card--notice">
              <h2 className="res-card__title">Modalités de règlement</h2>
              <p>
                <strong>Règlement sur place à l&apos;arrivée :</strong> aucun paiement en ligne n&apos;est débité lors de la réservation. Vous pouvez consulter ou annuler votre réservation à tout moment depuis la rubrique <em>Mes réservations</em>.
              </p>
            </div>

            <button
              type="submit"
              className="btn-dark res-submit-btn"
              disabled={submitting || !isAuthenticated}
            >
              {submitting
                ? "Confirmation en cours..."
                : "CONFIRMER LA RÉSERVATION →"}
            </button>
          </form>
        </div>

        {/* COLONNE DROITE : CARTE RÉCAPITULATIF STICKY */}
        <aside className="res-checkout__sidebar">
          <div className="res-summary">
            <img
              src={resoudreImageChambre(selectedChambre)}
              alt={nomChambre(selectedChambre)}
              className="res-summary__img"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = imageSecours(selectedChambre.id);
              }}
            />

            <div className="res-summary__body">
              <span className="res-summary__eyebrow">
                {selectedChambre.type ?? "Hébergement d'exception"}
              </span>
              <h3 className="res-summary__name">
                {nomChambre(selectedChambre)}
              </h3>

              <div className="res-summary__specs">
                <span>Capacité : {capaciteMax} pers.</span>
                {selectedChambre.superficie && (
                  <span>{selectedChambre.superficie} m²</span>
                )}
              </div>

              <div className="res-summary__dates">
                <div>
                  <small>ARRIVÉE</small>
                  <strong>{formaterDate(dateDebut)}</strong>
                </div>
                <div>
                  <small>DÉPART</small>
                  <strong>{formaterDate(dateFin)}</strong>
                </div>
              </div>

              <div className="res-summary__meta">
                <span>
                  Durée : <strong>{nuits} nuit{nuits > 1 ? "s" : ""}</strong>
                </span>
                <span>
                  Voyageurs : <strong>{nombrePersonnes}</strong>
                </span>
              </div>

              <div className="res-summary__breakdown">
                <div className="res-summary__row">
                  <span>
                    {nuits} nuit{nuits > 1 ? "s" : ""} × {prixNuit} {devise}
                  </span>
                  <span>
                    {(prixNuit * nuits).toLocaleString("fr-FR")} {devise}
                  </span>
                </div>
                <div className="res-summary__row">
                  <span>Taxes &amp; frais de service</span>
                  <span>Inclus</span>
                </div>
              </div>

              <div className="res-summary__total">
                <div>
                  <span>TOTAL SÉJOUR TTC</span>
                  <small>Règlement sur place à l&apos;arrivée</small>
                </div>
                <strong>
                  {totalSejour.toLocaleString("fr-FR")} {devise}
                </strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}