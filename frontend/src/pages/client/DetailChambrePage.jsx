import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { getChambres } from "../../services/chambresApi";
import { useAuth } from "../../context/AuthContext";
import ClientAvisPage from "./ClientAvisPage";
import "./DetailChambrePage.css";

// ==================================================
// CONFIGURATION
// ==================================================

const STORAGE_URL =
  import.meta.env.VITE_CHAMBRES_STORAGE_URL ||
  "http://localhost:8001/storage";

// Même API que HomePage
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

// ==================================================
// DATES (identiques à HomePage)
// ==================================================

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
  if (!dateStr) return "";
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
      (Date.UTC(a2, m2 - 1, j2) - Date.UTC(a1, m1 - 1, j1)) / 86400000
    )
  );
}

function obtenirDatesDuSejour(arrivee, depart) {
  const dates = [];
  if (!arrivee || !depart) return dates;

  const [a1, m1, j1] = arrivee.split("-").map(Number);
  const [a2, m2, j2] = depart.split("-").map(Number);

  const date = new Date(a1, m1 - 1, j1);
  const dateFin = new Date(a2, m2 - 1, j2);

  while (date < dateFin) {
    dates.push(formatDateISO(date));
    date.setDate(date.getDate() + 1);
  }

  return dates;
}

// ==================================================
// EXTRACTION DES RÉPONSES API (identique à HomePage)
// ==================================================

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

// ==================================================
// CAPACITÉ (identique à HomePage)
// ==================================================

function getCapaciteChambre(room) {
  if (!room) return 0;

  const sources = [
    room,
    room.capacite,
    room.capacities,
    room.type_chambre,
    room.typeChambre,
    room.details,
    room.informations,
  ];

  const champs = [
    "capacite",
    "capacité",
    "capacite_max",
    "capacite_personnes",
    "nombre_personnes",
    "nb_personnes",
    "max_personnes",
    "nombre_personnes_max",
    "capacite_maximale",
    "capacity",
    "max_capacity",
    "max_guests",
    "nombre_adultes",
    "adultes_max",
  ];

  for (const source of sources) {
    if (!source || typeof source !== "object") continue;

    for (const champ of champs) {
      const valeur = source[champ];
      if (valeur === null || valeur === undefined || valeur === "") continue;

      const nombre = Number.parseInt(
        String(valeur).match(/\d+/)?.[0] || "",
        10
      );

      if (Number.isFinite(nombre) && nombre > 0) return nombre;
    }
  }

  return 0;
}

// ==================================================
// OUTILS COMMUNS (identiques à HomePage)
// ==================================================

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

function pluriel(nombre, singulier, plurielTexte) {
  return `${nombre} ${nombre > 1 ? plurielTexte : singulier}`;
}

// ==================================================
// TARIFS ET SAISONS (identiques à HomePage)
// ==================================================

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
    return { prixBase: 0, prixSaisonnier: 0, coefficient: 1 };
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
    coefficient,
  };
}

// ==================================================
// PROMOTIONS (identiques à HomePage)
// ==================================================

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

  if (!Number.isFinite(valeur) || valeur <= 0) {
    return {
      prixFinal: prixSaisonnier,
      montantReduction: 0,
      pourcentageReduction: 0,
      typeReduction: type,
    };
  }

  if (type === "POURCENTAGE" || type === "POURCENT") {
    const pourcentage = Math.min(100, Math.max(0, valeur));
    const montantReduction = prixSaisonnier * (pourcentage / 100);

    return {
      prixFinal: Math.max(0, prixSaisonnier - montantReduction),
      montantReduction,
      pourcentageReduction: pourcentage,
      typeReduction: "POURCENTAGE",
    };
  }

  if (type === "MONTANT_FIXE" || type === "MONTANT") {
    const montantReduction = Math.min(prixSaisonnier, Math.max(0, valeur));
    const prixFinal = Math.max(0, prixSaisonnier - montantReduction);

    return {
      prixFinal,
      montantReduction,
      pourcentageReduction:
        prixSaisonnier > 0 ? (montantReduction / prixSaisonnier) * 100 : 0,
      typeReduction: "MONTANT_FIXE",
    };
  }

  return {
    prixFinal: prixSaisonnier,
    montantReduction: 0,
    pourcentageReduction: 0,
    typeReduction: type,
  };
}

function trouverPromotionAAfficher(promotions, room, dateActuelle) {
  const valides = promotions.filter((promotion) =>
    promotionPeutEtreAffichee(promotion, room, dateActuelle)
  );

  if (valides.length === 0) return null;

  const enCours = valides.filter((promotion) => {
    const debut = promotion.date_debut
      ? String(promotion.date_debut).slice(0, 10)
      : null;
    return !debut || dateActuelle >= debut;
  });

  const candidates = enCours.length > 0 ? enCours : valides;

  candidates.sort((a, b) =>
    String(b.date_debut || "").localeCompare(String(a.date_debut || ""))
  );

  return candidates[0];
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
    promotionValidePourSejour(promotion, room, dateDebut, dateFin, nombreNuits)
  );

  if (valides.length === 0) return null;

  const calculees = valides.map((promotion) => ({
    promotion,
    reduction: calculerReductionPromotion(promotion, prixSaisonnier),
  }));

  calculees.sort(
    (a, b) => b.reduction.montantReduction - a.reduction.montantReduction
  );

  return calculees[0];
}

// ==================================================
// CALCUL COMPLET DU PRIX (identique à HomePage)
// ==================================================

function calculerPrixChambre(
  room,
  tarifs,
  saisons,
  promotions,
  dateDebut = getDateAujourdhui(),
  dateFin = getDateDemain(),
  dateActuelle = getDateAujourdhui()
) {
  const nombreNuits = calculerNombreNuits(dateDebut, dateFin);

  const resultatVide = {
    disponible: false,
    prixBase: 0,
    prixSaisonnier: 0,
    prixFinal: 0,
    montantReduction: 0,
    pourcentageReduction: 0,
    coefficient: 1,
    aPromotion: false,
    prixApercuPromotion: null,
    montantApercuPromotion: 0,
    pourcentageApercuPromotion: 0,
    typeReduction: null,
    devise: "MAD",
    tarif: null,
    saison: null,
    promotionInfo: null,
  };

  if (!room || nombreNuits <= 0) return resultatVide;

  const { tarif, saison } = trouverTarifEtSaison(
    room,
    tarifs,
    saisons,
    dateDebut
  );

  const prix = calculerPrixSaisonnier(room, tarif, saison);

  if (prix.prixBase <= 0 || prix.prixSaisonnier <= 0) {
    return {
      ...resultatVide,
      devise: tarif?.devise || "MAD",
      tarif,
      saison,
    };
  }

  const promotionAAfficher = trouverPromotionAAfficher(
    promotions,
    room,
    dateActuelle
  );

  const reductionApercu = promotionAAfficher
    ? calculerReductionPromotion(promotionAAfficher, prix.prixSaisonnier)
    : null;

  const promotionChoisie = trouverPromotionApplicable(
    promotions,
    room,
    dateDebut,
    dateFin,
    nombreNuits,
    prix.prixSaisonnier
  );

  const reductionAppliquee = promotionChoisie?.reduction || null;
  const prixFinal = reductionAppliquee
    ? reductionAppliquee.prixFinal
    : prix.prixSaisonnier;
  const montantReduction = reductionAppliquee
    ? reductionAppliquee.montantReduction
    : 0;
  const pourcentageReduction = reductionAppliquee
    ? reductionAppliquee.pourcentageReduction
    : 0;

  return {
    disponible: true,
    prixBase: Number(prix.prixBase.toFixed(2)),
    prixSaisonnier: Number(prix.prixSaisonnier.toFixed(2)),
    prixFinal: Number(Math.max(0, prixFinal).toFixed(2)),
    montantReduction: Number(montantReduction.toFixed(2)),
    pourcentageReduction: Number(pourcentageReduction.toFixed(2)),
    coefficient: prix.coefficient,
    aPromotion: montantReduction > 0,
    prixApercuPromotion: reductionApercu
      ? Number(reductionApercu.prixFinal.toFixed(2))
      : null,
    montantApercuPromotion: reductionApercu
      ? Number(reductionApercu.montantReduction.toFixed(2))
      : 0,
    pourcentageApercuPromotion: reductionApercu
      ? Number(reductionApercu.pourcentageReduction.toFixed(2))
      : 0,
    typeReduction: reductionAppliquee?.typeReduction || null,
    devise: tarif?.devise || "MAD",
    tarif,
    saison,
    promotionInfo: promotionChoisie?.promotion || promotionAAfficher,
  };
}

// ==================================================
// IMAGES
// ==================================================

const extraireCheminImage = (image) => {
  if (!image) return "";

  if (typeof image === "string") {
    const valeur = image.trim();
    if (!valeur) return "";

    if (valeur.startsWith("[") || valeur.startsWith("{")) {
      try {
        return extraireCheminImage(JSON.parse(valeur));
      } catch {
        return valeur;
      }
    }

    return valeur;
  }

  if (Array.isArray(image)) {
    return image
      .flatMap((item) => {
        const resultat = extraireCheminImage(item);
        return Array.isArray(resultat) ? resultat : [resultat];
      })
      .filter(Boolean);
  }

  if (typeof image === "object") {
    return extraireCheminImage(
      image.url ||
        image.image_url ||
        image.path ||
        image.chemin ||
        image.chemin_image ||
        image.filename ||
        image.file_name ||
        image.src ||
        image.image ||
        image.photo ||
        ""
    );
  }

  return "";
};

const getRoomImage = (image) => {
  const chemin = extraireCheminImage(image);

  if (Array.isArray(chemin)) {
    return chemin.map(getRoomImage).filter(Boolean);
  }

  if (!chemin || typeof chemin !== "string") return "";

  const valeur = chemin.trim();
  if (!valeur) return "";

  if (/^(https?:\/\/|data:|blob:)/i.test(valeur)) {
    return valeur;
  }

  const cheminNettoye = valeur
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^(public\/)?storage\//i, "")
    .replace(/^public\//i, "");

  return `${STORAGE_URL.replace(/\/+$/, "")}/${cheminNettoye}`;
};

const getRoomImages = (room) => {
  if (!room) return [DEFAULT_IMAGES[0]];

  let source =
    room.images ??
    room.photos ??
    room.galerie ??
    room.image ??
    room.image_url ??
    room.photo ??
    [];

  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      source = source.trim() ? [source] : [];
    }
  }

  if (!Array.isArray(source)) {
    source = source ? [source] : [];
  }

  const imagesReelles = source
    .flatMap((image) => {
      const resultat = getRoomImage(image);
      return Array.isArray(resultat) ? resultat : [resultat];
    })
    .filter((url) => typeof url === "string" && url.trim().length > 0);

  if (imagesReelles.length === 0) {
    return [DEFAULT_IMAGES[0]];
  }

  return imagesReelles;
};

function ImageChambre({
  src,
  alt,
  className = "",
  fallbackSrc = DEFAULT_IMAGES[0],
}) {
  const [imageActuelle, setImageActuelle] = useState(src);

  useEffect(() => {
    setImageActuelle(src);
  }, [src]);

  return (
    <img
      src={imageActuelle || fallbackSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (imageActuelle !== fallbackSrc) {
          setImageActuelle(fallbackSrc);
        }
      }}
    />
  );
}

// ==================================================
// CRITÈRES ET ÉQUIPEMENTS
// ==================================================

const normaliserCriteres = (criteres) => {
  if (!criteres) return null;

  const dateArrivee =
    criteres.date_debut || criteres.dateArrivee || criteres.arrivee || "";

  const dateDepart =
    criteres.date_fin || criteres.dateDepart || criteres.depart || "";

  const nombrePersonnes = Number(
    criteres.adultes ?? criteres.nombrePersonnes ?? criteres.voyageurs ?? 1
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

  const chambreTransmise = location.state?.chambre;

  // ÉTATS CHAMBRE

  const [chambre, setChambre] = useState(() => {
    if (chambreTransmise && String(chambreTransmise.id) === String(id)) {
      return chambreTransmise;
    }
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ÉTATS TARIFS (mêmes données que HomePage)

  const [tarifs, setTarifs] = useState([]);
  const [saisons, setSaisons] = useState([]);
  const [promotions, setPromotions] = useState([]);

  const [chargementTarifs, setChargementTarifs] = useState(true);
  const [erreurTarifs, setErreurTarifs] = useState("");

  // ÉTATS RÉSERVATION

  const [arrivee, setArrivee] = useState(criteresRecherche?.dateArrivee || "");
  const [depart, setDepart] = useState(criteresRecherche?.dateDepart || "");
  const [voyageurs, setVoyageurs] = useState(
    criteresRecherche?.nombrePersonnes || 1
  );
  const [erreurReservation, setErreurReservation] = useState("");

  // GALERIE

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
        setLoading(true);

        if (chambreTransmise && String(chambreTransmise.id) === String(id)) {
          if (actif) setChambre(chambreTransmise);
          return;
        }

        setChambre(null);

        const response = await getChambres();
        const chambres = extraireListe(response, ["chambres"]);

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
        if (actif) setLoading(false);
      }
    };

    chargerChambre();

    return () => {
      actif = false;
    };
  }, [id, location.key, chambreTransmise]);

  // ==================================================
  // CHARGEMENT TARIFS, SAISONS, PROMOTIONS
  // (mêmes endpoints et mêmes filtres que HomePage)
  // ==================================================

  useEffect(() => {
    let actif = true;

    const chargerTarifs = async () => {
      setChargementTarifs(true);
      setErreurTarifs("");

      try {
        const [tarifsRes, saisonsRes, promotionsRes] = await Promise.all([
          axios.get(`${TARIFS_API}/tarifs`),
          axios.get(`${TARIFS_API}/saisons`),
          axios.get(`${TARIFS_API}/promotions`),
        ]);

        if (!actif) return;

        setTarifs(extraireListe(tarifsRes, ["tarifs"]).filter(estActif));
        setSaisons(extraireListe(saisonsRes, ["saisons"]).filter(estActif));
        setPromotions(
          extraireListe(promotionsRes, ["promotions"]).filter(estActif)
        );
      } catch (err) {
        console.error(
          "Erreur chargement tarifs :",
          err.response?.data || err.message
        );

        if (actif) {
          setTarifs([]);
          setSaisons([]);
          setPromotions([]);
          setErreurTarifs(
            "Tarifs saisonniers et promotions indisponibles. Le prix de base de la chambre est affiché."
          );
        }
      } finally {
        if (actif) setChargementTarifs(false);
      }
    };

    chargerTarifs();

    return () => {
      actif = false;
    };
  }, []);

  // ==================================================
  // SYNCHRONISATION DES CRITÈRES
  // ==================================================

  useEffect(() => {
    setArrivee(criteresRecherche?.dateArrivee || "");
    setDepart(criteresRecherche?.dateDepart || "");
    setVoyageurs(criteresRecherche?.nombrePersonnes || 1);

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
  // IMAGES / ÉQUIPEMENTS / CAPACITÉ
  // ==================================================

  const images = useMemo(() => getRoomImages(chambre), [chambre]);

  const equipements = useMemo(
    () => extraireEquipements(chambre?.equipements),
    [chambre]
  );

  // Même fonction que HomePage ; si la capacité est inconnue,
  // on n'empêche pas la recherche faite sur la page d'accueil.
  const capacite = useMemo(() => {
    const valeur = getCapaciteChambre(chambre);
    if (valeur > 0) return valeur;
    return Math.max(1, criteresRecherche?.nombrePersonnes || 1);
  }, [chambre, criteresRecherche?.nombrePersonnes]);

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
      if (e.key === "ArrowRight") setIndexActif((i) => (i + 1) % total);
      if (e.key === "ArrowLeft") setIndexActif((i) => (i - 1 + total) % total);
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
  // CALCUL DU PRIX — EXACTEMENT COMME HOMEPAGE
  // ==================================================

  const nuits = calculerNombreNuits(arrivee, depart);
  const nombreVoyageurs = Number(voyageurs);
  const dateActuelle = getDateAujourdhui();

  // Sans dates, HomePage affiche le prix d'une nuit (aujourd'hui → demain)
  const dateDebutCalcul = arrivee || getDateAujourdhui();
  const dateFinCalcul = depart || getDateDemain();

  const prixInfo = useMemo(
    () =>
      calculerPrixChambre(
        chambre,
        tarifs,
        saisons,
        promotions,
        dateDebutCalcul,
        dateFinCalcul,
        dateActuelle
      ),
    [
      chambre,
      tarifs,
      saisons,
      promotions,
      dateDebutCalcul,
      dateFinCalcul,
      dateActuelle,
    ]
  );

  const prixNuitFinal = prixInfo.prixFinal;
  const prixNuitAvantPromo = prixInfo.prixSaisonnier;
  const devise = prixInfo.devise || "MAD";

  const sousTotal = Number((prixNuitFinal * nuits).toFixed(2));
  const totalAvantPromotion = Number((prixNuitAvantPromo * nuits).toFixed(2));
  const reductionTotale = Number((prixInfo.montantReduction * nuits).toFixed(2));

  const promotionAppliquee = prixInfo.aPromotion ? prixInfo.promotionInfo : null;

  const datesSejour = useMemo(
    () => obtenirDatesDuSejour(arrivee, depart),
    [arrivee, depart]
  );

  // ==================================================
  // CARACTÉRISTIQUES
  // ==================================================

  const caracteristiques = chambre
    ? [
        { icone: "▢", texte: `${chambre.superficie || 0} m²` },
        { icone: "☺", texte: `${capacite} voyageur(s)` },
        { icone: "↕", texte: `Étage ${chambre.etage ?? "Non précisé"}` },
        { icone: "◐", texte: chambre.vue || "Vue non précisée" },
        { icone: "▭", texte: chambre.type || "Type non précisé" },
      ]
    : [];

  // ==================================================
  // MODIFICATION DES DATES
  // ==================================================

  const changerArrivee = (nouvelleDate) => {
    setArrivee(nouvelleDate);
    setErreurReservation("");

    if (depart && depart <= nouvelleDate) {
      setDepart(jourSuivant(nouvelleDate));
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
      setErreurReservation("Veuillez sélectionner les dates de votre séjour.");
      return;
    }

    if (arrivee < getDateAujourdhui()) {
      setErreurReservation("La date d'arrivée ne peut pas être dans le passé.");
      return;
    }

    if (nuits <= 0) {
      setErreurReservation(
        "La date de départ doit être après la date d'arrivée."
      );
      return;
    }

    if (nombreVoyageurs < 1 || nombreVoyageurs > capacite) {
      setErreurReservation(
        `Cette chambre accepte maximum ${capacite} voyageurs.`
      );
      return;
    }

    if (chargementTarifs) {
      setErreurReservation("Chargement des tarifs en cours. Veuillez patienter.");
      return;
    }

    if (!prixInfo.disponible || prixNuitFinal <= 0) {
      setErreurReservation("Le prix de cette chambre est indisponible.");
      return;
    }

    const promotionsUtilisees = promotionAppliquee
      ? [
          {
            id: promotionAppliquee.id,
            libelle: promotionAppliquee.libelle,
            valeur: promotionAppliquee.valeur,
            type_reduction: promotionAppliquee.type_reduction,
          },
        ]
      : [];

    navigate("/reservation", {
      state: {
        // Chambre
        chambreId: chambre.id,
        chambre,

        // Séjour
        dateDebut: arrivee,
        dateFin: depart,
        dateArrivee: arrivee,
        dateDepart: depart,
        nombrePersonnes: nombreVoyageurs,
        nombreNuits: nuits,

        // Prix (identiques à HomePage)
        prixInfo,
        prixNuit: prixNuitFinal,
        prixMoyen: prixNuitFinal,
        prixTotal: sousTotal,
        devise,
        prixAvantPromotion: totalAvantPromotion,
        reductionTotale,

        tarif: {
          prixNuit: prixNuitFinal,
          prix_nuit: prixNuitFinal,
          prixTotal: sousTotal,
          prixAvantPromotion: totalAvantPromotion,
          reductionTotale,
          devise,
        },

        // Détail par nuit (même prix sur toutes les nuits, comme HomePage)
        detailsTarifs: datesSejour.map((date) => ({
          date,
          prixNaturel: prixInfo.prixBase,
          prixSaison: prixNuitAvantPromo,
          coefficient: prixInfo.coefficient,
          saison: prixInfo.saison?.nom || null,
          prixFinal: prixNuitFinal,
          reduction: prixInfo.montantReduction,
          promotion: promotionsUtilisees[0] || null,
        })),

        promotionsUtilisees,

        criteresRecherche: {
          dateArrivee: arrivee,
          dateDepart: depart,
          nombrePersonnes: nombreVoyageurs,
        },
      },
    });
  };

  // ==================================================
  // CHARGEMENT ET ERREURS
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
        {/* GALERIE DES IMAGES */}

        <div className="detail-gallery">
          {images.map((image, index) => (
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
                fallbackSrc={DEFAULT_IMAGES[index % DEFAULT_IMAGES.length]}
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
                  Plein écran ({images.length} images)
                </button>
              )}
            </div>
          ))}
        </div>

        {/* LIGHTBOX */}

        {lightboxOpen && images.length > 0 && (
          <div className="lightbox" onClick={() => setLightboxOpen(false)}>
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
                setIndexActif((i) => (i - 1 + images.length) % images.length);
              }}
            >
              ‹
            </button>

            <ImageChambre
              src={images[indexActif]}
              fallbackSrc={DEFAULT_IMAGES[indexActif % DEFAULT_IMAGES.length]}
              alt={`Chambre ${chambre.numero} – image ${indexActif + 1}`}
              className="lightbox-image"
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

            <h3>Équipements & prestations</h3>

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
              {promotionAppliquee && (
                <span className="promotion-nom">
                  Offre : {promotionAppliquee.libelle} (
                  {getLibelleReduction(promotionAppliquee)})
                </span>
              )}

              {prixInfo.saison && (
                <span className="promotion-nom">
                  Saison : {prixInfo.saison.nom}
                </span>
              )}
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
                  onChange={(e) => changerArrivee(e.target.value)}
                />
              </label>

              <label>
                <span>Départ</span>
                <input
                  type="date"
                  value={depart}
                  min={
                    arrivee
                      ? jourSuivant(arrivee)
                      : jourSuivant(getDateAujourdhui())
                  }
                  required
                  onChange={(e) => changerDepart(e.target.value)}
                />
              </label>
            </div>

            {/* VOYAGEURS */}

            <label className="reservation-voyageurs">
              <span>Voyageurs</span>

              <select
                value={Math.min(Math.max(1, Number(voyageurs) || 1), capacite)}
                onChange={(e) => {
                  setVoyageurs(Number(e.target.value));
                  setErreurReservation("");
                }}
              >
                {Array.from({ length: capacite }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} voyageur{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>

            {/* RÉCAPITULATIF DU SÉJOUR */}

            <div className="reservation-lignes">
              {chargementTarifs ? (
                <p>Calcul des tarifs...</p>
              ) : !prixInfo.disponible ? (
                <p className="reservation-error">
                  Prix de la chambre indisponible
                </p>
              ) : nuits > 0 ? (
                <>
                  <h4>Récapitulatif du séjour</h4>

                  <div>
                    <span>Prix par nuit</span>
                    <strong>
                      {prixInfo.aPromotion && (
                        <s style={{ marginRight: 8, opacity: 0.6 }}>
                          {formaterPrix(prixNuitAvantPromo)} {devise}
                        </s>
                      )}
                      {formaterPrix(prixNuitFinal)} {devise}
                    </strong>
                  </div>

                  <div>
                    <span>Nombre de nuits</span>
                    <strong>{nuits}</strong>
                  </div>

                  {prixInfo.aPromotion && (
                    <>
                      <div>
                        <span>Prix avant promotion</span>
                        <strong>
                          {formaterPrix(totalAvantPromotion)} {devise}
                        </strong>
                      </div>

                      <div className="reservation-economie">
                        <span>Réduction totale</span>
                        <strong>
                          -{formaterPrix(reductionTotale)} {devise}
                        </strong>
                      </div>
                    </>
                  )}

                  <div className="reservation-total">
                    <span>
                      Total du séjour ({pluriel(nuits, "nuit", "nuits")})
                    </span>
                    <strong>
                      {formaterPrix(sousTotal)} {devise}
                    </strong>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span>Prix par nuit</span>
                    <strong>
                      {formaterPrix(prixNuitFinal)} {devise}
                    </strong>
                  </div>

                  <p className="reservation-info">
                    Sélectionnez vos dates pour voir le détail des saisons et
                    des promotions applicables.
                  </p>
                </>
              )}

              {erreurTarifs && !chargementTarifs && (
                <p className="reservation-info">{erreurTarifs}</p>
              )}
            </div>

            {/* ERREUR */}

            {erreurReservation && (
              <p className="reservation-error" role="alert">
                {erreurReservation}
              </p>
            )}

            {/* BOUTON RÉSERVATION */}

            <button
              type="button"
              className="reservation-button"
              onClick={handleReservation}
              disabled={
                chargementTarifs ||
                !prixInfo.disponible ||
                nuits <= 0 ||
                sousTotal <= 0
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
      </div>
    </div>
  );
}

export default DetailChambrePage;