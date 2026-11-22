import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { getChambres } from "../../services/chambresApi";
import { useAuth } from "../../context/AuthContext";
import ClientAvisPage from "./ClientAvisPage";
import "./DetailChambrePage.css";

const STORAGE_URL =
  import.meta.env.VITE_CHAMBRES_STORAGE_URL ||
  "http://localhost:8001/storage";

// ==================================================
// EXTRACTION DES DONNÉES API
// ==================================================

const extraireListe = (response) => {
  let data = response;

  for (let i = 0; i < 3; i++) {
    if (
      data &&
      !Array.isArray(data) &&
      typeof data === "object" &&
      Object.prototype.hasOwnProperty.call(data, "data")
    ) {
      data = data.data;
    } else {
      break;
    }
  }

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.chambres)) return data.chambres;

  return [];
};

// ==================================================
// GESTION DES IMAGES
// ==================================================

const extraireCheminImage = (image) => {
  if (typeof image === "string") return image;

  if (image && typeof image === "object") {
    return (
      image.url ||
      image.path ||
      image.chemin ||
      image.image ||
      image.src ||
      image.filename ||
      ""
    );
  }

  return "";
};

const getRoomImage = (image) => {
  const chemin = extraireCheminImage(image).trim();

  if (!chemin) return "";

  if (/^(https?:\/\/|data:|blob:)/i.test(chemin)) {
    return chemin;
  }

  const cheminNettoye = chemin
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^(public\/)?storage\//, "")
    .replace(/^public\//, "");

  return `${STORAGE_URL.replace(/\/+$/, "")}/${cheminNettoye}`;
};

const getRoomImages = (room) => {
  let images = room?.images;

  if (!images) return [];

  if (typeof images === "string") {
    try {
      images = JSON.parse(images);
    } catch {
      images = [images];
    }
  }

  if (!Array.isArray(images)) {
    images = [images];
  }

  return images.map(getRoomImage).filter(Boolean);
};

// ==================================================
// FORMATAGE DES PRIX
// ==================================================

const formatPrix = (valeur) => {
  const prix = Number(valeur || 0);

  return `${new Intl.NumberFormat("fr-FR").format(
    Number.isFinite(prix) ? prix : 0
  )} DH`;
};

// ==================================================
// DATES
// ==================================================

const getDateAujourdhui = () => {
  const date = new Date();

  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
};

const lendemain = (dateStr) => {
  if (!dateStr) return "";

  const [annee, mois, jour] = dateStr.split("-").map(Number);

  const date = new Date(annee, mois - 1, jour);
  date.setDate(date.getDate() + 1);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const nombreNuits = (arrivee, depart) => {
  if (!arrivee || !depart) return 0;

  const [a1, m1, j1] = arrivee.split("-").map(Number);
  const [a2, m2, j2] = depart.split("-").map(Number);

  const debut = Date.UTC(a1, m1 - 1, j1);
  const fin = Date.UTC(a2, m2 - 1, j2);

  const diff = fin - debut;

  return diff > 0 ? Math.round(diff / 86400000) : 0;
};

// ==================================================
// NORMALISATION DES CRITÈRES DE RECHERCHE
// ==================================================

const normaliserCriteres = (criteres) => {
  if (!criteres) return null;

  const dateArrivee =
    criteres.date_debut ||
    criteres.dateArrivee ||
    criteres.arrivee ||
    "";

  const dateDepart =
    criteres.date_fin ||
    criteres.dateDepart ||
    criteres.depart ||
    "";

  const nombrePersonnes = Number(
    criteres.adultes ??
    criteres.nombrePersonnes ??
    criteres.voyageurs ??
    1
  );

  return {
    dateArrivee,
    dateDepart,
    nombrePersonnes:
      Number.isFinite(nombrePersonnes) && nombrePersonnes > 0
        ? Math.floor(nombrePersonnes)
        : 1,
  };
};

// ==================================================
// EXTRACTION DES ÉQUIPEMENTS
// ==================================================

const extraireEquipements = (equipements) => {
  if (!equipements) return [];

  if (typeof equipements === "string") {
    try {
      equipements = JSON.parse(equipements);
    } catch {
      equipements = equipements.split(",").map((e) => e.trim());
    }
  }

  return Array.isArray(equipements) ? equipements : [];
};

// ==================================================
// COMPOSANT IMAGE
// ==================================================

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80";

function ImageChambre({ src, alt, className = "" }) {
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    setErreur(false);
  }, [src]);

  return (
    <img
      src={!src || erreur ? FALLBACK_IMAGE : src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setErreur(true)}
    />
  );
}

// ==================================================
// PAGE DÉTAIL CHAMBRE
// ==================================================

function DetailChambrePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated } = useAuth();

  // ==================================================
  // RÉCUPÉRATION DES DONNÉES TRANSMISES
  // ==================================================

  const criteresRecherche = useMemo(
    () => normaliserCriteres(location.state?.criteresRecherche),
    [location.state]
  );

  const chambreTransmise = location.state?.chambre;

  // Résultat déjà obtenu auprès du microservice Disponibilités
  const disponibiliteRecherche =
    chambreTransmise?.disponibilite || null;

  // ==================================================
  // ÉTATS
  // ==================================================

  const [chambre, setChambre] = useState(() => {
    if (
      chambreTransmise &&
      String(chambreTransmise.id) === String(id)
    ) {
      return chambreTransmise;
    }

    return null;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [arrivee, setArrivee] = useState(
    criteresRecherche?.dateArrivee || ""
  );

  const [depart, setDepart] = useState(
    criteresRecherche?.dateDepart || ""
  );

  const [voyageurs, setVoyageurs] = useState(
    criteresRecherche?.nombrePersonnes || 1
  );

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [indexActif, setIndexActif] = useState(0);

  const [erreurReservation, setErreurReservation] = useState("");

  // ==================================================
  // CHARGEMENT DE LA CHAMBRE
  // ==================================================

  useEffect(() => {
    let actif = true;

    const chargerChambre = async () => {
      try {
        setError("");
        setLoading(true);

        // 1. Utiliser directement la chambre transmise
        if (
          chambreTransmise &&
          String(chambreTransmise.id) === String(id)
        ) {
          if (actif) {
            setChambre(chambreTransmise);
          }

          return;
        }

        // 2. Sinon récupérer les chambres depuis le microservice Chambres
        setChambre(null);

        const response = await getChambres();
        const chambres = extraireListe(response);

        const chambreTrouvee = chambres.find(
          (item) => String(item.id) === String(id)
        );

        if (!actif) return;

        if (!chambreTrouvee) {
          setError(`Chambre avec ID ${id} introuvable.`);
          return;
        }

        setChambre(chambreTrouvee);

      } catch (err) {
        console.error("Erreur chargement chambre :", err);

        if (actif) {
          setError(
            err.response?.data?.message ||
            err.message ||
            "Impossible de charger les informations de la chambre."
          );
        }
      } finally {
        if (actif) {
          setLoading(false);
        }
      }
    };

    chargerChambre();

    return () => {
      actif = false;
    };
  }, [id, location.key, chambreTransmise]);

  // ==================================================
  // SYNCHRONISATION DES CRITÈRES DE RECHERCHE
  // ==================================================

  useEffect(() => {
    setArrivee(criteresRecherche?.dateArrivee || "");
    setDepart(criteresRecherche?.dateDepart || "");

    setVoyageurs(
      criteresRecherche?.nombrePersonnes || 1
    );

    setIndexActif(0);
    setLightboxOpen(false);
    setErreurReservation("");

  }, [
    id,
    location.key,
    criteresRecherche?.dateArrivee,
    criteresRecherche?.dateDepart,
    criteresRecherche?.nombrePersonnes,
  ]);

  // ==================================================
  // IMAGES
  // ==================================================

  const images = useMemo(
    () => getRoomImages(chambre),
    [chambre]
  );

  // ==================================================
  // ÉQUIPEMENTS
  // ==================================================

  const equipements = useMemo(
    () => extraireEquipements(chambre?.equipements),
    [chambre]
  );

  // ==================================================
  // CAPACITÉ DE LA CHAMBRE
  // ==================================================

  const capacite = useMemo(() => {
    const valeur =
      chambre?.capacite ??
      chambre?.nombre_personnes ??
      chambre?.nb_personnes ??
      chambre?.capacity ??
      1;

    const nombre = Number(valeur);

    return Number.isFinite(nombre) && nombre > 0
      ? Math.floor(nombre)
      : 1;

  }, [chambre]);

  // Limiter le nombre de voyageurs à la capacité
  useEffect(() => {
    if (!chambre) return;

    setVoyageurs((valeur) => {
      const nombre = Number(valeur);

      if (!Number.isFinite(nombre) || nombre < 1) {
        return 1;
      }

      return Math.min(Math.floor(nombre), capacite);
    });

  }, [chambre, capacite]);

  // ==================================================
  // GALERIE : NAVIGATION CLAVIER
  // ==================================================

  useEffect(() => {
    if (!lightboxOpen || images.length === 0) return;

    const total = images.length;

    const onKey = (e) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
      }

      if (e.key === "ArrowRight") {
        setIndexActif((i) => (i + 1) % total);
      }

      if (e.key === "ArrowLeft") {
        setIndexActif((i) => (i - 1 + total) % total);
      }
    };

    const ancienOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = ancienOverflow;
      window.removeEventListener("keydown", onKey);
    };

  }, [lightboxOpen, images.length]);

  // ==================================================
  // CALCUL DU SÉJOUR
  // ==================================================

  const nuits = nombreNuits(arrivee, depart);

  const prixNuit = Number(chambre?.prix_nuit || 0);

  const sousTotal = nuits * prixNuit;

  const nombreVoyageurs = Number(voyageurs);

  // ==================================================
  // CARACTÉRISTIQUES
  // ==================================================

  const caracteristiques = chambre
    ? [
        { icone: "▢", texte: `${chambre.superficie || 0} m²` },
        { icone: "☺", texte: `${capacite} voyageur(s)` },
        {
          icone: "↕",
          texte: `Étage ${chambre.etage ?? "Non précisé"}`,
        },
        {
          icone: "◐",
          texte: chambre.vue || "Vue non précisée",
        },
        {
          icone: "▭",
          texte: chambre.type || "Type non précisé",
        },
      ]
    : [];

  // ==================================================
  // MODIFICATION DES DATES
  // ==================================================

  const changerArrivee = (nouvelleDate) => {
    setArrivee(nouvelleDate);
    setErreurReservation("");

    if (depart && depart <= nouvelleDate) {
      setDepart(lendemain(nouvelleDate));
    }
  };

  const changerDepart = (nouvelleDate) => {
    setDepart(nouvelleDate);
    setErreurReservation("");
  };

  // ==================================================
  // RÉSERVATION
  // ==================================================

  const handleReservation = () => {
    setErreurReservation("");

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location.pathname,

          chambreId: chambre.id,

          criteresRecherche: {
            dateArrivee: arrivee,
            dateDepart: depart,
            nombrePersonnes: nombreVoyageurs,
          },
        },
      });

      return;
    }

    if (!arrivee || !depart) {
      setErreurReservation(
        "Veuillez sélectionner les dates de votre séjour."
      );
      return;
    }

    if (arrivee < getDateAujourdhui()) {
      setErreurReservation(
        "La date d'arrivée ne peut pas être dans le passé."
      );
      return;
    }

    if (nuits <= 0) {
      setErreurReservation(
        "La date de départ doit être après la date d'arrivée."
      );
      return;
    }

    if (
      nombreVoyageurs < 1 ||
      nombreVoyageurs > capacite
    ) {
      setErreurReservation(
        `Cette chambre accepte maximum ${capacite} voyageurs.`
      );
      return;
    }

    // Transmettre les informations à la page Réservation
    navigate("/reservation", {
      state: {
        chambreId: chambre.id,

        dateDebut: arrivee,
        dateFin: depart,

        nombrePersonnes: nombreVoyageurs,

        chambre: chambre,

        criteresRecherche: {
          dateArrivee: arrivee,
          dateDepart: depart,
          nombrePersonnes: nombreVoyageurs,
        },
      },
    });
  };

  // ==================================================
  // ÉTATS DE CHARGEMENT ET ERREURS
  // ==================================================

  if (loading) {
    return (
      <p className="detail-loading">
        Chargement de la chambre...
      </p>
    );
  }

  if (error) {
    return (
      <div className="detail-error">
        <p>{error}</p>
        <Link to="/">Retour à l'accueil</Link>
      </div>
    );
  }

  if (!chambre) {
    return (
      <div className="detail-error">
        <p>Chambre introuvable.</p>
        <Link to="/">Retour à l'accueil</Link>
      </div>
    );
  }

  // ==================================================
  // AFFICHAGE
  // ==================================================

  return (
    <div className="detail-chambre-page">
      <div className="detail-container">


 

        <div
          className={`detail-gallery count-${Math.min(
            images.length,
            3
          )}`}
        >
          {images.length > 0 ? (

            images.slice(0, 3).map((image, index) => (

              <div
                key={`${image}-${index}`}
                className={`gallery-item ${
                  index === 0
                    ? "gallery-main"
                    : "gallery-side"
                }`}
                onClick={() => {
                  setIndexActif(index);
                  setLightboxOpen(true);
                }}
              >

                <ImageChambre
                  src={image}
                  alt={`Chambre ${chambre.numero} – vue ${index + 1}`}
                />

                {index === 0 && (
                  <button
                    type="button"
                    className="gallery-fullscreen"
                    onClick={(e) => {
                      e.stopPropagation();

                      setIndexActif(0);
                      setLightboxOpen(true);
                    }}
                  >
                    <span aria-hidden="true">⛶</span>
                    Plein écran (1/{images.length})
                  </button>
                )}

              </div>
            ))

          ) : (

            <div className="no-image">
              Aucune image disponible pour cette chambre
            </div>

          )}
        </div>

        {/* LIGHTBOX */}

        {lightboxOpen && images.length > 0 && (

          <div
            className="lightbox"
            onClick={() => setLightboxOpen(false)}
          >

            <button
              type="button"
              className="lightbox-close"
              aria-label="Fermer"
              onClick={() => setLightboxOpen(false)}
            >
              ✕
            </button>

            <button
              type="button"
              className="lightbox-nav prev"
              aria-label="Image précédente"
              onClick={(e) => {
                e.stopPropagation();

                setIndexActif(
                  (i) => (i - 1 + images.length) % images.length
                );
              }}
            >
              ‹
            </button>

            <img
              src={images[indexActif]}
              alt={`Chambre ${chambre.numero} – image ${indexActif + 1}`}
              onClick={(e) => e.stopPropagation()}
            />

            <button
              type="button"
              className="lightbox-nav next"
              aria-label="Image suivante"
              onClick={(e) => {
                e.stopPropagation();

                setIndexActif(
                  (i) => (i + 1) % images.length
                );
              }}
            >
              ›
            </button>

            <span className="lightbox-count">
              {indexActif + 1} / {images.length}
            </span>

          </div>
        )}

        {/* CARACTÉRISTIQUES */}

        <ul className="detail-features">

          {caracteristiques.map((c, index) => (

            <li key={index}>

              <span
                className="feature-icon"
                aria-hidden="true"
              >
                {c.icone}
              </span>

              {c.texte}

            </li>

          ))}

        </ul>

        {/* DESCRIPTION */}

        <div className="detail-content">

          <div className="detail-main">

            <h2>{chambre.titre || chambre.type}</h2>

            <p className="detail-description">
              {chambre.description ||
                "Aucune description disponible."}
            </p>

            <h3>Équipements &amp; prestations</h3>

            {equipements.length > 0 ? (

              <ul className="equipements-list">

                {equipements.map((equipement, index) => (

                  <li key={index}>

                    <span
                      className="equipement-icon"
                      aria-hidden="true"
                    >
                      ✓
                    </span>

                    {typeof equipement === "object"
                      ? equipement.nom || equipement.name
                      : equipement}

                  </li>

                ))}

              </ul>

            ) : (

              <p>Aucun équipement renseigné.</p>

            )}

          </div>

          {/* RÉSERVATION */}

          <aside className="detail-reservation">

            <div className="reservation-top">

              <p className="reservation-prix">
                {formatPrix(prixNuit)}
                <small> / nuit</small>
              </p>

            </div>

            {/* DATES */}

            <div className="reservation-dates">

              <label>

                <span>Arrivée</span>

                <input
                  type="date"
                  value={arrivee}
                  min={getDateAujourdhui()}
                  required
                  onChange={(e) =>
                    changerArrivee(e.target.value)
                  }
                />

              </label>

              <label>

                <span>Départ</span>

                <input
                  type="date"
                  value={depart}
                  min={
                    arrivee
                      ? lendemain(arrivee)
                      : lendemain(getDateAujourdhui())
                  }
                  required
                  onChange={(e) =>
                    changerDepart(e.target.value)
                  }
                />

              </label>

            </div>

            {/* VOYAGEURS */}

            <label className="reservation-voyageurs">

              <span>Voyageurs</span>

              <select
                value={Math.min(
                  Math.max(1, Number(voyageurs) || 1),
                  capacite
                )}
                onChange={(e) => {
                  setVoyageurs(Number(e.target.value));
                  setErreurReservation("");
                }}
              >

                {Array.from(
                  { length: capacite },
                  (_, i) => i + 1
                ).map((n) => (

                  <option key={n} value={n}>
                    {n} voyageur{n > 1 ? "s" : ""}
                  </option>

                ))}

              </select>

            </label>

            {/* CALCUL DU PRIX */}

            <div className="reservation-lignes">

              <div>

                <span>
                  {formatPrix(prixNuit)} × {nuits} nuit
                  {nuits > 1 ? "s" : ""}
                </span>

                <span>{formatPrix(sousTotal)}</span>

              </div>

              <div className="reservation-total">

                <span>Total</span>

                <strong>
                  {formatPrix(sousTotal)}
                </strong>

              </div>

            </div>

            {/* ERREUR RÉSERVATION */}

            {erreurReservation && (

              <p
                className="reservation-error"
                role="alert"
              >
                {erreurReservation}
              </p>

            )}

            {/* BOUTON RÉSERVER */}

            <button
              type="button"
              className="reservation-button"
              onClick={handleReservation}
            >

              {isAuthenticated
                ? "RÉSERVER CE SÉJOUR"
                : "SE CONNECTER POUR RÉSERVER"}

            </button>

          </aside>

        </div>

        {/* AVIS CLIENTS */}

        <ClientAvisPage />

      </div>
    </div>
  );
}

export default DetailChambrePage;
