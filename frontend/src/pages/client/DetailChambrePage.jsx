import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { getChambres } from "../../services/chambresApi";
import { useAuth } from "../../context/AuthContext";
import ClientAvisPage from "./ClientAvisPage";
import "./DetailChambrePage.css";

const STORAGE_URL =
  import.meta.env.VITE_CHAMBRES_STORAGE_URL ||
  "http://localhost:8001/storage";

// ==============================
// EXTRACTION DES DONNÉES
// ==============================

const extraireListe = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.chambres)) return response.data.chambres;
  if (Array.isArray(response?.chambres)) return response.chambres;

  return [];
};

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

// ==============================
// GESTION DES IMAGES
// ==============================

const getRoomImage = (image) => {
  const chemin = extraireCheminImage(image).trim();

  if (!chemin) return "";
  if (/^https?:\/\//i.test(chemin)) return chemin;

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

  if (!Array.isArray(images)) images = [images];

  return images.map(getRoomImage).filter(Boolean);
};

// ==============================
// FORMATTAGE ET CALCULS
// ==============================

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

// ==============================
// NORMALISATION DES CRITÈRES
// ==============================

const normaliserCriteres = (criteres) => {
  if (!criteres) return null;

  return {
    dateArrivee:
      criteres.dateArrivee ||
      criteres.arrivee ||
      "",

    dateDepart:
      criteres.dateDepart ||
      criteres.depart ||
      "",

    nombrePersonnes: Number(
      criteres.nombrePersonnes ??
      criteres.voyageurs ??
      1
    ),
  };
};

// ==============================
// COMPOSANT IMAGE
// ==============================

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

// ==============================
// PAGE DÉTAIL CHAMBRE
// ==============================

function DetailChambrePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated } = useAuth();

  // ==============================
  // CRITÈRES REÇUS
  // ==============================

  const criteresRecherche = normaliserCriteres(
    location.state?.criteresRecherche
  );

  // ==============================
  // ÉTATS DE LA CHAMBRE
  // ==============================

  const [chambre, setChambre] = useState(null);
  const [autresChambres, setAutresChambres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==============================
  // CRITÈRES DU SÉJOUR
  // ==============================

  const [arrivee, setArrivee] = useState(
    criteresRecherche?.dateArrivee || ""
  );

  const [depart, setDepart] = useState(
    criteresRecherche?.dateDepart || ""
  );

  const [voyageurs, setVoyageurs] = useState(
    criteresRecherche?.nombrePersonnes || 1
  );

  // ==============================
  // ÉTATS GALERIE
  // ==============================

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [indexActif, setIndexActif] = useState(0);

  // ==============================
  // CHARGEMENT DES CHAMBRES
  // ==============================

  useEffect(() => {
    let actif = true;

    const chargerChambre = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getChambres();
        const chambres = extraireListe(response);

        const chambreTrouvee = chambres.find(
          (item) => String(item.id) === String(id)
        );

        if (!actif) return;

        setChambre(chambreTrouvee || null);

        setAutresChambres(
          chambres
            .filter((item) => String(item.id) !== String(id))
            .slice(0, 3)
        );
      } catch (err) {
        console.error("Erreur chargement chambre :", err);

        if (actif) {
          setError(
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
  }, [id]);

  // ==============================
  // IMAGES DE LA CHAMBRE
  // ==============================

  const images = useMemo(
    () => getRoomImages(chambre),
    [chambre]
  );

  // ==============================
  // SYNCHRONISATION DES CRITÈRES
  // ==============================

  useEffect(() => {
    setIndexActif(0);
    setLightboxOpen(false);

    setArrivee(criteresRecherche?.dateArrivee || "");
    setDepart(criteresRecherche?.dateDepart || "");
    setVoyageurs(criteresRecherche?.nombrePersonnes || 1);
  }, [id, location.key]);

  // ==============================
  // SYNCHRONISATION DE LA CAPACITÉ
  // ==============================

  useEffect(() => {
    if (!chambre) return;

    const capaciteBrute =
      chambre.capacite ??
      chambre.nombre_personnes ??
      chambre.nb_personnes ??
      chambre.capacity ??
      1;

    const capaciteNumerique = Number(capaciteBrute);

    const capaciteMax =
      Number.isFinite(capaciteNumerique) && capaciteNumerique > 0
        ? Math.floor(capaciteNumerique)
        : 1;

    setVoyageurs((valeurActuelle) => {
      const nombreActuel = Number(valeurActuelle);

      if (!Number.isFinite(nombreActuel) || nombreActuel < 1) {
        return 1;
      }

      return Math.min(Math.floor(nombreActuel), capaciteMax);
    });
  }, [chambre, id]);

  // ==============================
  // NAVIGATION DANS LA GALERIE
  // ==============================

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

  // ==============================
  // ÉTATS DE CHARGEMENT
  // ==============================

  if (loading) {
    return <p className="detail-loading">Chargement...</p>;
  }

  if (error) {
    return <p className="detail-error">{error}</p>;
  }

  if (!chambre) {
    return <p className="detail-error">Chambre introuvable.</p>;
  }

  // ==============================
  // ÉQUIPEMENTS
  // ==============================

  let equipements = chambre.equipements || [];

  if (typeof equipements === "string") {
    try {
      equipements = JSON.parse(equipements);
    } catch {
      equipements = equipements.split(",").map((e) => e.trim());
    }
  }

  if (!Array.isArray(equipements)) {
    equipements = [];
  }

  // ==============================
  // CALCUL DU SÉJOUR
  // ==============================

  const nuits = nombreNuits(arrivee, depart);

  const sousTotal = nuits * Number(chambre.prix_nuit || 0);

  const capaciteBrute =
    chambre.capacite ??
    chambre.nombre_personnes ??
    chambre.nb_personnes ??
    chambre.capacity ??
    1;

  const capaciteNumerique = Number(capaciteBrute);

  const capacite =
    Number.isFinite(capaciteNumerique) && capaciteNumerique > 0
      ? Math.floor(capaciteNumerique)
      : 1;

  const nombreVoyageurs = Number(voyageurs);

  // ==============================
  // CARACTÉRISTIQUES
  // ==============================

  const caracteristiques = [
    { icone: "▢", texte: `${chambre.superficie || 0} m²` },
    { icone: "☺", texte: `${capacite} voyageur(s)` },
    { icone: "↕", texte: `Étage ${chambre.etage ?? "Non précisé"}` },
    { icone: "◐", texte: chambre.vue || "Vue non précisée" },
    { icone: "▭", texte: chambre.type || "Type non précisé" },
  ];

  // ==============================
  // RÉSERVATION
  // ==============================

  const handleReservation = () => {
    // Vérifier la connexion avant toute réservation
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location.pathname,
          criteresRecherche: {
            dateArrivee: arrivee,
            dateDepart: depart,
            nombrePersonnes: voyageurs,
          },
        },
      });

      return;
    }

    const nombreSelectionne = Number(voyageurs);
    const capaciteChambre = Number(capacite);

    if (!arrivee || !depart) {
      alert("Veuillez sélectionner les dates d'arrivée et de départ.");
      return;
    }

    if (nuits <= 0) {
      alert("La date de départ doit être après la date d'arrivée.");
      return;
    }

    if (arrivee < getDateAujourdhui()) {
      alert("La date d'arrivée ne peut pas être dans le passé.");
      return;
    }

    if (
      !Number.isFinite(nombreSelectionne) ||
      !Number.isFinite(capaciteChambre) ||
      !Number.isInteger(nombreSelectionne) ||
      nombreSelectionne < 1 ||
      nombreSelectionne > capaciteChambre
    ) {
      alert(
        `Cette chambre accepte au maximum ${capaciteChambre} voyageur(s).`
      );

      return;
    }

    if (
      chambre.statut &&
      !["disponible", "available"].includes(
        String(chambre.statut).trim().toLowerCase()
      )
    ) {
      alert("Cette chambre n'est pas disponible.");
      return;
    }

    // Données transmises à la page de réservation
    const reservationData = {
      dateArrivee: arrivee,
      dateDepart: depart,
      nombrePersonnes: nombreSelectionne,
      nombreNuits: nuits,
      prixTotal: sousTotal,

      chambre: {
        id: chambre.id,
        numero: chambre.numero,
        type: chambre.type,
        titre: chambre.titre,
        prixNuit: Number(chambre.prix_nuit || 0),
        capacite,
        superficie: chambre.superficie,
        etage: chambre.etage,
        vue: chambre.vue,
        images,
      },
    };

    navigate("/reservations/nouvelle", {
      state: reservationData,
    });
  };

  // ==============================
  // AFFICHAGE
  // ==============================

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
            {formatPrix(chambre.prix_nuit)}
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

        {/* DESCRIPTION ET RÉSERVATION */}
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
                    {equipement}
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
                {formatPrix(chambre.prix_nuit)}
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

            {/* VOYAGEURS */}
            <label className="reservation-voyageurs">
              <span>Voyageurs</span>

              <select
                value={Math.min(
                  Math.max(1, Number(voyageurs) || 1),
                  capacite
                )}
                onChange={(e) => setVoyageurs(Number(e.target.value))}
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
                  {formatPrix(chambre.prix_nuit)} × {nuits} nuit
                  {nuits > 1 ? "s" : ""}
                </span>

                <span>{formatPrix(sousTotal)}</span>
              </div>

              <div className="reservation-total">
                <span>Total</span>
                <strong>{formatPrix(sousTotal)}</strong>
              </div>
            </div>

            {/* BOUTON RÉSERVER */}
            <button
              type="button"
              className="reservation-button"
              onClick={handleReservation}
              disabled={
                isAuthenticated &&
                (!arrivee || !depart || depart <= arrivee)
              }
            >
              {isAuthenticated
                ? "RÉSERVER CE SÉJOUR"
                : "SE CONNECTER POUR RÉSERVER"}
            </button>

         
          </aside>
        </div>

        {/* AVIS CLIENTS */}
        <ClientAvisPage />

        {/* AUTRES CHAMBRES */}
        {autresChambres.length > 0 && (
          <section className="detail-others">
            <div className="detail-others-header">
              <div>
                <span className="detail-eyebrow">
                  Notre sélection
                </span>

                <h2>Autres demeures d'exception</h2>
              </div>

              <Link to="/chambres" className="detail-others-link">
                Toute la sélection →
              </Link>
            </div>

            <div className="detail-others-grid">
              {autresChambres.map((item) => {
                const imagesAutre = getRoomImages(item);

                return (
                  <Link
                    to={`/chambres/${item.id}`}
                    state={{ criteresRecherche }}
                    className="other-card"
                    key={item.id}
                  >
                    <div className="other-card-img">
                      {imagesAutre.length > 0 ? (
                        <ImageChambre
                          src={imagesAutre[0]}
                          alt={`Chambre ${item.numero}`}
                        />
                      ) : (
                        <div className="no-image">
                          Aucune image
                        </div>
                      )}
                    </div>

                    <div className="other-card-body">
                      <h3>{item.type}</h3>

                      <p>Chambre {item.numero}</p>

                      <div className="other-card-foot">
                        <span>
                          {formatPrix(item.prix_nuit)} / nuit
                        </span>

                        <b>Découvrir</b>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default DetailChambrePage;