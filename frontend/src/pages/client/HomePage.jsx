
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getChambres } from "../../services/chambresApi";
import { verifierChambre } from "../../services/disponibilitesApi";
import "./HomePage.css";

// ==================================================
// PHOTOS DE SECOURS
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
// FONCTIONNALITÉS HOTELHUB
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
// DATES
// ==================================================

const getDateAujourdhui = () => {
  const date = new Date();
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
};

const getDateDemain = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
};

// ==================================================
// EXTRACTION DES CHAMBRES
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
// NORMALISATION DES IMAGES
// ==================================================

const getImageChambre = (room) => {
  let images = room?.images;

  if (!images) return "";

  if (typeof images === "string") {
    try {
      images = JSON.parse(images);
    } catch {
      images = [images];
    }
  }

  if (!Array.isArray(images)) images = [images];

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
};

// ==================================================
// CAPACITÉ D'UNE CHAMBRE
// ==================================================

const getCapaciteChambre = (room) => {
  return Number(
    room.capacite ??
    room.capacity ??
    room.nombre_personnes ??
    room.capacite_max ??
    room.nombre_lits ??
    0
  );
};

// ==================================================
// VÉRIFICATION DE LA DISPONIBILITÉ
// ==================================================

const estChambreDisponible = (response) => {
  const data = response?.data?.data ?? response?.data ?? response;

  if (typeof data === "boolean") {
    return data;
  }

  return (
    data?.disponible === true ||
    data?.disponible === 1 ||
    data?.disponible === "true" ||
    data?.est_disponible === true ||
    data?.available === true ||
    data?.is_available === true
  );
};

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
    room.description || "Découvrez une chambre confortable et élégante.";

  const displayTag =
    room.vue ||
    (room.type === "suite"
      ? "Suite"
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

  const formattedPrice = new Intl.NumberFormat("fr-FR").format(
    Number(room.prix_nuit || 0)
  );

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
        <span className="room-card__size">{displaySize} m²</span>
      </div>

      <div className="room-card__body">

        <h3 className="room-card__name">{displayName}</h3>

        <p className="room-card__desc">{displayDesc}</p>

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

            <span className="room-card__price-unit">/ nuit</span>
          </div>

          {/* CORRECTION : NAVIGATION VERS LE DÉTAIL DE LA CHAMBRE */}

          <Link
            to={`/chambres/${room.id}`}
            state={{
              criteresRecherche,
              chambre: room,
            }}
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

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedFilter, setSelectedFilter] = useState("all");

  const [dateDebut, setDateDebut] = useState(getDateAujourdhui);
  const [dateFin, setDateFin] = useState(getDateDemain);
  const [adultes, setAdultes] = useState(2);

  const [criteresRecherche, setCriteresRecherche] = useState(null);
  const [searchError, setSearchError] = useState("");

  const [searchedRooms, setSearchedRooms] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // ==================================================
  // CHARGEMENT DES CHAMBRES
  // ==================================================

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getChambres({
        statut: "disponible",
      });

      const liste = extraireListe(response);

      const disponibles = liste.filter((room) => {
        const statut = String(room.statut || "disponible")
          .trim()
          .toLowerCase();

        return ["disponible", "available"].includes(statut);
      });

      setRooms(disponibles);

    } catch (err) {
      console.error("Erreur récupération chambres :", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Impossible de charger les chambres disponibles."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // ==================================================
  // RECHERCHE AVEC DISPONIBILITÉ ET CAPACITÉ
  // ==================================================

  const handleSearch = async () => {
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

    if (adultes < 1) {
      setSearchError("Le nombre de voyageurs doit être au moins égal à 1.");
      return;
    }

    const criteres = {
      dateArrivee: dateDebut,
      dateDepart: dateFin,
      nombrePersonnes: Number(adultes),
    };

    setCriteresRecherche(criteres);
    setSearchLoading(true);
    setSearchedRooms(null);

    document.getElementById("chambres-signature")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    try {
      const chambresCompatibles = rooms.filter((room) => {
        return getCapaciteChambre(room) >= Number(adultes);
      });

      if (chambresCompatibles.length === 0) {
        setSearchedRooms([]);
        setSearchError(
          "Aucune chambre ne possède la capacité demandée."
        );
        return;
      }

      console.log("Chambres compatibles :", chambresCompatibles);

      const verifications = await Promise.all(
        chambresCompatibles.map(async (room) => {
          try {
            const response = await verifierChambre(room.id, {
              date_arrivee: dateDebut,
              date_depart: dateFin,
            });

            console.log(
              `Disponibilité chambre ${room.id} :`,
              response.data
            );

            return {
              room,
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

      if (controlesReussis.length === 0) {
        throw new Error(
          "Le service Disponibilités ne répond pas. Vérifiez le service."
        );
      }

      const chambresDisponibles = verifications
        .filter((resultat) => resultat.disponible)
        .map((resultat) => resultat.room);

      setSearchedRooms(chambresDisponibles);

      console.log("Critères de recherche :", criteres);
      console.log("Résultats :", chambresDisponibles);

      if (chambresDisponibles.length === 0) {
        setSearchError(
          "Aucune chambre disponible pour ces dates et ce nombre de personnes."
        );
      }

    } catch (err) {
      console.error("Erreur recherche :", err);

      setSearchedRooms([]);
      setSearchError(
        err.message ||
        "Impossible d'effectuer la recherche. Réessayez."
      );

    } finally {
      setSearchLoading(false);
    }
  };

  // ==================================================
  // FILTRAGE DES CHAMBRES
  // ==================================================

  const chambresSource = searchedRooms !== null
    ? searchedRooms
    : rooms;

  const filteredRooms = chambresSource.filter((room) => {
    if (selectedFilter === "all") return true;

    if (selectedFilter === "suite") {
      return ["suite", "presidentielle"].includes(
        String(room.type || "").toLowerCase()
      );
    }

    if (selectedFilter === "double") {
      return String(room.type || "").toLowerCase() === "double";
    }

    if (selectedFilter === "simple") {
      return String(room.type || "").toLowerCase() === "simple";
    }

    return true;
  });

  // ==================================================
  // RÉINITIALISER LA RECHERCHE
  // ==================================================

  const reinitialiserRecherche = () => {
    setSearchedRooms(null);
    setCriteresRecherche(null);
    setSearchError("");
    setSelectedFilter("all");
    setDateDebut(getDateAujourdhui());
    setDateFin(getDateDemain());
    setAdultes(2);
  };

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
            Découvrez des hébergements d&apos;exception soigneusement sélectionnés
            pour vos séjours d&apos;affaires et de loisirs.
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
        <div className="search-bar">

          <div className="search-bar__field">
            <span className="search-bar__icon">📍</span>
            <div className="search-bar__info">
              <span className="search-bar__label">
                Destination ou Hôtel
              </span>
              <span className="search-bar__value">
                Marrakech, Palmeraie
              </span>
            </div>
          </div>

          <div className="search-bar__field">
            <span className="search-bar__icon">📅</span>
            <div className="search-bar__info">
              <label className="search-bar__label" htmlFor="date-arrivee">
                Date d&apos;arrivée
              </label>
              <input
                id="date-arrivee"
                type="date"
                className="search-bar__value"
                min={getDateAujourdhui()}
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>
          </div>

          <div className="search-bar__field">
            <span className="search-bar__icon">📅</span>
            <div className="search-bar__info">
              <label className="search-bar__label" htmlFor="date-depart">
                Date de départ
              </label>
              <input
                id="date-depart"
                type="date"
                className="search-bar__value"
                min={dateDebut || getDateAujourdhui()}
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
          </div>

          <div className="search-bar__field">
            <span className="search-bar__icon">👥</span>
            <div className="search-bar__info">
              <label className="search-bar__label" htmlFor="nombre-voyageurs">
                Voyageurs
              </label>
              <select
                id="nombre-voyageurs"
                className="search-bar__value"
                value={adultes}
                onChange={(e) => setAdultes(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} {n > 1 ? "Adultes" : "Adulte"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            className="search-bar__btn"
            onClick={handleSearch}
            disabled={searchLoading || loading}
          >
            {searchLoading
              ? "Recherche en cours..."
              : "🔍 Rechercher"}
          </button>

        </div>

        {searchError && (
          <p style={{
            color: "#b91c1c",
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

            <span className="badge">Sélection Exclusive</span>

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
                {filteredRooms.length} chambre(s) trouvée(s)
                {" "}pour {adultes} voyageur(s).
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
            >
              Toutes ({chambresSource.length})
            </button>

            <button
              className={`filter-btn ${selectedFilter === "suite" ? "active" : ""}`}
              onClick={() => setSelectedFilter("suite")}
            >
              Suites
            </button>

            <button
              className={`filter-btn ${selectedFilter === "double" ? "active" : ""}`}
              onClick={() => setSelectedFilter("double")}
            >
              Chambres Doubles
            </button>

            <button
              className={`filter-btn ${selectedFilter === "simple" ? "active" : ""}`}
              onClick={() => setSelectedFilter("simple")}
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
              Chargement des chambres...
            </p>
          </div>
        )}

        {/* ERREUR DE CHARGEMENT */}

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
            <p>{error}</p>

            <button onClick={fetchRooms}>
              Réessayer
            </button>
          </div>
        )}

        {/* RECHERCHE EN COURS */}

        {searchLoading && (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#987344"
          }}>
            <p>Vérification des disponibilités...</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>
              Nous recherchons les chambres adaptées à votre séjour.
            </p>
          </div>
        )}

        {/* AUCUNE CHAMBRE */}

        {!loading &&
          !searchLoading &&
          !error &&
          filteredRooms.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "#fff",
              borderRadius: 12
            }}>
              <h3>Aucune chambre disponible</h3>

              <p style={{ marginTop: 10 }}>
                {searchError ||
                  "Aucune chambre disponible dans cette sélection."}
              </p>
            </div>
          )}

        {/* AFFICHAGE DES CHAMBRES */}

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

          <span className="badge">Excellence &amp; Sérénité</span>

          <h2 className="section-title">
            Pourquoi choisir HotelHub
          </h2>

          <p className="section-subtitle">
            Une expérience conçue pour transformer chaque réservation
            en une promesse de sérénité.
          </p>

        </div>

        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-card__icon">{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
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
            Rejoignez HotelHub et découvrez nos chambres et suites.
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
