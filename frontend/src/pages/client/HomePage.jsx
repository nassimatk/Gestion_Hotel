
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getChambres } from "../../services/chambresApi";
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
    desc: "Confirmation directe sans attente ni frais imprévus. Votre chambre est garantie immédiatement auprès de la direction de l'établissement.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    title: "Transparence totale",
    desc: "Prix clairs, taxes incluses et descriptions certifiées de chaque suite après audit physique par nos experts hôteliers.",
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
    desc: "Paiement bancaire ultra-sécurisé avec chiffrement bancaire et conciergerie dédiée joignable 24h/24 et 7j/7 pour vos demandes spéciales.",
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
// FONCTIONS UTILITAIRES
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
// CARTE CHAMBRE DYNAMIQUE
// ==================================================

function RoomCard({ room, index, criteresRecherche }) {

  // Image de la chambre
  const hasCustomImage =
    Array.isArray(room.images) &&
    room.images[0] &&
    (
      room.images[0].startsWith("http") ||
      room.images[0].startsWith("data:") ||
      room.images[0].startsWith("blob:")
    );

  const imageSrc = hasCustomImage
    ? room.images[0]
    : DEFAULT_IMAGES[index % DEFAULT_IMAGES.length];

  // Nom de la chambre
  const displayName = room.nom
    ? (
        room.nom.includes(String(room.numero))
          ? room.nom
          : `${room.nom} (N° ${room.numero})`
      )
    : `Chambre ${room.type ? room.type.toUpperCase() : "STANDARD"} N° ${room.numero}`;

  // Description
  const displayDesc =
    room.description ||
    "Un hébergement raffiné où chaque détail honore le calme et le confort absolu.";

  // Vue ou standing
  const displayTag =
    room.vue ||
    (
      room.type === "suite"
        ? "Vue Mer Panoramique"
        : room.type === "presidentielle"
        ? "Piscine Privée & Spa"
        : "Jardin Secret"
    );

  // Surface
  const displaySize =
    room.superficie ||
    (
      room.type === "presidentielle"
        ? 140
        : room.type === "suite"
        ? 85
        : 48
    );

  // Équipements
  const displayAmenities =
    Array.isArray(room.equipements) && room.equipements.length > 0
      ? room.equipements.slice(0, 3)
      : ["Lit King Size", "Climatisation", "Wi-Fi Haut Débit"];

  // Tarif
  const formattedPrice = new Intl.NumberFormat("fr-FR").format(
    Number(room.prix_nuit || 0)
  );

  return (
    <div className="room-card">

      {/* IMAGE */}
      <div className="room-card__image">
        <img
          src={imageSrc}
          alt={displayName}
          loading="lazy"
          onError={(e) => {
            e.target.src = DEFAULT_IMAGES[index % DEFAULT_IMAGES.length];
          }}
        />

        <span className="room-card__tag">
          {displayTag}
        </span>

        <span className="room-card__size">
          {displaySize} m²
        </span>
      </div>

      {/* INFORMATIONS */}
      <div className="room-card__body">

        <h3 className="room-card__name">
          {displayName}
        </h3>

        <p className="room-card__desc">
          {displayDesc}
        </p>

        {/* ÉQUIPEMENTS */}
        <ul className="room-card__amenities">
          {displayAmenities.map((a, i) => (
            <li key={i} className="room-card__amenity">
              <AmenityIcon />
              {a}
            </li>
          ))}
        </ul>

        {/* PRIX ET DÉTAILS */}
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
            to={`/chambres/${room.id}`}
            state={{ criteresRecherche }}
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

  // --------------------------------------------------
  // ÉTATS DES CHAMBRES
  // --------------------------------------------------

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");

  // --------------------------------------------------
  // ÉTATS DE RECHERCHE
  // --------------------------------------------------

  const [dateDebut, setDateDebut] = useState(getDateAujourdhui);
  const [dateFin, setDateFin] = useState(getDateDemain);
  const [adultes, setAdultes] = useState(2);

  const [criteresRecherche, setCriteresRecherche] = useState(null);
  const [searchError, setSearchError] = useState("");

  // --------------------------------------------------
  // RÉCUPÉRATION DES CHAMBRES
  // --------------------------------------------------

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getChambres({
        statut: "disponible",
      });

      setRooms(Array.isArray(data) ? data : []);

    } catch (err) {
      console.error(
        "Erreur lors de la récupération des chambres :",
        err
      );

      setError(
        err.message ||
        "Impossible de charger les chambres disponibles."
      );

    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // CHARGEMENT INITIAL
  // --------------------------------------------------

  useEffect(() => {
    fetchRooms();
  }, []);

  // --------------------------------------------------
  // VALIDATION ET RECHERCHE
  // --------------------------------------------------

  const handleSearch = () => {

    setSearchError("");

    if (!dateDebut || !dateFin) {
      setSearchError("Veuillez sélectionner les dates de votre séjour.");
      return;
    }

    if (new Date(dateFin) <= new Date(dateDebut)) {
      setSearchError("La date de départ doit être après la date d'arrivée.");
      return;
    }

    if (dateDebut < getDateAujourdhui()) {
      setSearchError("La date d'arrivée ne peut pas être dans le passé.");
      return;
    }

    if (Number(adultes) < 1) {
      setSearchError("Le nombre de voyageurs doit être au moins égal à 1.");
      return;
    }

    // IMPORTANT : noms identiques à DetailChambrePage.jsx
    const criteres = {
      dateArrivee: dateDebut,
      dateDepart: dateFin,
      nombrePersonnes: Number(adultes),
    };

    setCriteresRecherche(criteres);

    console.log("Critères de recherche :", criteres);

    // Actualiser les chambres disponibles
    fetchRooms();
  };

  // --------------------------------------------------
  // FILTRAGE DES CHAMBRES
  // --------------------------------------------------

  const filteredRooms = rooms.filter((r) => {

    if (selectedFilter === "all") return true;

    if (selectedFilter === "suite") {
      return r.type === "suite" || r.type === "presidentielle";
    }

    if (selectedFilter === "double") {
      return r.type === "double";
    }

    if (selectedFilter === "simple") {
      return r.type === "simple";
    }

    return true;
  });

  // ==================================================
  // AFFICHAGE
  // ==================================================

  return (
    <>

      {/* ==================================================
          HERO
      ================================================== */}

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

      {/* ==================================================
          BARRE DE RECHERCHE
      ================================================== */}

      <div className="search-bar-wrapper">

        <div className="search-bar">

          {/* DESTINATION */}
          <div className="search-bar__field">

            <span className="search-bar__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>

            <div className="search-bar__info">
              <span className="search-bar__label">
                Destination ou Hôtel
              </span>

              <span className="search-bar__value">
                Marrakech, Palmeraie
              </span>
            </div>

          </div>

          {/* DATE ARRIVÉE */}
          <div className="search-bar__field">

            <span className="search-bar__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>

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

          {/* DATE DÉPART */}
          <div className="search-bar__field">

            <span className="search-bar__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>

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

          {/* VOYAGEURS */}
          <div className="search-bar__field">

            <span className="search-bar__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>

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
                {[1, 2, 3, 4, 5, 6, 7, 8].map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre} {nombre > 1 ? "Adultes" : "Adulte"}
                  </option>
                ))}
              </select>

            </div>
          </div>

          {/* BOUTON RECHERCHER */}
          <button
            type="button"
            className="search-bar__btn"
            onClick={handleSearch}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            Rechercher
          </button>

        </div>

        {/* ERREUR DE RECHERCHE */}
        {searchError && (
          <p
            style={{
              color: "#b91c1c",
              textAlign: "center",
              marginTop: "12px",
              fontSize: "14px",
            }}
          >
            {searchError}
          </p>
        )}

      </div>

      {/* ==================================================
          CHAMBRES
      ================================================== */}

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
              Une architecture raffinée où chaque détail honore le calme, la sensualité
              des matières nobles et le confort absolu.
            </p>

          </div>

          {/* FILTRES */}
          <div className="rooms-filter">

            <button
              className={`filter-btn ${selectedFilter === "all" ? "active" : ""}`}
              onClick={() => setSelectedFilter("all")}
            >
              Toutes ({rooms.length})
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

        {/* CHARGEMENT */}
        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "80px 20px",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                border: "3px solid #e5e7eb",
                borderTop: "3px solid #c5a880",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />

            <style>
              {`@keyframes spin { to { transform: rotate(360deg); } }`}
            </style>

            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Chargement des chambres d&apos;exception...
            </p>
          </div>
        )}

        {/* ERREUR API */}
        {error && !loading && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "20px",
              borderRadius: "12px",
              textAlign: "center",
              margin: "20px 0",
            }}
          >
            <p style={{ margin: "0 0 12px", fontWeight: "600" }}>
              ⚠️ {error}
            </p>

            <button
              onClick={fetchRooms}
              style={{
                background: "#0f1d2d",
                color: "#ffffff",
                border: "none",
                padding: "8px 18px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Réessayer
            </button>
          </div>
        )}

        {/* AUCUNE CHAMBRE */}
        {!loading && !error && filteredRooms.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px dashed #d1d5db",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                color: "#374151",
                margin: "0 0 8px",
                fontWeight: "600",
              }}
            >
              Aucune chambre disponible dans cette sélection
            </p>

            <p style={{ fontSize: "13.5px", color: "#6b7280", margin: 0 }}>
              Veuillez modifier votre filtre ou nous contacter pour une réservation sur-mesure.
            </p>
          </div>
        )}

        {/* GRILLE DES CHAMBRES */}
        {!loading && !error && filteredRooms.length > 0 && (
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

      {/* ==================================================
          FEATURES
      ================================================== */}

      <section className="features-section">

        <div className="features-section__header">

          <span className="badge">
            Excellence &amp; Sérénité
          </span>

          <h2 className="section-title">
            Pourquoi choisir HotelHub
          </h2>

          <p className="section-subtitle">
            Une exigence continue conçue pour transformer chaque instant de
            réservation en une promesse de sérénité absolue.
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

      {/* ==================================================
          CTA
      ================================================== */}

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
            Rejoignez le cercle privilégié HotelHub et bénéficiez de surclassements
            prioritaires, de cocktails de bienvenue et d&apos;attentions exclusives.
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
