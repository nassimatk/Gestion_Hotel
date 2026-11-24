
import { useState, useEffect } from "react";
import {
  useParams,
  useSearchParams,
  useLocation,
  Link,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  getChambres,
  getChambre,
} from "../../services/chambresApi";

import {
  getDisponibilites,
  verifierChambre,
  creerReservation,
} from "../../services/disponibilitesApi";

import { getTarifs } from "../../services/tarifsApi";

import "./ReservationPage.css";

// ==================================================
// CONFIGURATION
// ==================================================

function obtenirDateLocale(date = new Date()) {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
}

const aujourdhui = obtenirDateLocale();

const CHAMBRES_HOST = (
  import.meta.env.VITE_CHAMBRES_API_URL ||
  "http://localhost:8001/api/chambres"
).replace(/\/api\/chambres\/?$/, "");

const IMAGES_SECOURS = [
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80",
];

// ==================================================
// FONCTIONS UTILITAIRES
// ==================================================

function imageSecours(id) {
  const idx =
    Math.abs(Number(id || 1) - 1) % IMAGES_SECOURS.length;

  return IMAGES_SECOURS[idx];
}

function resoudreImageChambre(chambre) {
  let images = chambre?.images;

  if (typeof images === "string") {
    try {
      images = JSON.parse(images);
    } catch {
      images = [images];
    }
  }

  const premiereImage = Array.isArray(images) ? images[0] : null;

  const brutObj =
    chambre?.image_url ||
    chambre?.image ||
    chambre?.photo ||
    premiereImage;

  const brut =
    typeof brutObj === "string"
      ? brutObj
      : brutObj && typeof brutObj === "object"
        ? brutObj.url ||
          brutObj.path ||
          brutObj.chemin ||
          brutObj.image ||
          brutObj.src ||
          ""
        : "";

  if (!brut || typeof brut !== "string") {
    return imageSecours(chambre?.id);
  }

  if (
    brut.startsWith("http://") ||
    brut.startsWith("https://") ||
    brut.startsWith("data:")
  ) {
    return brut;
  }

  return `${CHAMBRES_HOST}${brut.startsWith("/") ? "" : "/"}${brut.replace(/^\/+/, "")}`;
}

function nomChambre(chambre) {
  return (
    chambre?.titre ||
    chambre?.nom ||
    (chambre?.numero
      ? `Chambre ${chambre.numero}`
      : `Chambre #${chambre?.id}`)
  );
}

function prixChambre(chambre) {
  return Number(
    chambre?.prix_nuit ??
      chambre?.prixNuit ??
      chambre?.prix ??
      0
  );
}

function jourSuivant(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + 1);

  return obtenirDateLocale(d);
}

function nombreNuits(debut, fin) {
  if (!debut || !fin) return 0;

  const diff = Math.round(
    (new Date(`${fin}T00:00:00`) -
      new Date(`${debut}T00:00:00`)) /
      86400000
  );

  return diff > 0 ? diff : 0;
}

function formaterDate(dateStr) {
  if (!dateStr) return "—";

  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(
    "fr-FR",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function formaterPrix(prix) {
  return Number(prix || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

// ==================================================
// CHARGEMENT DES CHAMBRES
// ==================================================

async function chargerChambres() {
  const res = await getChambres();
  const chambres = res?.data ?? res;

  return Array.isArray(chambres) ? chambres : [];
}

async function chargerChambreParId(id) {
  const res = await getChambre(id);
  return res?.data ?? res;
}

// ==================================================
// EXTRACTION DU TOTAL RETOURNÉ PAR L'API TARIFS
// ==================================================

function extraireTotalTarifs(res) {
  const total =
    res?.total ??
    res?.prix_total ??
    res?.data?.total ??
    res?.data?.prix_total;

  if (total === undefined || total === null) {
    return null;
  }

  const montant = Number(total);

  return Number.isFinite(montant) ? montant : null;
}

// ==================================================
// COMPOSANT PRINCIPAL
// ==================================================

export default function ReservationPage() {
  const { chambreId: paramChambreId } = useParams();

  const [searchParams] = useSearchParams();

  const location = useLocation();

  const { user, isAuthenticated } = useAuth();

  // ==================================================
  // DONNÉES TRANSMISES DEPUIS DETAILCHAMBREPAGE
  // ==================================================

  const reservationState = location.state || {};

  const chambreTransmise = reservationState.chambre || null;

  // Prix transmis depuis DetailChambrePage
  const prixInitialTransmis = reservationState.prixTotal;

  const detailsTarifsTransmis =
    reservationState.detailsTarifs || [];

  const promotionsTransmises =
    reservationState.promotionsUtilisees || [];

  const reductionTransmise = Number(
    reservationState.reductionTotale || 0
  );

  const prixAvantPromotionTransmis = Number(
    reservationState.prixAvantPromotion || 0
  );

  const prixTransmisValide =
    prixInitialTransmis !== null &&
    prixInitialTransmis !== undefined &&
    Number.isFinite(Number(prixInitialTransmis));

  const dateDebutInitiale =
    reservationState.dateDebut ||
    reservationState.dateArrivee ||
    "";

  const dateFinInitiale =
    reservationState.dateFin ||
    reservationState.dateDepart ||
    "";

  const initialChambreId =
    paramChambreId ||
    reservationState.chambreId ||
    chambreTransmise?.id ||
    searchParams.get("chambreId") ||
    "";

  const initialDebut =
    reservationState.dateArrivee ||
    reservationState.dateDebut ||
    searchParams.get("date_debut") ||
    aujourdhui;

  const initialFin =
    reservationState.dateDepart ||
    reservationState.dateFin ||
    searchParams.get("date_fin") ||
    jourSuivant(initialDebut);

  const initialPersonnes =
    Number(
      reservationState.nombrePersonnes ||
        searchParams.get("adultes")
    ) || 2;

  // ==================================================
  // ÉTATS DE RECHERCHE
  // ==================================================

  const [dateDebut, setDateDebut] = useState(initialDebut);

  const [dateFin, setDateFin] = useState(initialFin);

  const [nombrePersonnes, setNombrePersonnes] =
    useState(initialPersonnes);

  const [libres, setLibres] = useState(null);

  const [loadingRecherche, setLoadingRecherche] = useState(false);

  // ==================================================
  // ÉTATS DE LA CHAMBRE
  // ==================================================

  const [selectedChambre, setSelectedChambre] = useState(
    chambreTransmise
  );

  const [loadingChambre, setLoadingChambre] = useState(
    Boolean(initialChambreId && !chambreTransmise)
  );

  // ==================================================
  // COORDONNÉES CLIENT
  // ==================================================

  const [telephone, setTelephone] = useState("");

  const [nomClient, setNomClient] = useState("");

  const [emailClient, setEmailClient] = useState("");

  // ==================================================
  // TARIFS
  // ==================================================

  const [prixTotalTarifs, setPrixTotalTarifs] = useState(
    prixTransmisValide ? Number(prixInitialTransmis) : null
    
  );
  const [promoTarif, setPromoTarif] = useState(null); 
  const [loadingTarifs, setLoadingTarifs] = useState(false);

  // ==================================================
  // CONFIRMATION
  // ==================================================

  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState(null);

  const [confirmation, setConfirmation] = useState(null);

  // ==================================================
  // VÉRIFIER SI LES DATES SONT CELLES TRANSMISES
  // ==================================================

  const afficherDetailsTransmis =
    Boolean(dateDebutInitiale && dateFinInitiale) &&
    dateDebut === dateDebutInitiale &&
    dateFin === dateFinInitiale;

  // ==================================================
  // PRÉREMPLIR LES INFORMATIONS CLIENT
  // ==================================================

  useEffect(() => {
    if (user) {
      setNomClient(user.name || "");
      setEmailClient(user.email || "");
    }
  }, [user]);

  // ==================================================
  // CHARGER LA CHAMBRE
  // ==================================================

  useEffect(() => {
    if (!initialChambreId) {
      setLoadingChambre(false);
      return;
    }

    let actif = true;

    async function charger() {
      setLoadingChambre(true);

      try {
        const chambre = chambreTransmise
          ? chambreTransmise
          : await chargerChambreParId(initialChambreId);

        if (actif) {
          setSelectedChambre(chambre);
        }
      } catch (err) {
        console.error("Erreur chargement chambre :", err);

        if (actif) {
          setMessage({
            type: "error",
            text: "Impossible de charger les informations de cette chambre.",
          });
        }
      } finally {
        if (actif) {
          setLoadingChambre(false);
        }
      }
    }

    charger();

    return () => {
      actif = false;
    };
  }, [initialChambreId, chambreTransmise]);

  // ==================================================
  // RECHERCHE AUTOMATIQUE DEPUIS HOMEPAGE
  // ==================================================

  useEffect(() => {
    if (
      !initialChambreId &&
      searchParams.get("date_debut") &&
      searchParams.get("date_fin")
    ) {
      rechercherChambres();
    }
  }, []);

  // ==================================================
  // CALCULER LE TARIF
  // ==================================================

  useEffect(() => {
    if (!selectedChambre || !dateDebut || !dateFin) {
      setPrixTotalTarifs(null);
      setLoadingTarifs(false);
      return;
    }

    const nuits = nombreNuits(dateDebut, dateFin);

    if (nuits <= 0) {
      setPrixTotalTarifs(null);
      setLoadingTarifs(false);
      return;
    }

    let actif = true;

    // Si les dates n'ont pas changé, on conserve le prix
    // exact calculé dans DetailChambrePage.
    const datesIdentiques =
      afficherDetailsTransmis &&
      prixTransmisValide;

    if (datesIdentiques) {
      setPrixTotalTarifs(Number(prixInitialTransmis));
      setLoadingTarifs(false);

      return () => {
        actif = false;
      };
    }

    // Si les dates ont changé, on recalcule le tarif
    // à partir du microservice Tarifs.
    async function calculerTarif() {
      setLoadingTarifs(true);
      setPrixTotalTarifs(null);
      setPromoTarif(null);

      try {
        const res = await getTarifs({
          chambre_id: selectedChambre.id,
          date_debut: dateDebut,
          date_fin: dateFin,
        });

        if (!actif) return;

        const data = res?.data && typeof res.data === "object" ? res.data : res;
        const total = extraireTotalTarifs(res);
        const sousTotal = Number(data?.sous_total);
        const libellePromo = data?.promotion_appliquee || null;

        setPrixTotalTarifs(total !== null ? total : prixChambre(selectedChambre) * nuits);

        if (
          libellePromo &&
          Number.isFinite(sousTotal) &&
          total !== null &&
          sousTotal > total
        ) {
          setPromoTarif({
            libelle: libellePromo,
            sousTotal,
            reduction: Number((sousTotal - total).toFixed(2)),
          });
        }
      } catch (err) {
        console.error("Erreur calcul tarif :", err);
        if (actif) {
          setPrixTotalTarifs(prixChambre(selectedChambre) * nuits);
          setPromoTarif(null);
        }
      
      } finally {
        if (actif) {
          setLoadingTarifs(false);
        }
      }
    }

    calculerTarif();

    return () => {
      actif = false;
    };
  }, [
    selectedChambre,
    dateDebut,
    dateFin,
    afficherDetailsTransmis,
    prixTransmisValide,
    prixInitialTransmis,
  ]);

  // ==================================================
  // MODIFIER LA DATE D'ARRIVÉE
  // ==================================================

  function changerDebut(valeur) {
    setDateDebut(valeur);

    if (dateFin && dateFin <= valeur) {
      setDateFin(jourSuivant(valeur));
    }
  }

  // ==================================================
  // RECHERCHER LES CHAMBRES DISPONIBLES
  // ==================================================

  async function rechercherChambres(e) {
    if (e) e.preventDefault();

    setMessage(null);
    setLibres(null);

    const nuits = nombreNuits(dateDebut, dateFin);

    if (nuits <= 0) {
      setMessage({
        type: "error",
        text: "La date de départ doit être après la date d'arrivée.",
      });

      return;
    }

    setLoadingRecherche(true);

    try {
      const [dispo, chambres] = await Promise.all([
        getDisponibilites({
          date_debut: dateDebut,
          date_fin: dateFin,
        }),
        chargerChambres(),
      ]);

      const occupees =
        dispo?.data?.chambres_occupees ??
        dispo?.chambres_occupees ??
        [];

      const disponibles = chambres.filter((c) => {
        const estOccupee = occupees.some(
          (id) => Number(id) === Number(c.id)
        );

        const capaciteSuffisante =
          !c.capacite ||
          Number(nombrePersonnes) <= Number(c.capacite);

        return !estOccupee && capaciteSuffisante;
      });

      setLibres(disponibles);
    } catch (err) {
      setMessage({
        type: "error",
        text: messageErreur(err),
      });
    } finally {
      setLoadingRecherche(false);
    }
  }

  // ==================================================
  // CONFIRMER LA RÉSERVATION
  // ==================================================

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

    if (!selectedChambre?.id) {
      setMessage({
        type: "error",
        text: "Veuillez sélectionner une chambre.",
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

    const capacite = Number(selectedChambre.capacite || 4);

    if (Number(nombrePersonnes) > capacite) {
      setMessage({
        type: "error",
        text: `Cette chambre accepte au maximum ${capacite} personnes.`,
      });

      return;
    }

    if (loadingTarifs) {
      setMessage({
        type: "error",
        text: "Le calcul du tarif est en cours. Veuillez patienter.",
      });

      return;
    }

    if (prixTotalTarifs === null || !Number.isFinite(Number(prixTotalTarifs))) {
      setMessage({
        type: "error",
        text: "Impossible de déterminer le prix de votre séjour. Veuillez réessayer.",
      });

      return;
    }

    setSubmitting(true);

    try {
      // Vérifier la disponibilité avant la réservation.
      const check = await verifierChambre(
        selectedChambre.id,
        {
          date_debut: dateDebut,
          date_fin: dateFin,
        }
      );

      const disponible =
        check?.data?.disponible ??
        check?.disponible;

      if (disponible === false) {
        setMessage({
          type: "error",
          text: "Désolé, cette chambre vient d'être réservée sur ces dates.",
        });

        return;
      }

      // Le montant affiché est celui calculé pour les dates choisies.
      const total = Number(prixTotalTarifs);

      // Créer la réservation dans le microservice.
      const res = await creerReservation({
        chambre_id: Number(selectedChambre.id),
        date_debut: dateDebut,
        date_fin: dateFin,
        nombre_personnes: Number(nombrePersonnes),
        telephone: telephone.trim(),
      });

      setConfirmation({
        id: res?.data?.id ?? res?.id ?? null,
        chambre: selectedChambre,
        dateDebut,
        dateFin,
        nuits,
        nombrePersonnes: Number(nombrePersonnes),
        telephone: telephone.trim(),
        total,
        devise: selectedChambre.devise || "MAD",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: messageErreur(err),
      });
    } finally {
      setSubmitting(false);
    }
  }

  // ==================================================
  // ÉCRAN 3 : CONFIRMATION
  // ==================================================

  if (confirmation) {
    return (
      <section className="res-page">
        <div className="res-confirm-card">
          <span className="res-confirm-card__badge">
            Réservation confirmée
          </span>

          <h1 className="res-confirm-card__title">
            Merci {nomClient || "pour votre confiance"} !
          </h1>

          <p className="res-confirm-card__subtitle">
            Votre séjour est enregistré
            {confirmation.id
              ? ` sous la référence #${confirmation.id}`
              : ""}.
            Le règlement s'effectuera directement sur place à l'arrivée.
          </p>

          <div className="res-confirm-card__grid">
            <div>
              <span>Hébergement</span>
              <strong>
                {nomChambre(confirmation.chambre)}
              </strong>
            </div>

            <div>
              <span>Dates du séjour</span>
              <strong>
                {formaterDate(confirmation.dateDebut)} →{" "}
                {formaterDate(confirmation.dateFin)} (
                {confirmation.nuits} nuit
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
                {formaterPrix(confirmation.total)}{" "}
                {confirmation.devise}
              </strong>
            </div>
          </div>

          <div className="res-confirm-card__actions">
            <Link to="/mes-reservations" className="btn-dark">
              Voir mes réservations
            </Link>

            <Link to="/" className="btn-gold">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ==================================================
  // ÉCRAN 1 : RECHERCHE ET SÉLECTION
  // ==================================================

  if (!selectedChambre && !loadingChambre) {
    return (
      <section className="res-page">
        <div className="res-header">
          <span className="badge">
            Disponibilités en temps réel
          </span>

          <h1 className="section-title">
            Réservez votre séjour
          </h1>

          <p className="section-subtitle">
            Sélectionnez vos dates et le nombre de voyageurs
            pour consulter nos suites disponibles.
          </p>
        </div>

        <form
          className="res-search-bar"
          onSubmit={rechercherChambres}
        >
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
              onChange={(e) =>
                setNombrePersonnes(Number(e.target.value))
              }
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
                const prix = prixChambre(chambre);

                return (
                  <article
                    key={chambre.id}
                    className="res-room-card"
                  >
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
                        <span className="res-room-card__tag">
                          Disponible
                        </span>

                        {chambre.capacite && (
                          <span className="res-room-card__cap">
                            Max {chambre.capacite} pers.
                          </span>
                        )}
                      </div>

                      <h3>{nomChambre(chambre)}</h3>

                      {chambre.type && (
                        <p className="res-room-card__type">
                          {chambre.type}
                        </p>
                      )}

                      <div className="res-room-card__footer">
                        <div className="res-room-card__price">
                          <strong>
                            {formaterPrix(prix)}{" "}
                            {chambre.devise || "MAD"}
                          </strong>
                    
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

  // ==================================================
  // CHARGEMENT
  // ==================================================

  if (loadingChambre) {
    return (
      <section className="res-page">
        <p className="res-loading">
          Chargement de votre sélection...
        </p>
      </section>
    );
  }

  // ==================================================
  // ÉCRAN 2 : FINALISER LA RÉSERVATION
  // ==================================================

  const nuits = nombreNuits(dateDebut, dateFin);

  const prixNuit = prixChambre(selectedChambre);

  const totalSejour =
    prixTotalTarifs !== null
      ? Number(prixTotalTarifs)
      : prixNuit * nuits;

  const devise = selectedChambre.devise || "MAD";

  const capaciteMax = Number(selectedChambre.capacite || 4);

  return (
    <section className="res-page">
      <div className="res-topbar">
        <div className="res-breadcrumb">
          <Link to="/">Accueil</Link>

          <span>/</span>

          <button
            type="button"
            className="res-breadcrumb__link"
            onClick={() => {
              setSelectedChambre(null);
              setMessage(null);
            }}
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
            <span className="badge">
              HotelHub — Réservation directe
            </span>

            <h1 className="section-title">
              Finaliser votre réservation
            </h1>

            <p className="section-subtitle">
              Vérifiez les détails de votre séjour et renseignez
              votre numéro de téléphone pour confirmer.
            </p>
          </div>

          {!isAuthenticated && (
            <div className="res-alert res-alert--warning">
              <span>Vous n'êtes pas connecté.</span>

              <Link
                to="/login"
                className="res-alert__cta"
                state={{ from: location }}
              >
                Se connecter pour réserver →
              </Link>
            </div>
          )}

          {message && (
            <div className={`res-alert res-alert--${message.type}`}>
              {message.text}
            </div>
          )}

          <form
            onSubmit={confirmerReservation}
            className="res-checkout__form"
          >
            {/* COORDONNÉES */}

            <div className="res-card">
              <h2 className="res-card__title">
                Coordonnées du voyageur principal
              </h2>

              <div className="res-form-grid">
                <label className="res-field">
                  <span>Nom complet</span>

                  <input
                    type="text"
                    value={nomClient}
                    readOnly={isAuthenticated}
                    placeholder="Votre nom complet"
                    onChange={(e) =>
                      setNomClient(e.target.value)
                    }
                  />
                </label>

                <label className="res-field">
                  <span>Adresse e-mail</span>

                  <input
                    type="email"
                    value={emailClient}
                    readOnly={isAuthenticated}
                    placeholder="exemple@email.com"
                    onChange={(e) =>
                      setEmailClient(e.target.value)
                    }
                  />
                </label>

                <label className="res-field">
                  <span>Téléphone *</span>

                  <input
                    type="tel"
                    value={telephone}
                    required
                    placeholder="Ex : 06 12 34 56 78"
                    onChange={(e) =>
                      setTelephone(e.target.value)
                    }
                  />

                  <small>
                    Pour la confirmation et le suivi de votre arrivée.
                  </small>
                </label>

                <label className="res-field">
                  <span>Nombre de personnes *</span>

                  <select
                    value={nombrePersonnes}
                    onChange={(e) =>
                      setNombrePersonnes(Number(e.target.value))
                    }
                  >
                    {Array.from(
                      { length: capaciteMax },
                      (_, i) => i + 1
                    ).map((n) => (
                      <option key={n} value={n}>
                        {n} {n > 1 ? "personnes" : "personne"}
                      </option>
                    ))}
                  </select>

                  <small>
                    Capacité maximale : {capaciteMax} personnes.
                  </small>
                </label>
              </div>
            </div>

            {/* DATES DU SÉJOUR */}

            <div className="res-card">
              <h2 className="res-card__title">
                Dates du séjour
              </h2>

              <div className="res-form-grid">
                <label className="res-field">
                  <span>Date d'arrivée *</span>

                  <input
                    type="date"
                    value={dateDebut}
                    min={aujourdhui}
                    required
                    onChange={(e) =>
                      changerDebut(e.target.value)
                    }
                  />
                </label>

                <label className="res-field">
                  <span>Date de départ *</span>

                  <input
                    type="date"
                    value={dateFin}
                    min={dateDebut ? jourSuivant(dateDebut) : aujourdhui}
                    required
                    onChange={(e) =>
                      setDateFin(e.target.value)
                    }
                  />
                </label>
              </div>
            </div>

            {/* MODALITÉS */}

            <div className="res-card res-card--notice">
              <h2 className="res-card__title">
                Modalités de règlement
              </h2>

              <p>
                <strong>
                  Règlement sur place à l'arrivée :
                </strong>{" "}
                aucun paiement en ligne n'est débité lors de la
                réservation. Vous pouvez consulter ou annuler votre
                réservation à tout moment depuis la rubrique{" "}
                <em>Mes réservations</em>.
              </p>
            </div>

            <button
              type="submit"
              className="btn-dark res-submit-btn"
              disabled={
                submitting ||
                !isAuthenticated ||
                loadingTarifs ||
                prixTotalTarifs === null ||
                nuits <= 0
              }
            >
              {submitting
                ? "Confirmation en cours..."
                : loadingTarifs
                  ? "Calcul du tarif..."
                  : "CONFIRMER LA RÉSERVATION →"}
            </button>
          </form>
        </div>

        {/* COLONNE DROITE : RÉCAPITULATIF */}

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
                {selectedChambre.type || "Hébergement d'exception"}
              </span>

              <h3 className="res-summary__name">
                {nomChambre(selectedChambre)}
              </h3>

              <div className="res-summary__specs">
                <span>
                  Capacité : {capaciteMax} pers.
                </span>

                {selectedChambre.superficie && (
                  <span>
                    {selectedChambre.superficie} m²
                  </span>
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
                  Durée :{" "}
                  <strong>
                    {nuits} nuit{nuits > 1 ? "s" : ""}
                  </strong>
                </span>

                <span>
                  Voyageurs :{" "}
                  <strong>{nombrePersonnes}</strong>
                </span>
              </div>

              {/* DÉTAIL DU PRIX */}

              <div className="res-summary__breakdown">
                <div className="res-summary__row">
                

                 
                </div>

           
              

                {/* PROMOTIONS UTILISÉES */}

                {afficherDetailsTransmis &&
                  promotionsTransmises.length > 0 && (
                    <div className="res-summary__promotions">
                      <strong>Promotions appliquées</strong>

                      {promotionsTransmises.map((promotion, index) => (
                        <div
                          className="res-summary__row"
                          key={promotion.id || index}
                        >
                          <span>
                            {promotion.libelle ||
                              promotion.nom ||
                              "Promotion"}
                          </span>

                          <span>
                            {promotion.valeur}
                            {promotion.type_reduction === "pourcentage" ||
                            promotion.type_reduction === "percentage"
                              ? "%"
                              : ` ${devise}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

         
              </div>

              {!loadingTarifs && promoTarif && (
                <div
                  style={{
                    backgroundColor: "#eef7f0",
                    color: "#1e6b34",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    fontSize: "0.9rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span>Prix avant promotion</span>
                    <span style={{ textDecoration: "line-through", opacity: 0.8 }}>
                      {formaterPrix(promoTarif.sousTotal)} {devise}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                    <span>Promotion appliquée ({promoTarif.libelle})</span>
                    <span>-{formaterPrix(promoTarif.reduction)} {devise}</span>
                  </div>
                </div>
              )}

         

              {/* TOTAL */}

              <div className="res-summary__total">
                <div>
                  <span>TOTAL SÉJOUR TTC</span>

                  <small>
                    {loadingTarifs
                      ? "Calcul du tarif en cours..."
                      : "Règlement sur place à l'arrivée"}
                  </small>
                </div>

                <strong>
                  {loadingTarifs
                    ? "Calcul..."
                    : `${formaterPrix(totalSejour)} ${devise}`}
                </strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
