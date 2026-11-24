import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { getChambres } from "../../services/chambresApi";
import "./ChambresPage.css";
const TARIFS_API =
  import.meta.env.VITE_TARIFS_API_URL || "http://localhost:8004/api";
const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
  "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80",
];
function formatDateISO(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
function getDateAujourdhui() {
  return formatDateISO(new Date());
}
function getDateDemain() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return formatDateISO(date);
}
function jourSuivant(dateStr) {
  const [annee, mois, jour] = dateStr.split("-").map(Number);
  const date = new Date(annee, mois - 1, jour);
  date.setDate(date.getDate() + 1);
  return formatDateISO(date);
}
function calculerNombreNuits(debut, fin) {
  if (!debut || !fin) return 0;
  const [a1, m1, j1] = debut.split("-").map(Number);
  const [a2, m2, j2] = fin.split("-").map(Number);
  return Math.max(
    0,
    Math.round(
      (Date.UTC(a2, m2 - 1, j2) - Date.UTC(a1, m1 - 1, j1)) /
        86400000
    )
  );
}
function unwrapResponse(response) {
  let result = response;
  for (let i = 0; i < 5; i++) {
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
function extraireListe(response, noms = []) {
  const data = unwrapResponse(response);
  if (Array.isArray(data)) return data;
  for (const nom of noms) {
    if (Array.isArray(data?.[nom])) return data[nom];
  }
  return [];
}
function estActif(element) {
  if (!element || element.deleted_at) return false;
  const statut = String(element.statut ?? "active")
    .trim()
    .toLowerCase();
  return ["actif", "active", "disponible", "1"].includes(statut);
}
function dateDansPeriode(date, debut, fin) {
  const jour = String(date || "").slice(0, 10);
  const dateDebut = debut ? String(debut).slice(0, 10) : null;
  const dateFin = fin ? String(fin).slice(0, 10) : null;
  if (!jour) return false;
  if (dateDebut && jour < dateDebut) return false;
  if (dateFin && jour > dateFin) return false;
  return true;
}
function formaterPrix(prix) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(prix || 0));
}
function formaterValeur(valeur) {
  const nombre = Number(valeur || 0);
  return Number.isInteger(nombre) ? String(nombre) : formaterPrix(nombre);
}
function trouverTarifsChambre(room, tarifs, date) {
  return tarifs
    .filter((tarif) => {
      if (Number(tarif.chambre_id) !== Number(room.id)) return false;
      if (!estActif(tarif)) return false;
      if (
        tarif.date_application &&
        String(tarif.date_application).slice(0, 10) > date
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) =>
      String(b.date_application || "").localeCompare(
        String(a.date_application || "")
      )
    );
}
function trouverSaisonApplicable(tarif, saisons, date) {
  if (!tarif?.saison_id) return null;
  return (
    saisons.find(
      (saison) =>
        Number(saison.id) === Number(tarif.saison_id) &&
        estActif(saison) &&
        dateDansPeriode(date, saison.date_debut, saison.date_fin)
    ) || null
  );
}
function trouverTarifEtSaison(room, tarifs, saisons, date) {
  const tarifsChambre = trouverTarifsChambre(room, tarifs, date);
  for (const tarif of tarifsChambre) {
    if (tarif.saison_id) {
      const saison = trouverSaisonApplicable(tarif, saisons, date);
      if (saison) return { tarif, saison };
      continue;
    }
    return { tarif, saison: null };
  }
  return { tarif: null, saison: null };
}
function calculerPrixSaisonnier(room, tarif, saison) {
  const prixBaseTarif = Number(tarif?.prix_base);
  const prixBaseChambre = Number(room?.prix_nuit);
  const prixBase =
    Number.isFinite(prixBaseTarif) && prixBaseTarif > 0
      ? prixBaseTarif
      : Number.isFinite(prixBaseChambre) && prixBaseChambre > 0
        ? prixBaseChambre
        : 0;
  if (prixBase <= 0) {
    return { prixBase: 0, prixSaisonnier: 0 };
  }
  const coefficientSaison = Number(
    saison?.coefficient ?? saison?.coefficient_saison
  );
  const coefficientTarif = Number(tarif?.coefficient_saison);
  const coefficient =
    Number.isFinite(coefficientSaison) && coefficientSaison > 0
      ? coefficientSaison
      : Number.isFinite(coefficientTarif) && coefficientTarif > 0
        ? coefficientTarif
        : 1;
  const prixCalcule = prixBase * coefficient;
  const prixEnregistre = Number(tarif?.prix_nuit);
  const prixSaisonnier =
    Number.isFinite(prixEnregistre) && prixEnregistre > 0
      ? prixEnregistre
      : prixCalcule;
  return {
    prixBase: Number(prixBase.toFixed(2)),
    prixSaisonnier: Number(prixSaisonnier.toFixed(2)),
  };
}
function promotionCorrespondChambre(promotion, room) {
  if (
    promotion.chambre_id === null ||
    promotion.chambre_id === undefined ||
    promotion.chambre_id === ""
  ) {
    return true;
  }
  return Number(promotion.chambre_id) === Number(room.id);
}
function getTypePromotion(promotion) {
  return String(promotion?.type_reduction || promotion?.type || "")
    .trim()
    .toUpperCase();
}
function getValeurPromotion(promotion) {
  return Number(
    promotion?.valeur ??
      promotion?.valeur_reduction ??
      promotion?.pourcentage ??
      0
  );
}
function getNuitsMinPromotion(promotion) {
  return Number(promotion?.nuits_min || promotion?.nombre_nuits_min || 1);
}
function estPromotionPourcentage(promotion) {
  const type = getTypePromotion(promotion);
  return type === "POURCENTAGE" || type === "POURCENT";
}
function getLibelleReduction(promotion) {
  const valeur = formaterValeur(getValeurPromotion(promotion));
  return estPromotionPourcentage(promotion)
    ? `-${valeur} %`
    : `-${valeur} MAD`;
}
function promotionPeutEtreAffichee(promotion, room, dateActuelle) {
  if (!estActif(promotion)) return false;
  if (!promotionCorrespondChambre(promotion, room)) return false;
  const debut = promotion.date_debut
    ? String(promotion.date_debut).slice(0, 10)
    : null;
  const fin = promotion.date_fin
    ? String(promotion.date_fin).slice(0, 10)
    : null;
  if (debut && dateActuelle < debut) return false;
  if (fin && dateActuelle > fin) return false;
  return true;
}
function promotionValidePourSejour(
  promotion,
  room,
  dateDebut,
  dateFin,
  nombreNuits
) {
  if (!estActif(promotion)) return false;
  if (!promotionCorrespondChambre(promotion, room)) return false;
  if (!dateDebut || !dateFin || nombreNuits <= 0) return false;
  if (nombreNuits < getNuitsMinPromotion(promotion)) return false;
  const debutPromotion = promotion.date_debut
    ? String(promotion.date_debut).slice(0, 10)
    : null;
  const finPromotion = promotion.date_fin
    ? String(promotion.date_fin).slice(0, 10)
    : null;
  const lendemainFinPromotion = finPromotion
    ? jourSuivant(finPromotion)
    : null;
  return (
    (!debutPromotion || dateDebut >= debutPromotion) &&
    (!lendemainFinPromotion || dateFin <= lendemainFinPromotion)
  );
}
function calculerReductionPromotion(promotion, prixSaisonnier) {
  const type = getTypePromotion(promotion);
  const valeur = getValeurPromotion(promotion);
  let montantReduction = 0;

  if (Number.isFinite(valeur) && valeur > 0) {
    if (estPromotionPourcentage(promotion)) {
      montantReduction = prixSaisonnier * Math.min(100, valeur) / 100;
    } else if (type === "MONTANT_FIXE" || type === "MONTANT") {
      montantReduction = Math.min(prixSaisonnier, valeur);
    }
  }
  return { montantReduction, prixFinal: Math.max(0, prixSaisonnier - montantReduction) };
}

function trouverPromotionAAfficher(promotions, room, dateActuelle) {
  const valides = promotions.filter((promotion) =>
    promotionPeutEtreAffichee(promotion, room, dateActuelle)
  );
  if (valides.length === 0) return null;
  valides.sort((a, b) =>
    String(b.date_debut || "").localeCompare(String(a.date_debut || ""))
  );
  return valides[0];
}
function trouverPromotionApplicable(
  promotions,
  room,
  dateDebut,
  dateFin,
  nombreNuits,
  prixSaisonnier
) {
  const valides = promotions.filter((promotion) =>
    promotionValidePourSejour(
      promotion,
      room,
      dateDebut,
      dateFin,
      nombreNuits
    )
  );
  if (valides.length === 0) return null;
  const calculees = valides.map((promotion) => ({
    promotion,
    reduction: calculerReductionPromotion(promotion, prixSaisonnier),
  }));
  calculees.sort(
    (a, b) =>
      b.reduction.montantReduction - a.reduction.montantReduction
  );
  return calculees[0];
}
function getCompteARebours(promotion, maintenant = new Date()) {
  if (!promotion) return null;
  const debutTexte = promotion.date_debut
    ? String(promotion.date_debut).slice(0, 10)
    : null;
  const finTexte = promotion.date_fin
    ? String(promotion.date_fin).slice(0, 10)
    : null;
  if (debutTexte) {
    const [annee, mois, jour] = debutTexte.split("-").map(Number);
    const dateDebut = new Date(annee, mois - 1, jour, 0, 0, 0);
    if (maintenant < dateDebut) {
      const difference = dateDebut.getTime() - maintenant.getTime();
      const jours = Math.ceil(difference / 86400000);
      return {
        etat: "avenir",
        jours,
        libelleCourt:
          jours === 1 ? "Débute demain" : `Débute dans ${jours} jours`,
      };
    }
  }
  if (!finTexte) {
    return {
      etat: "permanente",
      jours: null,
      libelleCourt: "Offre en cours",
    };
  }
  const [annee, mois, jour] = finTexte.split("-").map(Number);
  const dateFin = new Date(annee, mois - 1, jour, 23, 59, 59, 999);
  const difference = dateFin.getTime() - maintenant.getTime();
  if (!Number.isFinite(difference) || difference <= 0) return null;
  const jours = Math.floor(difference / 86400000);
  const heures = Math.floor((difference % 86400000) / 3600000);
  const minutes = Math.floor((difference % 3600000) / 60000);
  return {
    etat: jours === 0 ? "derniere" : "active",
    jours,
    heures,
    minutes,
    libelleCourt:
      jours > 0
        ? `${jours} j ${heures} h restantes`
        : `${heures} h ${minutes} min restantes`,
  };
}
function calculerPrixChambre(
  room, tarifs, saisons, promotions,
  dateDebut = getDateAujourdhui(),
  dateFin = getDateDemain(),
  dateActuelle = getDateAujourdhui()
) {
  const nombreNuits = calculerNombreNuits(dateDebut, dateFin);
  const promotionInfo = trouverPromotionAAfficher(promotions, room, dateActuelle);
  const resultatVide = { disponible: false, promotionInfo };
  if (nombreNuits <= 0) return resultatVide;

  const { tarif, saison } = trouverTarifEtSaison(room, tarifs, saisons, dateDebut);
  const { prixBase, prixSaisonnier } = calculerPrixSaisonnier(room, tarif, saison);
  if (prixBase <= 0 || prixSaisonnier <= 0) return resultatVide;

  const offre = trouverPromotionApplicable(
    promotions, room, dateDebut, dateFin, nombreNuits, prixSaisonnier
  );
  const reduction = offre?.reduction;
  const apercu = promotionInfo
    ? calculerReductionPromotion(promotionInfo, prixSaisonnier)
    : null;

  return {
    disponible: true,
    prixBase,
    prixSaisonnier,
    prixFinal: Number((reduction?.prixFinal ?? prixSaisonnier).toFixed(2)),
    aPromotion: (reduction?.montantReduction ?? 0) > 0,
    prixApercuPromotion: apercu ? Number(apercu.prixFinal.toFixed(2)) : null,
    devise: tarif?.devise || "MAD",
    saison,
    promotionInfo: offre?.promotion || promotionInfo,
  };
}

function getImagesChambre(room, index = 0) {
  let images = room?.images;
  if (typeof images === "string") {
    try { images = JSON.parse(images); } catch { images = [images]; }
  }
  if (!Array.isArray(images)) images = images ? [images] : [];
  const base = import.meta.env.VITE_CHAMBRES_STORAGE_URL || "http://localhost:8001/storage";
  const valides = images.map((img) => {
    const url = typeof img === "string" ? img : img?.url || img?.path || img?.chemin || img?.image || img?.src;
    if (!url || typeof url !== "string") return null;
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    return `${base.replace(/\/+$/, "")}/${url.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^(public\/)?storage\//, "")}`;
  }).filter(Boolean);
  return valides.length ? valides : [DEFAULT_IMAGES[index % DEFAULT_IMAGES.length]];
}

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
function ClockIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}
function PriceDetails({
  prixInfo,
  maintenant,
}) {
  const promotion = prixInfo?.promotionInfo;
  const compteARebours = getCompteARebours(promotion, maintenant);
  if (!prixInfo?.disponible) {
    return (
      <div className="room-card__price">
        <span className="room-card__price-unit">
          Tarif indisponible
        </span>
        {promotion && compteARebours && (
          <p className="room-card__promotion-status is-preview">
            Promotion disponible : {getLibelleReduction(promotion)}
          </p>
        )}
      </div>
    );
  }
  const promotionAppliquee = prixInfo.aPromotion;
  const promotionEnApercu =
    !promotionAppliquee &&
    prixInfo.prixApercuPromotion !== null &&
    Boolean(promotion);
  const prixAffiche = promotionAppliquee
    ? prixInfo.prixFinal
    : promotionEnApercu
      ? prixInfo.prixApercuPromotion
      : prixInfo.prixSaisonnier;
  const prixAvantReduction = prixInfo.prixSaisonnier;
  return (
    <div className="room-price-details">
      {promotion && compteARebours && (
        <div className="room-card__promotion-badges">
          <span className="room-card__discount-badge">
            {getLibelleReduction(promotion)}
          </span>
        </div>
      )}
      {prixInfo.saison && (
        <p className="room-card__season">
          Saison : <strong>{prixInfo.saison.nom}</strong>
        </p>
      )}
      <div className="room-card__price">
        {(promotionAppliquee || promotionEnApercu) && (
          <span className="room-card__old-price">
            {formaterPrix(prixAvantReduction)} {prixInfo.devise}
          </span>
        )}
        <span className="room-card__price-amount">
          {formaterPrix(prixAffiche)} {prixInfo.devise}
        </span>
        <span className="room-card__price-unit">/ nuit</span>
      </div>
    </div>
  );
}
function ClientRoomCard({
  room,
  index,
  onSelect,
  tarifs,
  saisons,
  promotions,
  dateActuelle,
  maintenant,
  dateDebut,
  dateFin,
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const cardImages = useMemo(
    () => getImagesChambre(room, index),
    [room, index]
  );
  const totalPhotos = cardImages.length;
  const currentImageSrc = cardImages[photoIndex] || cardImages[0];
  const prixInfo = useMemo(
    () =>
      calculerPrixChambre(
        room,
        tarifs,
        saisons,
        promotions,
        dateDebut,
        dateFin,
        dateActuelle
      ),
    [
      room,
      tarifs,
      saisons,
      promotions,
      dateDebut,
      dateFin,
      dateActuelle,
    ]
  );
  const promotionCarte = useMemo(
    () => trouverPromotionAAfficher(promotions, room, dateActuelle),
    [promotions, room, dateActuelle]
  );
  const comptePromotion = getCompteARebours(
    promotionCarte,
    maintenant
  );
  const numero = room.numero ?? room.numero_chambre ?? room.id;
  const displayName = room.nom
    ? room.nom.includes(String(numero))
      ? room.nom
      : `${room.nom} (N° ${numero})`
    : `Chambre ${String(room.type || "STANDARD").toUpperCase()} N° ${numero}`;
  const displayDesc =
    room.description ||
    "Hébergement d'exception soigneusement aménagé pour votre séjour.";
  const displayTag =
    room.vue ||
    (room.type === "suite"
      ? "Vue Mer Panoramique"
      : room.type === "presidentielle"
        ? "Piscine Privée & Spa"
        : "Jardin Secret");
  const displaySize =
    room.superficie ||
    (room.type === "presidentielle" ? 250 : room.type === "suite" ? 85 : 30);
  let amenities = room.equipements || [];
  if (typeof amenities === "string") {
    try {
      amenities = JSON.parse(amenities);
    } catch {
      amenities = amenities.split(",").map((a) => a.trim());
    }
  }
  if (!Array.isArray(amenities) || amenities.length === 0) {
    amenities = ["Wi-Fi", "Climatisation", 'TV 43"'];
  }
  const handlePrev = (e) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
  };
  const handleNext = (e) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % totalPhotos);
  };
  return (
    <div className="room-card">
      <div className="room-card__image">
        <img
          key={photoIndex}
          src={currentImageSrc}
          alt={displayName}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_IMAGES[index % DEFAULT_IMAGES.length];
          }}
        />
        
        {promotionCarte && comptePromotion && (
          <div className="room-card__promo-overlay">
            <span className="room-card__promo-label">
              <span>✦</span> PROMOTION
            </span>
            <span className="room-card__promo-discount">
              {getLibelleReduction(promotionCarte)}
            </span>
            <span
              className={`room-card__promo-countdown ${
                comptePromotion.etat === "derniere"
                  ? "is-last-day"
                  : ""
              }`}
            >
              <ClockIcon />
              {comptePromotion.libelleCourt}
            </span>
          </div>
        )}
        {totalPhotos > 1 && (
          <>
            <button
              type="button"
              className="card-nav-arrow card-nav-prev"
              onClick={handlePrev}
              aria-label="Photo précédente"
            >
              ‹
            </button>
            <button
              type="button"
              className="card-nav-arrow card-nav-next"
              onClick={handleNext}
              aria-label="Photo suivante"
            >
              ›
            </button>
            <div className="card-nav-dots">
              {cardImages.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  className={`card-nav-dot ${
                    dotIdx === photoIndex ? "active" : ""
                  }`}
                  onClick={() => setPhotoIndex(dotIdx)}
                  aria-label={`Photo ${dotIdx + 1}`}
                />
              ))}
            </div>
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
          {amenities.slice(0, 3).map((item, i) => (
            <li key={i} className="room-card__amenity">
              <AmenityIcon />
              <span>
                {typeof item === "object" ? item.nom || item.name : item}
              </span>
            </li>
          ))}
        </ul>
        <PriceDetails
          prixInfo={prixInfo}
          maintenant={maintenant}
        />
        <div className="room-card__footer">
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
export default function ChambresPage() {
  const [rooms, setRooms] = useState([]);
  const [tarifs, setTarifs] = useState([]);
  const [saisons, setSaisons] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tarifsLoading, setTarifsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tarifsError, setTarifsError] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [dateActuelle, setDateActuelle] = useState(getDateAujourdhui);
  const [maintenant, setMaintenant] = useState(() => new Date());
  const [dateDebut] = useState(getDateAujourdhui);
  const [dateFin] = useState(getDateDemain);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      const maintenantActuel = new Date();
      setMaintenant(maintenantActuel);
      const nouvelleDate = formatDateISO(maintenantActuel);
      setDateActuelle((ancienneDate) =>
        ancienneDate !== nouvelleDate ? nouvelleDate : ancienneDate
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getChambres({ statut: "disponible" });
      const liste = extraireListe(response, ["chambres"]);
      const chambresDisponibles = liste.filter((room) => {
        if (!room || room.deleted_at) return false;
        const statut = String(room.statut ?? "")
          .trim()
          .toLowerCase();
        if (!statut) return true;
        return [
          "disponible",
          "available",
          "active",
          "actif",
          "1",
        ].includes(statut);
      });
      setRooms(chambresDisponibles);
    } catch (err) {
      console.error("Erreur de chargement des chambres :", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Impossible de charger les chambres disponibles. Vérifiez le service Chambres."
      );
    } finally {
      setLoading(false);
    }
  }, []);
  const fetchTarifs = useCallback(async () => {
    try {
      setTarifsLoading(true);
      setTarifsError("");
      const [
        tarifsResponse,
        saisonsResponse,
        promotionsResponse,
      ] = await Promise.all([
        axios.get(`${TARIFS_API}/tarifs`),
        axios.get(`${TARIFS_API}/saisons`),
        axios.get(`${TARIFS_API}/promotions`),
      ]);
      const tarifsRecus = extraireListe(tarifsResponse, ["tarifs"]);
      const saisonsRecues = extraireListe(saisonsResponse, ["saisons"]);
      const promotionsRecues = extraireListe(
        promotionsResponse,
        ["promotions"]
      );
      setTarifs(tarifsRecus.filter(estActif));
      setSaisons(saisonsRecues.filter(estActif));
      setPromotions(promotionsRecues.filter(estActif));
    } catch (err) {
      console.error(
        "Erreur récupération Tarifs :",
        err.response?.data || err.message
      );
      setTarifs([]);
      setSaisons([]);
      setPromotions([]);
      setTarifsError(
        "Impossible de récupérer les tarifs et promotions. Vérifiez le service Tarifs."
      );
    } finally {
      setTarifsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchRooms();
    fetchTarifs();
  }, [fetchRooms, fetchTarifs]);
  const filteredRooms = rooms.filter((room) => {
    const type = String(room.type || "").toLowerCase();
    if (selectedFilter === "all") return true;
    if (selectedFilter === "suite") {
      return type === "suite" || type === "presidentielle";
    }
    if (selectedFilter === "double") return type === "double";
    if (selectedFilter === "simple") return type === "simple";
    return true;
  });
  const modalImages = selectedRoom
    ? getImagesChambre(selectedRoom)
    : [];
  const currentModalImage =
    modalImages[activePhotoIdx] || modalImages[0];
  const selectedRoomPrix = selectedRoom
    ? calculerPrixChambre(
        selectedRoom,
        tarifs,
        saisons,
        promotions,
        dateDebut,
        dateFin,
        dateActuelle
      )
    : null;
  function fermerModal() {
    setSelectedRoom(null);
    setActivePhotoIdx(0);
  }
  function photoPrecedente() {
    setActivePhotoIdx(
      (prev) => (prev - 1 + modalImages.length) % modalImages.length
    );
  }
  function photoSuivante() {
    setActivePhotoIdx((prev) => (prev + 1) % modalImages.length);
  }
  return (
    <div className="chambres-client-page">
      <div className="chambres-client-container">
        <header className="chambres-client-header">
          <div className="chambres-client-header-top">
            <span className="chambres-badge">
              Hôtellerie d'exception
            </span>
            <h1 className="chambres-client-title">
              Nos Chambres & Suites
            </h1>
            <p className="chambres-client-subtitle">
              Explorez l'ensemble de nos hébergements haut de gamme,
              alliant matériaux nobles, sérénité et confort absolu
              pour une expérience inoubliable.
            </p>
          </div>
          <div className="chambres-filter-bar">
            <button
              type="button"
              className={`filter-btn ${
                selectedFilter === "all" ? "active" : ""
              }`}
              onClick={() => setSelectedFilter("all")}
            >
              Toutes ({rooms.length})
            </button>
            <button
              type="button"
              className={`filter-btn ${
                selectedFilter === "simple" ? "active" : ""
              }`}
              onClick={() => setSelectedFilter("simple")}
            >
              Chambres Simples
            </button>
            <button
              type="button"
              className={`filter-btn ${
                selectedFilter === "double" ? "active" : ""
              }`}
              onClick={() => setSelectedFilter("double")}
            >
              Chambres Doubles
            </button>
            <button
              type="button"
              className={`filter-btn ${
                selectedFilter === "suite" ? "active" : ""
              }`}
              onClick={() => setSelectedFilter("suite")}
            >
              Suites & Prestige
            </button>
          </div>
        </header>
        {loading && (
          <div className="chambres-loading-state">
            <div className="chambres-spinner" />
            <p>Chargement des chambres en cours...</p>
          </div>
        )}
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
        {!loading && tarifsLoading && (
          <p className="tarifs-loading">
            Chargement des tarifs et promotions...
          </p>
        )}
        {!loading && tarifsError && (
          <div className="tarifs-unavailable">
            <p>{tarifsError}</p>
            <button type="button" onClick={fetchTarifs}>
              Réessayer
            </button>
          </div>
        )}
        {!loading &&
          !tarifsLoading &&
          tarifs.length === 0 && (
            <p className="tarifs-unavailable">
              Aucun tarif spécifique reçu. Les prix de base des chambres
              seront utilisés lorsqu'ils sont disponibles.
            </p>
          )}
        {!loading && !error && filteredRooms.length === 0 && (
          <div className="chambres-empty-box">
            <h3>
              Aucune chambre disponible dans cette sélection
            </h3>
            <p>
              Veuillez sélectionner un autre filtre ou nous contacter
              pour une réservation sur-mesure.
            </p>
          </div>
        )}
        {!loading && !error && filteredRooms.length > 0 && (
          <div className="rooms-grid">
            {filteredRooms.map((room, idx) => (
              <ClientRoomCard
                key={room.id}
                room={room}
                index={idx}
                tarifs={tarifs}
                saisons={saisons}
                promotions={promotions}
                dateActuelle={dateActuelle}
                maintenant={maintenant}
                dateDebut={dateDebut}
                dateFin={dateFin}
                onSelect={(selected) => {
                  setSelectedRoom(selected);
                  setActivePhotoIdx(0);
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {selectedRoom && (
        <div
          className="room-detail-modal-overlay"
          onClick={fermerModal}
        >
          <div
            className="room-detail-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="room-detail-close-btn"
              onClick={fermerModal}
              aria-label="Fermer"
            >
              ✕
            </button>
            <div className="room-detail-modal-content">
              <div className="room-detail-carousel">
                <div className="room-detail-image-wrapper">
                  <img
                    src={currentModalImage}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_IMAGES[0];
                    }}
                    alt={selectedRoom.nom || selectedRoom.numero}
                  />
                  <span className="room-card__tag">
                    {selectedRoom.vue || "Vue d'exception"}
                  </span>
                  <span className="room-card__size">
                    {selectedRoom.superficie || 45} m²
                  </span>
                  {modalImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="carousel-arrow carousel-arrow-left"
                        onClick={photoPrecedente}
                        aria-label="Photo précédente"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="carousel-arrow carousel-arrow-right"
                        onClick={photoSuivante}
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
                {modalImages.length > 1 && (
                  <div className="room-detail-thumbnails-strip">
                    {modalImages.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`room-detail-thumb-btn ${
                          i === activePhotoIdx ? "active" : ""
                        }`}
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
                    ? selectedRoom.nom.includes(
                        String(
                          selectedRoom.numero ??
                            selectedRoom.numero_chambre ??
                            selectedRoom.id
                        )
                      )
                      ? selectedRoom.nom
                      : `${selectedRoom.nom} (N° ${
                          selectedRoom.numero ??
                          selectedRoom.numero_chambre ??
                          selectedRoom.id
                        })`
                    : `Chambre ${selectedRoom.type?.toUpperCase()} N° ${
                        selectedRoom.numero ??
                        selectedRoom.numero_chambre ??
                        selectedRoom.id
                      }`}
                </h2>
                <div className="room-detail-meta-row">
                  <span>
                    👥 Capacité :{" "}
                    <strong>
                      {selectedRoom.capacite || 2} personnes
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Étage :{" "}
                    <strong>
                      {selectedRoom.etage
                        ? `Étage ${selectedRoom.etage}`
                        : "RDC"}
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
                          <div
                            key={i}
                            className="room-detail-amenity-item"
                          >
                            <AmenityIcon />
                            <span>
                              {typeof item === "object"
                                ? item.nom || item.name
                                : item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                <div className="room-detail-pricing-section">
                  <h4>Tarification de la chambre</h4>
                  {selectedRoomPrix?.disponible ? (
                    <>
                      <div className="room-detail-price-lines">
                       
                       
                        {selectedRoomPrix.saison && (
                          <p>
                            Saison appliquée :{" "}
                            <strong>
                              {selectedRoomPrix.saison.nom}
                            </strong>
                          </p>
                        )}
                      </div>
                      <PriceDetails
                        prixInfo={selectedRoomPrix}
                        maintenant={maintenant}
                      />
                    </>
                  ) : (
                    <>
                      <p className="room-card__unavailable">
                        Le tarif de cette chambre n'est pas disponible.
                      </p>
                      {selectedRoomPrix?.promotionInfo && (
                        <PriceDetails
                          prixInfo={selectedRoomPrix}
                          maintenant={maintenant}
                        />
                      )}
                    </>
                  )}
                  <p className="room-detail-price-period">
                    Calcul basé sur un séjour du {dateDebut} au {dateFin}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
