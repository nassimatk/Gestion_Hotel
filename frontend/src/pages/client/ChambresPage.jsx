import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getChambres } from "../../services/chambresApi";
import "./ChambresPage.css";

// Photos de secours haute résolution au standard luxe HotelHub
const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
  "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80",
];

/* ── Icône aménitie checkmark ── */
function AmenityIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ── Carte individuelle de chambre avec carrousel d'images intégré ── */
function ClientRoomCard({ room, index, onSelect }) {
  const [photoIndex, setPhotoIndex] = useState(0);

  // Liste de toutes les images disponibles pour cette chambre
  const cardImages = useMemo(() => {
    if (Array.isArray(room.images) && room.images.length > 0) {
      return room.images.map((img, i) => {
        if (
          typeof img === "string" &&
          (img.startsWith("http") || img.startsWith("data:") || img.startsWith("blob:"))
        ) {
          return img;
        }
        return DEFAULT_IMAGES[(index + i) % DEFAULT_IMAGES.length];
      });
    }
    return [DEFAULT_IMAGES[index % DEFAULT_IMAGES.length]];
  }, [room.images, index]);

  const totalPhotos = cardImages.length;
  const currentImageSrc = cardImages[photoIndex] || cardImages[0];

  const handlePrev = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setPhotoIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setPhotoIndex((prev) => (prev + 1) % totalPhotos);
  };

  // Titre fidèle à la maquette : nom éditorial ou "Chambre TYPE N° NUMERO"
  const displayName = room.nom
    ? (room.nom.includes(String(room.numero)) ? room.nom : `${room.nom} (N° ${room.numero})`)
    : `Chambre ${room.type ? room.type.toUpperCase() : "STANDARD"} N° ${room.numero}`;

  const displayDesc =
    room.description ||
    "Hébergement d'exception soigneusement aménagé pour un séjour d'affaires ou de loisirs inoubliable.";

  // Tag Vue ou standing
  const displayTag =
    room.vue ||
    (room.type === "suite"
      ? "Vue Mer Panoramique"
      : room.type === "presidentielle"
      ? "Piscine Privée & Spa"
      : "Jardin Secret");

  // Surface
  const displaySize =
    room.superficie ||
    (room.type === "presidentielle" ? 250 : room.type === "suite" ? 85 : 30);

  // Équipements phares (3 max)
  const displayAmenities =
    Array.isArray(room.equipements) && room.equipements.length > 0
      ? room.equipements.slice(0, 3)
      : ["Wi-Fi", "Climatisation", "TV 43\""];

  const formattedPrice = new Intl.NumberFormat("fr-FR").format(
    Number(room.prix_nuit || 0)
  );

  return (
    <div className="room-card">
      <div className="room-card__image">
        <img
          key={photoIndex}
          src={currentImageSrc}
          alt={displayName}
          loading="lazy"
          onError={(e) => {
            e.target.src = DEFAULT_IMAGES[index % DEFAULT_IMAGES.length];
          }}
        />

        {/* Flèches de navigation sur la carte si plusieurs images */}
        {totalPhotos > 1 && (
          <>
            <button
              type="button"
              className="card-nav-arrow card-nav-prev"
              onClick={handlePrev}
              aria-label="Photo précédente"
              title="Photo précédente"
            >
              ‹
            </button>
            <button
              type="button"
              className="card-nav-arrow card-nav-next"
              onClick={handleNext}
              aria-label="Photo suivante"
              title="Photo suivante"
            >
              ›
            </button>

            {/* Pagination par points cliquables sous l'image */}
            <div className="card-nav-dots" onClick={(e) => e.stopPropagation()}>
              {cardImages.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  className={`card-nav-dot ${dotIdx === photoIndex ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setPhotoIndex(dotIdx);
                  }}
                  aria-label={`Photo ${dotIdx + 1}`}
                />
              ))}
            </div>

            {/* Badge discret nombre de photos */}
            <span className="card-photo-counter">
              {photoIndex + 1}/{totalPhotos}
            </span>
          </>
        )}

        <span className="room-card__tag">{displayTag}</span>
        <span className="room-card__size">{displaySize} m²</span>
      </div>

      <div className="room-card__body">
        <h3 className="room-card__name">{displayName}</h3>
        <p className="room-card__desc">{displayDesc}</p>

        <ul className="room-card__amenities">
          {displayAmenities.map((a, i) => (
            <li key={i} className="room-card__amenity">
              <AmenityIcon />
              <span>{a}</span>
            </li>
          ))}
        </ul>

        <div className="room-card__footer">
          <div className="room-card__price">
            <span className="room-card__price-amount">{formattedPrice} MAD</span>
            <span className="room-card__price-unit">/ nuit</span>
          </div>
          <button
            type="button"
            className="room-card__btn"
            onClick={() => onSelect(room)}
          >
            Voir les détails
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page Principale : Ensemble des Chambres ── */
export default function ChambresPage() {
  const { isAuthenticated } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Remonter en haut de page lors de l'accès
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Obtenir toutes les images valides pour la galerie modale
  const getModalImages = (room) => {
    if (!room) return [];
    if (Array.isArray(room.images) && room.images.length > 0) {
      return room.images.map((img, idx) => {
        if (
          typeof img === "string" &&
          (img.startsWith("http") || img.startsWith("data:") || img.startsWith("blob:"))
        ) {
          return img;
        }
        return DEFAULT_IMAGES[idx % DEFAULT_IMAGES.length];
      });
    }
    return [DEFAULT_IMAGES[0]];
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      // Récupération des chambres disponibles depuis le Chambre Service
      const data = await getChambres({ statut: "disponible" });
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur de chargement des chambres :", err);
      setError(
        err.message ||
          "Impossible de charger les chambres disponibles. Vérifiez que le service Chambre est démarré."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Filtrage selon catégorie
  const filteredRooms = rooms.filter((r) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "suite")
      return r.type === "suite" || r.type === "presidentielle";
    if (selectedFilter === "double") return r.type === "double";
    if (selectedFilter === "simple") return r.type === "simple";
    return true;
  });

  return (
    <div className="chambres-client-page">
      <div className="chambres-client-container">
        {/* En-tête de la page */}
        <header className="chambres-client-header">
          <div className="chambres-client-header-top">
            <span className="chambres-badge">Hôtellerie d&apos;exception</span>
            <h1 className="chambres-client-title">Nos Chambres &amp; Suites</h1>
            <p className="chambres-client-subtitle">
              Explorez l&apos;ensemble de nos hébergements haut de gamme, alliant
              matériaux nobles, sérénité et confort absolu pour une expérience inoubliable.
            </p>
          </div>

          {/* Barre de filtres */}
          <div className="chambres-filter-bar">
            <button
              type="button"
              className={`filter-btn ${selectedFilter === "all" ? "active" : ""}`}
              onClick={() => setSelectedFilter("all")}
            >
              Toutes ({rooms.length})
            </button>
            <button
              type="button"
              className={`filter-btn ${selectedFilter === "simple" ? "active" : ""}`}
              onClick={() => setSelectedFilter("simple")}
            >
              Chambres Simples
            </button>
            <button
              type="button"
              className={`filter-btn ${selectedFilter === "double" ? "active" : ""}`}
              onClick={() => setSelectedFilter("double")}
            >
              Chambres Doubles
            </button>
            <button
              type="button"
              className={`filter-btn ${selectedFilter === "suite" ? "active" : ""}`}
              onClick={() => setSelectedFilter("suite")}
            >
              Suites &amp; Prestige
            </button>
          </div>
        </header>

        {/* État de chargement */}
        {loading && (
          <div className="chambres-loading-state">
            <div className="chambres-spinner" />
            <p>Chargement des chambres en cours...</p>
          </div>
        )}

        {/* État d'erreur */}
        {error && !loading && (
          <div className="chambres-error-box">
            <p>⚠️ {error}</p>
            <button
              type="button"
              className="chambres-retry-btn"
              onClick={fetchRooms}
            >
              Réessayer
            </button>
          </div>
        )}

        {/* État liste vide */}
        {!loading && !error && filteredRooms.length === 0 && (
          <div className="chambres-empty-box">
            <h3>Aucune chambre disponible dans cette sélection</h3>
            <p>
              Veuillez sélectionner un autre filtre ou nous contacter pour une
              réservation sur-mesure.
            </p>
          </div>
        )}

        {/* Grille des chambres */}
        {!loading && !error && filteredRooms.length > 0 && (
          <div className="rooms-grid">
            {filteredRooms.map((room, idx) => (
              <ClientRoomCard
                key={room.id}
                room={room}
                index={idx}
                onSelect={(r) => {
                  setSelectedRoom(r);
                  setActivePhotoIdx(0);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de détail d'une chambre avec Carousel & Galerie */}
      {selectedRoom && (() => {
        const modalImages = getModalImages(selectedRoom);
        const currentImg = modalImages[activePhotoIdx] || modalImages[0];

        const handleNextPhoto = (e) => {
          e.stopPropagation();
          setActivePhotoIdx((prev) => (prev + 1) % modalImages.length);
        };

        const handlePrevPhoto = (e) => {
          e.stopPropagation();
          setActivePhotoIdx((prev) => (prev - 1 + modalImages.length) % modalImages.length);
        };

        return (
          <div
            className="room-detail-modal-overlay"
            onClick={() => setSelectedRoom(null)}
          >
            <div
              className="room-detail-modal-box"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="room-detail-close-btn"
                onClick={() => setSelectedRoom(null)}
                aria-label="Fermer"
              >
                ✕
              </button>

              <div className="room-detail-modal-content">
                {/* Galerie / Carousel d'images */}
                <div className="room-detail-carousel">
                  <div className="room-detail-image-wrapper">
                    <img
                      src={currentImg}
                      onError={(e) => {
                        e.target.src = DEFAULT_IMAGES[0];
                      }}
                      alt={selectedRoom.nom || selectedRoom.numero}
                    />
                    <span className="room-card__tag">
                      {selectedRoom.vue || "Vue d'exception"}
                    </span>
                    <span className="room-card__size">
                      {selectedRoom.superficie || 45} m²
                    </span>

                    {/* Contrôles du carousel si plusieurs photos */}
                    {modalImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="carousel-arrow carousel-arrow-left"
                          onClick={handlePrevPhoto}
                          aria-label="Photo précédente"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className="carousel-arrow carousel-arrow-right"
                          onClick={handleNextPhoto}
                          aria-label="Photo suivante"
                        >
                          ›
                        </button>
                        <div className="carousel-counter-pill">
                          <span>📷</span>
                          <span>
                            {activePhotoIdx + 1} / {modalImages.length}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Bandeau de miniatures */}
                  {modalImages.length > 1 && (
                    <div className="room-detail-thumbnails-strip">
                      {modalImages.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`room-detail-thumb-btn ${i === activePhotoIdx ? "active" : ""}`}
                          onClick={() => setActivePhotoIdx(i)}
                          aria-label={`Photo ${i + 1}`}
                        >
                          <img src={img} alt={`Miniature ${i + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              <div className="room-detail-body">
                <h2>
                  {selectedRoom.nom
                    ? (selectedRoom.nom.includes(String(selectedRoom.numero)) ? selectedRoom.nom : `${selectedRoom.nom} (N° ${selectedRoom.numero})`)
                    : `Chambre ${selectedRoom.type?.toUpperCase()} N° ${selectedRoom.numero}`}
                </h2>

                <div className="room-detail-meta-row">
                  <span>
                    👥 Capacité :{" "}
                    <strong>{selectedRoom.capacite || 2} personnes</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Étage :{" "}
                    <strong>
                      {selectedRoom.etage ? `Étage ${selectedRoom.etage}` : "RDC"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Type :{" "}
                    <strong style={{ textTransform: "capitalize" }}>
                      {selectedRoom.type}
                    </strong>
                  </span>
                </div>

                <p className="room-detail-desc">
                  {selectedRoom.description ||
                    "Chambre d'exception alliant modernité, calme et confort absolu."}
                </p>

                {Array.isArray(selectedRoom.equipements) &&
                  selectedRoom.equipements.length > 0 && (
                    <div className="room-detail-amenities-section">
                      <h4>Équipements inclus :</h4>
                      <div className="room-detail-amenities-grid">
                        {selectedRoom.equipements.map((item, i) => (
                          <div key={i} className="room-detail-amenity-item">
                            <AmenityIcon />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="room-detail-footer">
                  <div>
                    <span className="room-detail-price-label">Tarif par nuitée</span>
                    <div className="room-card__price">
                      <span className="room-card__price-amount">
                        {new Intl.NumberFormat("fr-FR").format(
                          Number(selectedRoom.prix_nuit || 0)
                        )}{" "}
                        MAD
                      </span>
                      <span className="room-card__price-unit">/ nuit</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      );
    })()}
  </div>
);
}
