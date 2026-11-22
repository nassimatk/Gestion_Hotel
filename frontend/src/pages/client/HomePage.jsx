
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getChambres } from "../../services/chambresApi";
import { verifierChambre } from "../../services/disponibilitesApi";
import "./HomePage.css";

// ==================================================
// IMAGES DE SECOURS
// ==================================================

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
  "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80",
];

// ==================================================
// FONCTIONNALITÉS
// ==================================================

const FEATURES = [
  {
    title: "Réservation instantanée",
    desc: "Confirmation directe sans attente ni frais imprévus.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    title: "Transparence totale",
    desc: "Prix clairs et descriptions détaillées de chaque chambre.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    title: "Sécurité & Assistance",
    desc: "Un accompagnement dédié pour rendre votre séjour agréable.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

// ==================================================
// DATES LOCALES
// ==================================================

function getDateAujourdhui() {
  const date = new Date();

  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
}

function getDateDemain() {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
}

function jourSuivant(dateStr) {
  const [annee, mois, jour] = dateStr.split("-").map(Number);
  const date = new Date(annee, mois - 1, jour);

  date.setDate(date.getDate() + 1);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

// ==================================================
// EXTRACTION DES RÉPONSES API
// ==================================================

function unwrapResponse(response) {
  let result = response;

  for (let i = 0; i < 3; i++) {
    if (
      result &&
      !Array.isArray(result) &&
      typeof result === "object" &&
      Object.prototype.hasOwnProperty.call(result, "data")
    ) {
      result = result.data;
    } else {
      break;
    }
  }

  return result;
}

function extraireListe(response) {
  const data = unwrapResponse(response);

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.chambres)) return data.chambres;

  if (Array.isArray(data?.data)) return data.data;

  return [];
}

// ==================================================
// NORMALISATION DES IMAGES
// ==================================================

function getImageChambre(room) {
  let images = room?.images;

  if (!images) return "";

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

  const image = images[0];

  if (typeof image === "string") {
    if (
      /^https?:\/\//i.test(image) ||
      image.startsWith("data:") ||
      image.startsWith("blob:")
    ) {
      return image;
    }

    const base =
      import.meta.env.VITE_CHAMBRES_STORAGE_URL ||
      "http://localhost:8001/storage";

    return `${base.replace(/\/+$/, "")}/${image
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/^(public\/)?storage\//, "")}`;
  }

  if (image && typeof image === "object") {
    return (
      image.url ||
      image.path ||
      image.chemin ||
      image.image ||
      image.src ||
      ""
    );
  }

  return "";
}

// ==================================================
// VÉRIFICATION DE DISPONIBILITÉ
// ==================================================

function estChambreDisponible(response) {
  const data = unwrapResponse(response);

  return (
    data?.disponible === true ||
    data?.disponible === 1 ||
    data?.disponible === "true" ||
    data?.est_disponible === true ||
    data?.available === true ||
    data?.is_available === true
  );
}

// ==================================================
// ICÔNE ÉQUIPEMENT
// ==================================================

function AmenityIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ==================================================
// CARTE CHAMBRE
// ==================================================

function RoomCard({ room, index, criteresRecherche }) {
  const imagePersonnalisee = getImageChambre(room);

  const imageSrc =
    imagePersonnalisee || DEFAULT_IMAGES[index % DEFAULT_IMAGES.length];

  const numero = room.numero ?? room.id;

  const displayName = room.nom
    ? room.nom
    : `Chambre ${String(room.type || "STANDARD").toUpperCase()} N° ${numero}`;

  const displayDesc =
    room.description ||
    "Découvrez une chambre confortable et élégante.";

  const displayTag =
    room.vue ||
    (room.type === "suite"
      ? "Vue Mer Panoramique"
      : room.type === "presidentielle"
      ? "Prestige"
      : "Confort");

  const displaySize = room.superficie || 0;

  let amenities = room.equipements || [];

  if (typeof amenities === "string") {
    try {
      amenities = JSON.parse(amenities);
    } catch {
      amenities = amenities.split(",").map((a) => a.trim());
    }
  }

  if (!Array.isArray(amenities) || amenities.length === 0) {
    amenities = ["Climatisation", "Wi-Fi", "Confort"];
  }

  const prix = Number(room.prix_nuit || 0);

  const formattedPrice = new Intl.NumberFormat("fr-FR").format(prix);

  const detailUrl = `/chambres/${room.id}`;

const detailState = {
  chambre: room,

  criteresRecherche: criteresRecherche
    ? {
        dateArrivee: criteresRecherche.date_debut,
        dateDepart: criteresRecherche.date_fin,
        nombrePersonnes: Number(criteresRecherche.adultes),
      }
    : null,

  // Résultat retourné par le microservice Disponibilités
  disponibilite: room.disponibilite || null,
};

  return (
    <div className="room-card">

      <div className="room-card__image">
        <img
          src={imageSrc}
          alt={displayName}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              DEFAULT_IMAGES[index % DEFAULT_IMAGES.length];
          }}
        />

        <span className="room-card__tag">{displayTag}</span>

        <span className="room-card__size">
          {displaySize} m²
        </span>
      </div>

      <div className="room-card__body">

        <h3 className="room-card__name">
          {displayName}
        </h3>

        <p className="room-card__desc">
          {displayDesc}
        </p>

        <ul className="room-card__amenities">
          {amenities.slice(0, 3).map((a, i) => (
            <li key={i} className="room-card__amenity">
              <AmenityIcon />
              {typeof a === "object" ? a.nom || a.name : a}
            </li>
          ))}
        </ul>

        <div className="room-card__footer">

          <div className="room-card__price">
            <span className="room-card__price-amount">
              {formattedPrice} MAD
            </span>

            <span className="room-card__price-unit">
              / nuit
            </span>
          </div>

          <Link
            to={detailUrl}
            state={detailState}
            className="room-card__btn"
          >
            Voir les détails
          </Link>

        </div>
      </div>
    </div>
  );
}

// ==================================================
// PAGE PRINCIPALE
// ==================================================

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  // Dates et voyageurs
  const [dateDebut, setDateDebut] = useState(getDateAujourdhui);
  const [dateFin, setDateFin] = useState(getDateDemain);
  const [adultes, setAdultes] = useState(2);

  // Chambres
  const [rooms, setRooms] = useState([]);
  const [searchedRooms, setSearchedRooms] = useState(null);

  // États
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchError, setSearchError] = useState("");

  // Filtres
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Critères de recherche
  const [criteresRecherche, setCriteresRecherche] = useState(null);

  // ==================================================
  // CHARGEMENT DES CHAMBRES
  // ==================================================

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getChambres({
        statut: "disponible",
      });

      const liste = extraireListe(response);

      const chambresDisponibles = liste.filter((room) => {
        const statut = String(room.statut || "disponible")
          .trim()
          .toLowerCase();

        return ["disponible", "available"].includes(statut);
      });

      setRooms(chambresDisponibles);
    } catch (err) {
      console.error("Erreur récupération chambres :", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Impossible de charger les chambres."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // ==================================================
  // MODIFICATION DATE ARRIVÉE
  // ==================================================

  function changerDebut(val) {
    setDateDebut(val);

    if (dateFin <= val) {
      setDateFin(jourSuivant(val));
    }
  }

  // ==================================================
  // RECHERCHE DES DISPONIBILITÉS
  // ==================================================

  async function handleSearch(e) {
    e.preventDefault();

    setSearchError("");

    if (!dateDebut || !dateFin) {
      setSearchError("Veuillez sélectionner les dates de votre séjour.");
      return;
    }

    if (dateDebut < getDateAujourdhui()) {
      setSearchError("La date d'arrivée ne peut pas être dans le passé.");
      return;
    }

    if (dateFin <= dateDebut) {
      setSearchError("La date de départ doit être après la date d'arrivée.");
      return;
    }

    if (adultes < 1 || adultes > 8) {
      setSearchError("Le nombre de voyageurs doit être compris entre 1 et 8.");
      return;
    }

    const criteres = {
      date_debut: dateDebut,
      date_fin: dateFin,
      adultes: Number(adultes),
    };

    setCriteresRecherche(criteres);
    setSearchLoading(true);
    setSearchedRooms(null);
    setSelectedFilter("all");

    document.getElementById("chambres-signature")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    try {
      // Vérification de chaque chambre dans le microservice Disponibilités
      const verifications = await Promise.all(
        rooms.map(async (room) => {
          try {
            const response = await verifierChambre(room.id, {
              date_debut: criteres.date_debut,
              date_fin: criteres.date_fin,
              adultes: criteres.adultes,
            });

            return {
              room: {
                ...room,
                disponibilite: unwrapResponse(response),
              },
              disponible: estChambreDisponible(response),
              erreur: false,
            };
          } catch (err) {
            console.error(
              `Erreur disponibilité chambre ${room.id}:`,
              err.response?.data || err.message
            );

            return {
              room,
              disponible: false,
              erreur: true,
            };
          }
        })
      );

      const controlesReussis = verifications.filter(
        (resultat) => !resultat.erreur
      );

      // Toutes les vérifications ont échoué
      if (rooms.length > 0 && controlesReussis.length === 0) {
        throw new Error(
          "Impossible de contacter le service Disponibilités. Veuillez réessayer."
        );
      }

      // Chambres confirmées disponibles
      const disponibles = verifications
        .filter((resultat) => resultat.disponible)
        .map((resultat) => resultat.room);

      setSearchedRooms(disponibles);

      const erreursPartielles = verifications.some(
        (resultat) => resultat.erreur
      );

      if (erreursPartielles) {
        setSearchError(
          "Certaines chambres n'ont pas pu être vérifiées. Seules les disponibilités confirmées sont affichées."
        );
      }

      console.log("Critères de recherche :", criteres);
      console.log("Chambres disponibles :", disponibles);
    } catch (err) {
      console.error("Erreur recherche :", err);

      setSearchedRooms([]);
      setSearchError(
        err.message || "Une erreur est survenue pendant la recherche."
      );
    } finally {
      setSearchLoading(false);
    }
  }

  // ==================================================
  // FILTRAGE
  // ==================================================

  const chambresSource =
    searchedRooms !== null ? searchedRooms : rooms;

  const filteredRooms = chambresSource.filter((room) => {
    const type = String(room.type || "").toLowerCase();

    if (selectedFilter === "all") return true;

    if (selectedFilter === "suite") {
      return type === "suite" || type === "presidentielle";
    }

    if (selectedFilter === "double") {
      return type === "double";
    }

    if (selectedFilter === "simple") {
      return type === "simple";
    }

    return true;
  });

  // ==================================================
  // RÉINITIALISATION
  // ==================================================

  function reinitialiserRecherche() {
    setDateDebut(getDateAujourdhui());
    setDateFin(getDateDemain());
    setAdultes(2);

    setSearchedRooms(null);
    setCriteresRecherche(null);

    setSearchError("");
    setSelectedFilter("all");
  }

  // ==================================================
  // AFFICHAGE
  // ==================================================

  return (
    <>
      {/* HERO */}

      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__overlay" />

        <div className="hero__content">

          <div className="hero__badge">
            Hôtellerie d&apos;exception &amp; séjours sur-mesure
          </div>

          <h1 className="hero__title">
            Votre prochaine expérience
            <br />
            commence ici
          </h1>

          <p className="hero__subtitle">
            Découvrez des hébergements d&apos;exception soigneusement
            sélectionnés pour vos séjours d&apos;affaires et de loisirs.
          </p>

          <div className="hero__cta">
            <a href="#chambres-signature" className="btn-outline">
              Découvrir nos chambres →
            </a>

            {!isAuthenticated && (
              <Link to="/register" className="btn-gold">
                Créer un compte
              </Link>
            )}
          </div>

        </div>
      </section>

      {/* BARRE DE RECHERCHE */}

      <div className="search-bar-wrapper">

        <form className="search-bar" onSubmit={handleSearch}>

          <div className="search-bar__field">
            <span className="search-bar__icon">
              📍
            </span>

            <div className="search-bar__info">
              <span className="search-bar__label">
                Établissement
              </span>

              <span className="search-bar__value">
                Marrakech, Palmeraie
              </span>
            </div>
          </div>

          <label className="search-bar__field">
            <span className="search-bar__icon">
              📅
            </span>

            <div className="search-bar__info">
              <span className="search-bar__label">
                Date d'arrivée
              </span>

              <input
                type="date"
                className="search-bar__input"
                value={dateDebut}
                min={getDateAujourdhui()}
                required
                onChange={(e) => changerDebut(e.target.value)}
              />
            </div>
          </label>

          <label className="search-bar__field">
            <span className="search-bar__icon">
              📅
            </span>

            <div className="search-bar__info">
              <span className="search-bar__label">
                Date de départ
              </span>

              <input
                type="date"
                className="search-bar__input"
                value={dateFin}
                min={jourSuivant(dateDebut)}
                required
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
          </label>

          <label className="search-bar__field">
            <span className="search-bar__icon">
              👥
            </span>

            <div className="search-bar__info">
              <span className="search-bar__label">
                Voyageurs
              </span>

              <select
                className="search-bar__input"
                value={adultes}
                onChange={(e) => setAdultes(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} {n > 1 ? "personnes" : "personne"}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <button
            type="submit"
            className="search-bar__btn"
            disabled={loading || searchLoading}
          >
            {searchLoading ? "Recherche..." : "🔍 Rechercher"}
          </button>

        </form>

        {searchError && !searchLoading && (
          <p style={{
            color: "#991b1b",
            textAlign: "center",
            marginTop: 12,
            fontSize: 14
          }}>
            {searchError}
          </p>
        )}

      </div>

      {/* CHAMBRES */}

      <section className="rooms-section" id="chambres-signature">

        <div className="rooms-section__header">

          <div className="rooms-section__header-left">

            <span className="badge">
              Sélection Exclusive
            </span>

            <h2 className="section-title">
              Nos Chambres &amp; Suites Signature
            </h2>

            <p className="section-subtitle" style={{ marginTop: 10 }}>
              Une architecture raffinée où chaque détail honore le calme,
              les matières nobles et le confort absolu.
            </p>

            {searchedRooms !== null && !searchLoading && (
              <div style={{
                marginTop: 15,
                color: "#987344",
                fontWeight: 600
              }}>
                {searchedRooms.length} chambre(s) disponible(s)
                {" "}pour {criteresRecherche?.adultes} voyageur(s).

                <button
                  type="button"
                  onClick={reinitialiserRecherche}
                  style={{
                    marginLeft: 12,
                    border: "none",
                    background: "transparent",
                    color: "#987344",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  Réinitialiser la recherche
                </button>
              </div>
            )}

          </div>

          <div className="rooms-filter">

            <button
              className={`filter-btn ${selectedFilter === "all" ? "active" : ""}`}
              onClick={() => setSelectedFilter("all")}
              disabled={loading || searchLoading}
            >
              Toutes ({chambresSource.length})
            </button>

            <button
              className={`filter-btn ${selectedFilter === "suite" ? "active" : ""}`}
              onClick={() => setSelectedFilter("suite")}
              disabled={loading || searchLoading}
            >
              Suites
            </button>

            <button
              className={`filter-btn ${selectedFilter === "double" ? "active" : ""}`}
              onClick={() => setSelectedFilter("double")}
              disabled={loading || searchLoading}
            >
              Chambres Doubles
            </button>

            <button
              className={`filter-btn ${selectedFilter === "simple" ? "active" : ""}`}
              onClick={() => setSelectedFilter("simple")}
              disabled={loading || searchLoading}
            >
              Chambres Simples
            </button>

          </div>

        </div>

        {/* CHARGEMENT INITIAL */}

        {loading && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "80px 20px",
            flexDirection: "column",
            gap: 16
          }}>

            <div style={{
              width: 44,
              height: 44,
              border: "3px solid #e5e7eb",
              borderTop: "3px solid #c5a880",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite"
            }} />

            <style>
              {`@keyframes spin { to { transform: rotate(360deg); } }`}
            </style>

            <p style={{ color: "#6b7280" }}>
              Chargement des chambres d&apos;exception...
            </p>

          </div>
        )}

        {/* RECHERCHE EN COURS */}

        {searchLoading && !loading && (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#987344"
          }}>
            <p>
              Vérification des disponibilités...
            </p>

            <p style={{ fontSize: 13, marginTop: 8 }}>
              Nous recherchons les chambres adaptées à votre séjour.
            </p>
          </div>
        )}

        {/* ERREUR */}

        {error && !loading && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: 20,
            borderRadius: 12,
            textAlign: "center",
            margin: "20px 0"
          }}>

            <p style={{ marginBottom: 12 }}>
              ⚠️ {error}
            </p>

            <button
              type="button"
              onClick={fetchRooms}
              style={{
                background: "#0f1d2d",
                color: "#fff",
                border: "none",
                padding: "8px 18px",
                borderRadius: 6,
                cursor: "pointer"
              }}
            >
              Réessayer
            </button>

          </div>
        )}

        {/* AUCUN RÉSULTAT */}

        {!loading &&
          !searchLoading &&
          !error &&
          searchedRooms !== null &&
          filteredRooms.length === 0 && (

            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "#fff",
              borderRadius: 12,
              border: "1px dashed #d1d5db"
            }}>

              <h3>
                Aucune chambre disponible
              </h3>

              <p style={{
                marginTop: 10,
                color: "#6b7280"
              }}>
                Essayez d'autres dates ou modifiez le nombre de voyageurs.
              </p>

            </div>
          )}

        {/* LISTE DES CHAMBRES */}

        {!loading &&
          !searchLoading &&
          !error &&
          filteredRooms.length > 0 && (

            <div className="rooms-grid">

              {filteredRooms.map((room, idx) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  index={idx}
                  criteresRecherche={criteresRecherche}
                />
              ))}

            </div>
          )}

      </section>

      {/* FEATURES */}

      <section className="features-section">

        <div className="features-section__header">

          <span className="badge">
            Excellence &amp; Sérénité
          </span>

          <h2 className="section-title">
            Pourquoi choisir HotelHub
          </h2>

          <p className="section-subtitle">
            Une exigence continue conçue pour transformer chaque instant
            de réservation en une promesse de sérénité absolue.
          </p>

        </div>

        <div className="features-grid">

          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">

              <div className="feature-card__icon">
                {f.icon}
              </div>

              <h3 className="feature-card__title">
                {f.title}
              </h3>

              <p className="feature-card__desc">
                {f.desc}
              </p>

            </div>
          ))}

        </div>

      </section>

      {/* CTA */}

      <section className="cta-section">

        <div className="cta-section__left">

          <span className="cta-section__badge">
            Expérience Membre Exclusif
          </span>

          <h2 className="cta-section__title">
            Prêt à planifier votre prochain
            <br />
            séjour d&apos;exception ?
          </h2>

          <p className="cta-section__subtitle">
            Rejoignez le cercle privilégié HotelHub et découvrez
            nos chambres et suites.
          </p>

        </div>

        {!isAuthenticated ? (
          <Link to="/register" className="cta-section__btn">
            Rejoindre HotelHub →
          </Link>
        ) : (
          <Link to="/chambres" className="cta-section__btn">
            Voir nos chambres →
          </Link>
        )}

      </section>
    </>
  );
}
