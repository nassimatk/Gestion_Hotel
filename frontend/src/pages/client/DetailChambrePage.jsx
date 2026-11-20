
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
// EXTRACTION DES DONNÉES
// ==================================================

const extraireListe = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.chambres)) return response.data.chambres;
  if (Array.isArray(response?.chambres)) return response.chambres;

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
// FORMATAGE ET CALCULS
// ==================================================

const formatPrix = (valeur) =>
  `${Number(valeur || 0).toLocaleString("fr-FR")} DH`;

const nombreNuits = (arrivee, depart) => {
  if (!arrivee || !depart) return 0;

  const diff =
    new Date(`${depart}T00:00:00`) -
    new Date(`${arrivee}T00:00:00`);

  return diff > 0 ? Math.round(diff / 86400000) : 0;
};

const getDateAujourdhui = () => {
  const date = new Date();

  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
};

// ==================================================
// NORMALISATION DES CRITÈRES
// ==================================================

const normaliserCriteres = (criteres) => {
  if (!criteres) return null;

  return {
    dateArrivee: criteres.dateArrivee || criteres.arrivee || "",
    dateDepart: criteres.dateDepart || criteres.depart || "",
    nombrePersonnes: Number(
      criteres.nombrePersonnes ?? criteres.voyageurs ?? 1
    ),
  };
};

// ==================================================
// COMPOSANT IMAGE
// ==================================================

function ImageChambre({ src, alt, className = "" }) {
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    setErreur(false);
  }, [src]);

  if (!src || erreur) {
    return <div className="no-image">Image indisponible</div>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        console.error("Erreur chargement image :", src);
        setErreur(true);
      }}
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

  const criteresRecherche = useMemo(
    () => normaliserCriteres(location.state?.criteresRecherche),
    [location.state]
  );

  // ==================================================
  // ÉTATS
  // ==================================================

  const [chambre, setChambre] = useState(() => {
    const chambreTransmise = location.state?.chambre;

    return chambreTransmise &&
      String(chambreTransmise.id) === String(id)
      ? chambreTransmise
      : null;
  });

  const [autresChambres, setAutresChambres] = useState([]);

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

  // ==================================================
  // CHARGEMENT CHAMBRE
  // ==================================================

  useEffect(() => {
    let actif = true;

    const chargerChambre = async () => {
      try {
        setError("");

        // Si la chambre a été transmise depuis HomePage,
        // on l'utilise directement.
        const chambreTransmise = location.state?.chambre;

        if (
          chambreTransmise &&
          String(chambreTransmise.id) === String(id)
        ) {
          if (actif) {
            setChambre(chambreTransmise);
            setLoading(false);
          }
          return;
        }

        // Sinon, récupération depuis le microservice Chambres.
        setLoading(true);
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

        setAutresChambres(
          chambres
            .filter((item) => String(item.id) !== String(id))
            .slice(0, 3)
        );

      } catch (err) {
        console.error("Erreur chargement chambre :", err);

        if (actif) {
          setError(
            err.response?.data?.message ||
            "Impossible de charger les informations de la chambre."
          );
        }
      } finally {
        if (actif) setLoading(false);
      }
    };

    chargerChambre();

    return () => {
      actif = false;
    };
  }, [id, location.state]);

  // ==================================================
  // IMAGES
  // ==================================================

  const images = useMemo(
    () => getRoomImages(chambre),
    [chambre]
  );

  // ==================================================
  // SYNCHRONISATION DES CRITÈRES
  // ==================================================

  useEffect(() => {
    setIndexActif(0);
    setLightboxOpen(false);

    setArrivee(criteresRecherche?.dateArrivee || "");
    setDepart(criteresRecherche?.dateDepart || "");
    setVoyageurs(criteresRecherche?.nombrePersonnes || 1);
  }, [id, location.key]);

  // ==================================================
  // CAPACITÉ
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

  useEffect(() => {
    if (!chambre) return;

    setVoyageurs((valeur) => {
      const nombre = Number(valeur);

      if (!Number.isFinite(nombre) || nombre < 1) return 1;

      return Math.min(Math.floor(nombre), capacite);
    });
  }, [chambre, capacite]);

  // ==================================================
  // NAVIGATION GALERIE
  // ==================================================

  useEffect(() => {
    if (!lightboxOpen || images.length === 0) return;

    const total = images.length;

    const onKey = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);

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
  // CHARGEMENT
  // ==================================================

  if (loading) {
    return <p className="detail-loading">Chargement de la chambre...</p>;
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
    return <p className="detail-error">Chambre introuvable.</p>;
  }

  // ==================================================
  // ÉQUIPEMENTS
  // ==================================================

  let equipements = chambre.equipements || [];

  if (typeof equipements === "string") {
    try {
      equipements = JSON.parse(equipements);
    } catch {
      equipements = equipements.split(",").map((e) => e.trim());
    }
  }

  if (!Array.isArray(equipements)) equipements = [];

  // ==================================================
  // CALCUL DU SÉJOUR
  // ==================================================

  const nuits = nombreNuits(arrivee, depart);

  const prixNuit = Number(chambre.prix_nuit || 0);

  const sousTotal = nuits * prixNuit;

  const nombreVoyageurs = Number(voyageurs);

  const caracteristiques = [
    { icone: "▢", texte: `${chambre.superficie || 0} m²` },
    { icone: "☺", texte: `${capacite} voyageur(s)` },
    { icone: "↕", texte: `Étage ${chambre.etage ?? "Non précisé"}` },
    { icone: "◐", texte: chambre.vue || "Vue non précisée" },
    { icone: "▭", texte: chambre.type || "Type non précisé" },
  ];

  // ==================================================
  // RÉSERVATION
  // ==================================================

  const handleReservation = () => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location.pathname,
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
      alert("Veuillez sélectionner les dates.");
      return;
    }

    if (arrivee < getDateAujourdhui() || nuits <= 0) {
      alert("Veuillez vérifier les dates de votre séjour.");
      return;
    }

    if (nombreVoyageurs < 1 || nombreVoyageurs > capacite) {
      alert(`Maximum ${capacite} voyageurs.`);
      return;
    }

    navigate("/reservation", {
      state: {
        chambreId: chambre.id,
        dateDebut: arrivee,
        dateFin: depart,
        nombrePersonnes: nombreVoyageurs,
        chambre: chambre,
      },
    });
  };

  // ==================================================
  // AFFICHAGE
  // ==================================================

  return (
    <div className="detail-chambre-page">
      <div className="detail-container">

        {/* HEADER */}

        <header className="detail-header">
          <h1>
            {chambre.type}
            <span> · Chambre {chambre.numero}</span>
          </h1>

          <p className="detail-header-prix">
            {formatPrix(prixNuit)}
            <small> / nuit</small>
          </p>
        </header>

        {/* GALERIE */}

        <div className={`detail-gallery count-${Math.min(images.length, 3)}`}>
          {images.length > 0 ? (
            images.slice(0, 3).map((image, index) => (
              <div
                key={`${image}-${index}`}
                className={`gallery-item ${
                  index === 0 ? "gallery-main" : "gallery-side"
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
                setIndexActif((i) => (i + 1) % images.length);
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
              <span className="feature-icon" aria-hidden="true">
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
              {chambre.description || "Aucune description disponible."}
            </p>

            <h3>Équipements &amp; prestations</h3>

            {equipements.length > 0 ? (
              <ul className="equipements-list">
                {equipements.map((equipement, index) => (
                  <li key={index}>
                    <span className="equipement-icon" aria-hidden="true">
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

            <div className="reservation-dates">

              <label>
                <span>Arrivée</span>
                <input
                  type="date"
                  value={arrivee}
                  min={getDateAujourdhui()}
                  onChange={(e) => {
                    const nouvelleDate = e.target.value;

                    setArrivee(nouvelleDate);

                    if (depart && nouvelleDate >= depart) {
                      setDepart("");
                    }
                  }}
                />
              </label>

              <label>
                <span>Départ</span>
                <input
                  type="date"
                  value={depart}
                  min={arrivee || getDateAujourdhui()}
                  onChange={(e) => setDepart(e.target.value)}
                />
              </label>

            </div>

            <label className="reservation-voyageurs">
              <span>Voyageurs</span>

              <select
                value={Math.min(
                  Math.max(1, Number(voyageurs) || 1),
                  capacite
                )}
                onChange={(e) => setVoyageurs(Number(e.target.value))}
              >
                {Array.from({ length: capacite }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} voyageur{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>

            {/* PRIX */}

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
                <strong>{formatPrix(sousTotal)}</strong>
              </div>
            </div>

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
