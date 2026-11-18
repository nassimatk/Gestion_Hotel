import React, { useState, useEffect } from "react";
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

/* ── Carte individuelle de chambre ── */
function ClientRoomCard({ room, index, onSelect }) {
  const hasCustomImage =
    Array.isArray(room.images) &&
    room.images[0] &&
    (room.images[0].startsWith("http") ||
      room.images[0].startsWith("data:") ||
      room.images[0].startsWith("blob:"));

  const imageSrc = hasCustomImage
    ? room.images[0]
    : DEFAULT_IMAGES[index % DEFAULT_IMAGES.length];

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
          src={imageSrc}
          alt={displayName}
          loading="lazy"
          onError={(e) => {
            e.target.src = DEFAULT_IMAGES[index % DEFAULT_IMAGES.length];
          }}
        />
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

  // Remonter en haut de page lors de l'accès
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
                onSelect={(r) => setSelectedRoom(r)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de détail d'une chambre */}
      {selectedRoom && (
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
              <div className="room-detail-image-wrapper">
                <img
                  src={
                    Array.isArray(selectedRoom.images) &&
                    selectedRoom.images[0] &&
                    (selectedRoom.images[0].startsWith("http") ||
                      selectedRoom.images[0].startsWith("data:") ||
                      selectedRoom.images[0].startsWith("blob:"))
                      ? selectedRoom.images[0]
                      : DEFAULT_IMAGES[0]
                  }
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

                  <button
                    type="button"
                    className="room-detail-book-btn"
                    onClick={() => {
                      alert(
                        `Réservation initiée pour la ${
                          selectedRoom.nom || "Chambre N° " + selectedRoom.numero
                        }. Un conseiller HotelHub vous contactera.`
                      );
                      setSelectedRoom(null);
                    }}
                  >
                    Réserver ce séjour
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
