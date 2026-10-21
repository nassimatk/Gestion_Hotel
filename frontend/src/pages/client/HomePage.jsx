import "./HomePage.css";

/* ── Données statiques (remplacées par API plus tard) ── */
const ROOMS = [
  {
    id: 1,
    tag: "Vue Mer Panoramique",
    size: 85,
    name: "Suite Impériale Panorama",
    desc: "Un King-size haute literie, vaste terrasse privée orientée plein sud et salon feutré avec vue imprenable.",
    amenities: ["King Size", "Terrasse", "Haut Débit"],
    price: 540,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80",
  },
  {
    id: 2,
    tag: "Jardin Secret",
    size: 48,
    name: "Chambre Deluxe Riviera",
    desc: "Confort contemporain ouvert sur un jardin intime et verdoyant, salle d'eau en marbre italien et calme souverain.",
    amenities: ["Baignoire", "Expresso Bar", "Climatisation"],
    price: 320,
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
  },
  {
    id: 3,
    tag: "Piscine Privée & Spa",
    size: 190,
    name: "Villa Sérénité & Spa",
    desc: "Piscine privée à débordement, salon spacieux et service majordome dédié 24h/24 pour une intimité sans compromis.",
    amenities: ["Majordome", "Hammam Privé", "Wifi VIP"],
    price: 850,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
  },
];

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

/* ── Icône d'aménitié ── */
function AmenityIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ── Carte chambre ── */
function RoomCard({ room }) {
  return (
    <div className="room-card">
      <div className="room-card__image">
        <img src={room.image} alt={room.name} loading="lazy" />
        <span className="room-card__tag">{room.tag}</span>
        <span className="room-card__size">{room.size} m²</span>
      </div>
      <div className="room-card__body">
        <h3 className="room-card__name">{room.name}</h3>
        <p className="room-card__desc">{room.desc}</p>
        <ul className="room-card__amenities">
          {room.amenities.map((a) => (
            <li key={a} className="room-card__amenity">
              <AmenityIcon />
              {a}
            </li>
          ))}
        </ul>
        <div className="room-card__footer">
          <div className="room-card__price">
            <span className="room-card__price-amount">{room.price} €</span>
            <span className="room-card__price-unit">/ nuit</span>
          </div>
          <button className="room-card__btn">Voir les détails</button>
        </div>
      </div>
    </div>
  );
}

/* ── Page principale ── */
export default function HomePage() {
  return (
    <>
      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__overlay" />
        <div className="hero__content">
          <div className="hero__badge">
            Hôtellerie d'exception &amp; séjours sur-mesure
          </div>
          <h1 className="hero__title">
            Votre prochaine expérience<br />commence ici
          </h1>
          <p className="hero__subtitle">
            Découvrez des hébergements d'exception soigneusement sélectionnés
            pour vos séjours d'affaires et de loisirs.
          </p>
          <div className="hero__cta">
            <a href="/chambres" className="btn-outline">
              Découvrir nos chambres →
            </a>
            <button className="btn-gold">Créer un compte</button>
          </div>
        </div>
      </section>

      {/* ══ BARRE DE RECHERCHE ════════════════════════════════ */}
      <div className="search-bar-wrapper">
        <div className="search-bar">
          {/* Destination */}
          <div className="search-bar__field">
            <span className="search-bar__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <div className="search-bar__info">
              <span className="search-bar__label">Destination ou Hôtel</span>
              <span className="search-bar__value">Paris, France</span>
            </div>
          </div>

          {/* Arrivée */}
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
              <span className="search-bar__label">Date d'arrivée</span>
              <span className="search-bar__value">18 Juin 2025</span>
            </div>
          </div>

          {/* Départ */}
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
              <span className="search-bar__label">Date de Départ</span>
              <span className="search-bar__value">23 Juin 2025</span>
            </div>
          </div>

          {/* Voyageurs */}
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
              <span className="search-bar__label">Voyageurs</span>
              <span className="search-bar__value">2 Adultes, 1 Chambre</span>
            </div>
          </div>

          {/* Bouton */}
          <button className="search-bar__btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Rechercher
          </button>
        </div>
      </div>

      {/* ══ CHAMBRES ══════════════════════════════════════════ */}
      <section className="rooms-section">
        <div className="rooms-section__header">
          <div className="rooms-section__header-left">
            <span className="badge">Sélection Exclusive</span>
            <h2 className="section-title">Nos Chambres &amp; Suites Signature</h2>
            <p className="section-subtitle" style={{ marginTop: 10 }}>
              Une architecture raffinée où chaque détail honore le calme, la sensualité
              des matières nobles et le confort absolu.
            </p>
          </div>
          <div className="rooms-filter">
            <button className="filter-btn active">Toutes</button>
          </div>
        </div>

        <div className="rooms-grid">
          {ROOMS.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════ */}
      <section className="features-section">
        <div className="features-section__header">
          <span className="badge">Excellence &amp; Sérénité</span>
          <h2 className="section-title">Pourquoi choisir HotelHub</h2>
          <p className="section-subtitle">
            Une exigence continue conçue pour transformer chaque instant de
            réservation en une promesse de sérénité absolue.
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

      {/* ══ CTA ═══════════════════════════════════════════════ */}
      <section className="cta-section">
        <div className="cta-section__left">
          <span className="cta-section__badge">Expérience Membre Exclusif</span>
          <h2 className="cta-section__title">
            Prêt à planifier votre prochain<br />séjour d'exception ?
          </h2>
          <p className="cta-section__subtitle">
            Rejoignez le cercle privilégié HotelHub et bénéficiez de surclassements
            prioritaires, de cocktails de bienvenue et d'attentions exclusives.
          </p>
        </div>
        <button className="cta-section__btn">
          Rejoindre HotelHub →
        </button>
      </section>
    </>
  );
}
