
import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getChambres } from "../../services/chambresApi";
import { verifierChambre } from "../../services/disponibilitesApi";
import "./HomePage.css";

const TARIFS_API =
  import.meta.env.VITE_TARIFS_API_URL || "http://localhost:8004/api";

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

const svgProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const FEATURES = [
  {
    title: "Réservation instantanée",
    desc: "Confirmation directe sans attente ni frais imprévus.",
    icon: (
      <svg {...svgProps}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    title: "Transparence totale",
    desc: "Prix clairs et descriptions détaillées de chaque chambre.",
    icon: (
      <svg {...svgProps}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    title: "Sécurité & Assistance",
    desc: "Un accompagnement dédié pour rendre votre séjour agréable.",
    icon: (
      <svg {...svgProps}>
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

function jourPrecedent(dateStr) {
  const [annee, mois, jour] = dateStr.split("-").map(Number);
  const date = new Date(annee, mois - 1, jour);
  date.setDate(date.getDate() - 1);
  return formatDateISO(date);
}

function calculerNombreNuits(debut, fin) {
  if (!debut || !fin) return 1;

  const [a1, m1, j1] = debut.split("-").map(Number);
  const [a2, m2, j2] = fin.split("-").map(Number);

  const d1 = Date.UTC(a1, m1 - 1, j1);
  const d2 = Date.UTC(a2, m2 - 1, j2);

  return Math.max(0, Math.round((d2 - d1) / 86400000));
}

// ==================================================
// EXTRACTION DES RÉPONSES API
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
    if (Array.isArray(data?.[nom])) {
      return data[nom];
    }
  }

  return [];
}

// ==================================================
// CAPACITÉ DES CHAMBRES
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

      if (
        valeur !== null &&
        valeur !== undefined &&
        valeur !== ""
      ) {
        const nombre = Number.parseInt(
          String(valeur).match(/\d+/)?.[0] || "",
          10
        );

        if (Number.isFinite(nombre) && nombre > 0) {
          return nombre;
        }
      }
    }
  }

  return 0;
}

function chambrePeutAccueillir(room, nombreVoyageurs) {
  const capacite = getCapaciteChambre(room);
  const voyageurs = Number(nombreVoyageurs);

  // Si la capacité n'est pas renseignée dans les données,
  // on laisse le service Disponibilités effectuer la vérification.
  if (capacite <= 0) {
    return true;
  }

  return voyageurs >= 1 && voyageurs <= capacite;
}

// ==================================================
// OUTILS COMMUNS
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

function dateDansPeriodePromotion(date, debut, fin) {
  const jour = String(date || "").slice(0, 10);
  const dateDebut = debut ? String(debut).slice(0, 10) : null;
  const dateFin = fin ? String(fin).slice(0, 10) : null;

  if (!jour) return false;
  if (dateDebut && jour < dateDebut) return false;
  if (dateFin && jour >= dateFin) return false;

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

  return Number.isInteger(nombre)
    ? String(nombre)
    : formaterPrix(nombre);
}

function pluriel(nombre, singulier, plurielTexte) {
  return `${nombre} ${nombre > 1 ? plurielTexte : singulier}`;
}

// ==================================================
// IDENTIFIER LE TARIF DE LA CHAMBRE
// ==================================================

function trouverTarifsChambre(room, tarifs, date) {
  return tarifs
    .filter((tarif) => {
      if (Number(tarif.chambre_id) !== Number(room.id)) {
        return false;
      }

      if (!estActif(tarif)) return false;

      if (
        tarif.date_application &&
        String(tarif.date_application).slice(0, 10) > date
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const dateA = String(a.date_application || "");
      const dateB = String(b.date_application || "");

      return dateB.localeCompare(dateA);
    });
}

// ==================================================
// TROUVER LA SAISON APPLICABLE
// ==================================================

function trouverSaisonApplicable(tarif, saisons, date) {
  const saisonLiee = tarif?.saison;

  if (
    saisonLiee &&
    estActif(saisonLiee) &&
    dateDansPeriode(date, saisonLiee.date_debut, saisonLiee.date_fin)
  ) {
    return saisonLiee;
  }

  return (
    saisons.find((saison) => {
      return (
        Number(saison.id) === Number(tarif.saison_id) &&
        estActif(saison) &&
        dateDansPeriode(date, saison.date_debut, saison.date_fin)
      );
    }) || null
  );
}

// ==================================================
// TROUVER LE TARIF SAISONNIER
// ==================================================

function trouverTarifEtSaison(room, tarifs, saisons, date) {
  const tarifsChambre = trouverTarifsChambre(room, tarifs, date);

  const tarifsAvecSaison = tarifsChambre
    .filter((tarif) => tarif.saison_id || tarif.saison)
    .map((tarif) => ({
      tarif,
      saison: trouverSaisonApplicable(tarif, saisons, date),
    }))
    .filter((element) => element.saison !== null);

  if (tarifsAvecSaison.length > 0) {
    tarifsAvecSaison.sort((a, b) => {
      const dateA = String(a.tarif.date_application || "");
      const dateB = String(b.tarif.date_application || "");

      return dateB.localeCompare(dateA);
    });

    return tarifsAvecSaison[0];
  }

  const tarifSansSaison =
    tarifsChambre.find((tarif) => !tarif.saison_id && !tarif.saison) ||
    null;

  return {
    tarif: tarifSansSaison,
    saison: null,
  };
}

// ==================================================
// CALCUL DU PRIX SAISONNIER
// ==================================================

function calculerPrixSaisonnier(room, tarif, saison) {
  const prixChambre = Number(room.prix_nuit);
  const prixBaseTarif = Number(tarif?.prix_base ?? tarif?.prix_nuit);

  const prixBase =
    Number.isFinite(prixBaseTarif) && prixBaseTarif > 0
      ? prixBaseTarif
      : Number.isFinite(prixChambre) && prixChambre > 0
        ? prixChambre
        : 0;

  if (prixBase <= 0) {
    return { prixBase: 0, prixSaisonnier: 0, coefficient: 1 };
  }

  let coefficient = Number(
    saison?.coefficient_saison ??
      saison?.coefficient ??
      tarif?.coefficient_saison ??
      1
  );

  if (
    (!Number.isFinite(coefficient) || coefficient <= 0) &&
    tarif?.prix_nuit &&
    tarif?.prix_base
  ) {
    coefficient = Number(tarif.prix_nuit) / Number(tarif.prix_base);
  }

  if (!Number.isFinite(coefficient) || coefficient <= 0) {
    coefficient = 1;
  }

  const prixSaisonnier = prixBase * coefficient;

  return {
    prixBase: Number(prixBase.toFixed(2)),
    prixSaisonnier: Number(prixSaisonnier.toFixed(2)),
    coefficient,
  };
}

// ==================================================
// OUTILS PROMOTION
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
  return Number(
    promotion?.nuits_min || promotion?.nombre_nuits_min || 1
  );
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

// ==================================================
// COMPTE À REBOURS DE LA PROMOTION
// ==================================================

function getCompteARebours(promotion, dateActuelle) {
  if (!promotion) return null;

  const debut = promotion.date_debut
    ? String(promotion.date_debut).slice(0, 10)
    : null;

  const fin = promotion.date_fin
    ? String(promotion.date_fin).slice(0, 10)
    : null;

  if (debut && debut > dateActuelle) {
    const joursAvantDebut = calculerNombreNuits(dateActuelle, debut);

    return {
      etat: "avenir",
      jours: joursAvantDebut,
      progression: 0,
      libelleCourt:
        joursAvantDebut === 1
          ? "Débute demain"
          : `Débute dans ${joursAvantDebut} jours`,
      libelleTitre: "Début de l'offre",
      libelleValeur:
        joursAvantDebut === 1
          ? "Demain"
          : pluriel(joursAvantDebut, "jour", "jours"),
    };
  }

  if (!fin) {
    return {
      etat: "permanente",
      jours: null,
      progression: 0,
      libelleCourt: "Offre en cours",
      libelleTitre: "Offre",
      libelleValeur: "En cours",
    };
  }

  const joursRestants = calculerNombreNuits(dateActuelle, fin);

  if (joursRestants <= 0) return null;

  const dureeTotale = debut ? calculerNombreNuits(debut, fin) : 0;

  const progression =
    dureeTotale > 0
      ? Math.min(
          100,
          Math.max(
            0,
            ((dureeTotale - joursRestants) / dureeTotale) * 100
          )
        )
      : 0;

  if (joursRestants === 1) {
    return {
      etat: "derniere",
      jours: 1,
      progression,
      libelleCourt: "Dernier jour",
      libelleTitre: "Se termine",
      libelleValeur: "Aujourd'hui",
    };
  }

  return {
    etat: "active",
    jours: joursRestants,
    progression,
    libelleCourt: `${joursRestants} jours restants`,
    libelleTitre: "Se termine dans",
    libelleValeur: pluriel(joursRestants, "jour", "jours"),
  };
}

// ==================================================
// PROMOTION À AFFICHER
// ==================================================

function promotionPeutEtreAffichee(promotion, room, dateActuelle) {
  if (!estActif(promotion)) return false;

  if (!promotionCorrespondChambre(promotion, room)) {
    return false;
  }

  const dateFin = promotion.date_fin
    ? String(promotion.date_fin).slice(0, 10)
    : null;

  if (dateFin && dateActuelle >= dateFin) {
    return false;
  }

  return true;
}

// ==================================================
// PROMOTION VALIDE POUR TOUT LE SÉJOUR
// ==================================================

function promotionValidePourSejour(
  promotion,
  room,
  dateDebut,
  dateFin,
  nombreNuits
) {
  if (!estActif(promotion)) return false;

  if (!promotionCorrespondChambre(promotion, room)) {
    return false;
  }

  if (!dateDebut || !dateFin || nombreNuits <= 0) {
    return false;
  }

  if (nombreNuits < getNuitsMinPromotion(promotion)) {
    return false;
  }

  const debutPromotion = promotion.date_debut
    ? String(promotion.date_debut).slice(0, 10)
    : null;

  const finPromotion = promotion.date_fin
    ? String(promotion.date_fin).slice(0, 10)
    : null;

  return (
    (!debutPromotion || dateDebut >= debutPromotion) &&
    (!finPromotion || dateFin <= finPromotion)
  );
}

// ==================================================
// CALCULER LA RÉDUCTION
// ==================================================

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
    const montantReduction = Math.min(
      prixSaisonnier,
      Math.max(0, valeur)
    );

    const prixFinal = Math.max(0, prixSaisonnier - montantReduction);

    const pourcentageReduction =
      prixSaisonnier > 0
        ? (montantReduction / prixSaisonnier) * 100
        : 0;

    return {
      prixFinal,
      montantReduction,
      pourcentageReduction,
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

// ==================================================
// PROMOTION À AFFICHER SUR LA CARTE
// ==================================================

function trouverPromotionAAfficher(promotions, room, dateActuelle) {
  const promotionsValides = promotions.filter((promotion) =>
    promotionPeutEtreAffichee(promotion, room, dateActuelle)
  );

  if (promotionsValides.length === 0) {
    return null;
  }

  const promotionsActives = promotionsValides.filter((promotion) => {
    const debut = promotion.date_debut
      ? String(promotion.date_debut).slice(0, 10)
      : null;

    return !debut || dateActuelle >= debut;
  });

  if (promotionsActives.length > 0) {
    promotionsActives.sort((a, b) =>
      String(b.date_debut || "").localeCompare(
        String(a.date_debut || "")
      )
    );

    return promotionsActives[0];
  }

  promotionsValides.sort((a, b) =>
    String(a.date_debut || "").localeCompare(String(b.date_debut || ""))
  );

  return promotionsValides[0];
}

// ==================================================
// MEILLEURE PROMOTION DU SÉJOUR
// ==================================================

function trouverPromotionApplicable(
  promotions,
  room,
  dateDebut,
  dateFin,
  nombreNuits,
  prixSaisonnier
) {
  const promotionsValides = promotions.filter((promotion) =>
    promotionValidePourSejour(
      promotion,
      room,
      dateDebut,
      dateFin,
      nombreNuits
    )
  );

  if (promotionsValides.length === 0) {
    return null;
  }

  const promotionsCalculees = promotionsValides.map((promotion) => ({
    promotion,
    reduction: calculerReductionPromotion(promotion, prixSaisonnier),
  }));

  promotionsCalculees.sort(
    (a, b) =>
      b.reduction.montantReduction - a.reduction.montantReduction
  );

  return promotionsCalculees[0];
}

// ==================================================
// CALCUL COMPLET DU PRIX DE LA CHAMBRE
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
    aPromotion: false,
    prixApercuPromotion: null,
    pourcentageApercuPromotion: 0,
    devise: "MAD",
    tarif: null,
    saison: null,
    promotionInfo: null,
  };

  if (nombreNuits <= 0) {
    return resultatVide;
  }

  const { tarif, saison } = trouverTarifEtSaison(
    room,
    tarifs,
    saisons,
    dateDebut
  );

  const prix = calculerPrixSaisonnier(room, tarif, saison);

  if (prix.prixBase <= 0) {
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
    ? calculerReductionPromotion(
        promotionAAfficher,
        prix.prixSaisonnier
      )
    : null;

  const promotionChoisie = trouverPromotionApplicable(
    promotions,
    room,
    dateDebut,
    dateFin,
    nombreNuits,
    prix.prixSaisonnier
  );

  let prixFinal = prix.prixSaisonnier;
  let montantReduction = 0;
  let pourcentageReduction = 0;
  let typeReduction = null;

  if (promotionChoisie) {
    const resultat = promotionChoisie.reduction;

    prixFinal = resultat.prixFinal;
    montantReduction = resultat.montantReduction;
    pourcentageReduction = resultat.pourcentageReduction;
    typeReduction = resultat.typeReduction;
  }

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
    typeReduction,
    devise: tarif?.devise || "MAD",
    tarif,
    saison,
    promotionInfo: promotionAAfficher,
  };
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
    const imageUrl =
      image.url ||
      image.path ||
      image.chemin ||
      image.image ||
      image.src ||
      "";

    if (
      imageUrl &&
      !/^https?:\/\//i.test(imageUrl) &&
      !imageUrl.startsWith("data:") &&
      !imageUrl.startsWith("blob:")
    ) {
      const base =
        import.meta.env.VITE_CHAMBRES_STORAGE_URL ||
        "http://localhost:8001/storage";

      return `${base.replace(/\/+$/, "")}/${String(imageUrl)
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")
        .replace(/^(public\/)?storage\//, "")}`;
    }

    return imageUrl;
  }

  return "";
}

// ==================================================
// VÉRIFICATION DE DISPONIBILITÉ
// ==================================================

function estChambreDisponible(response) {
  const data = unwrapResponse(response);

  if (data === true || data === 1 || data === "1") {
    return true;
  }

  if (typeof data === "string") {
    return [
      "true",
      "available",
      "disponible",
      "1",
    ].includes(data.trim().toLowerCase());
  }

  if (!data || typeof data !== "object") {
    return false;
  }

  const valeurs = [
    data.disponible,
    data.est_disponible,
    data.available,
    data.is_available,
    data.disponibilite,
    data.statut,
    data.status,
  ];

  return valeurs.some((valeur) => {
    if (valeur === true || valeur === 1) return true;

    if (typeof valeur === "string") {
      return [
        "true",
        "1",
        "available",
        "disponible",
      ].includes(valeur.trim().toLowerCase());
    }

    if (valeur && typeof valeur === "object") {
      return (
        valeur.disponible === true ||
        valeur.available === true ||
        valeur.is_available === true
      );
    }

    return false;
  });
}

// ==================================================
// ICÔNES
// ==================================================

function AmenityIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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

// ==================================================
// PANNEAU PROMOTION
// ==================================================

function PromotionPanel({
  promotion,
  compteARebours,
  promotionApplicable,
  criteresRecherche,
}) {
  if (!promotion || !compteARebours) return null;

  const nuitsMin = getNuitsMinPromotion(promotion);
  const enCours = compteARebours.etat !== "avenir";

  let statutClasse = "is-info";
  let statutTexte = "Choisissez vos dates pour en profiter";

  if (!enCours) {
    statutClasse = "is-upcoming";
    statutTexte = "Cette offre sera disponible prochainement";
  } else if (promotionApplicable) {
    statutClasse = "is-success";
    statutTexte = "Promotion appliquée à votre séjour";
  } else if (criteresRecherche) {
    statutClasse = "is-error";
    statutTexte = "Promotion non applicable à ces dates";
  }


}

// ==================================================
// CARTE CHAMBRE
// ==================================================

function RoomCard({
  room,
  index,
  criteresRecherche,
  tarifs,
  saisons,
  promotions,
  dateActuelle,
}) {
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
      ? "Vue Mer Panoramique"
      : room.type === "presidentielle"
        ? "Prestige"
        : "Confort");

  const displaySize = room.superficie || 0;
  const capacite = getCapaciteChambre(room);

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

  const dateDebut = criteresRecherche?.date_debut || getDateAujourdhui();
  const dateFin = criteresRecherche?.date_fin || getDateDemain();
  const nuits = calculerNombreNuits(dateDebut, dateFin);

  const prixInfo = calculerPrixChambre(
    room,
    tarifs,
    saisons,
    promotions,
    dateDebut,
    dateFin,
    dateActuelle
  );

  const prixTotal = prixInfo.prixFinal * nuits;
  const detailUrl = `/chambres/${room.id}`;

  const detailState = {
    chambre: room,
    prixInfo,
    prixTotal,
    nombreNuits: nuits,
    criteresRecherche: criteresRecherche
      ? {
          dateArrivee: dateDebut,
          dateDepart: dateFin,
          nombrePersonnes: Number(criteresRecherche.adultes),
        }
      : null,
    disponibilite: room.disponibilite || null,
  };

  const promotion = prixInfo.promotionInfo;
  const compteARebours = getCompteARebours(promotion, dateActuelle);

  const afficherPromotion = Boolean(promotion && compteARebours);

  const afficherApercuPromotion =
    !criteresRecherche &&
    afficherPromotion &&
    !prixInfo.aPromotion &&
    prixInfo.prixApercuPromotion !== null;

  const promotionApplicable = prixInfo.aPromotion;

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

        {afficherPromotion && (
          <div className="room-card__promotion-badges">
            <span className="room-card__discount-badge">
              {getLibelleReduction(promotion)}
            </span>

            <span
              className={`room-card__countdown-badge ${
                compteARebours.etat === "derniere" ? "is-last-day" : ""
              } ${compteARebours.etat === "avenir" ? "is-upcoming" : ""}`}
            >
              <span className="room-card__countdown-icon">
                <ClockIcon />
              </span>
              {compteARebours.libelleCourt}
            </span>
          </div>
        )}
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

        {afficherPromotion && (
          <PromotionPanel
            promotion={promotion}
            compteARebours={compteARebours}
            promotionApplicable={promotionApplicable}
            criteresRecherche={criteresRecherche}
          />
        )}

        <div className="room-card__footer">
          <div className="room-card__price">
            {prixInfo.disponible ? (
              <>
                {(promotionApplicable || afficherApercuPromotion) && (
                  <span className="room-card__old-price">
                    {formaterPrix(prixInfo.prixSaisonnier)}{" "}
                    {prixInfo.devise}
                  </span>
                )}

                <span className="room-card__price-amount">
                  {formaterPrix(
                    promotionApplicable
                      ? prixInfo.prixFinal
                      : afficherApercuPromotion
                        ? prixInfo.prixApercuPromotion
                        : prixInfo.prixFinal
                  )}{" "}
                  {prixInfo.devise}
                </span>

             
             
              </>
            ) : (
              <span className="room-card__price-unit room-card__unavailable">
                Prix de la chambre indisponible
              </span>
            )}
          </div>

          <Link
            to={detailUrl}
            state={detailState}
            className="room-card__btn"
          >
            Voir les détails
          </Link>
        </div>

        {prixInfo.disponible && (
          <div className="room-card__tariff-details">
            {capacite > 0 && (
              <p>
                Capacité maximale :{" "}
                <strong>
                  {pluriel(capacite, "personne", "personnes")}
                </strong>
              </p>
            )}

            

           

            {nuits > 1 && (
              <p className="room-card__total">
                Total pour {nuits} nuits :{" "}
                <strong>
                  {formaterPrix(prixTotal)} {prixInfo.devise}
                </strong>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================================================
// PAGE PRINCIPALE
// ==================================================

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  const [dateActuelle, setDateActuelle] = useState(getDateAujourdhui);

  useEffect(() => {
    const interval = setInterval(() => {
      const nouvelleDate = getDateAujourdhui();

      setDateActuelle((ancienneDate) =>
        ancienneDate !== nouvelleDate ? nouvelleDate : ancienneDate
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const [dateDebut, setDateDebut] = useState(getDateAujourdhui);
  const [dateFin, setDateFin] = useState(getDateDemain);
  const [adultes, setAdultes] = useState(2);

  const [rooms, setRooms] = useState([]);
  const [searchedRooms, setSearchedRooms] = useState(null);
  const capaciteRechercheMax = Math.max(
    1,
    ...rooms
      .map((room) => getCapaciteChambre(room))
      .filter((capacite) => capacite > 0)
  );

  const [tarifs, setTarifs] = useState([]);
  const [saisons, setSaisons] = useState([]);
  const [promotions, setPromotions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [tarifsLoading, setTarifsLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchError, setSearchError] = useState("");

  const [selectedFilter, setSelectedFilter] = useState("all");
  const [criteresRecherche, setCriteresRecherche] = useState(null);

  // ==================================================
  // CHARGEMENT DES CHAMBRES
  // ==================================================

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getChambres({ statut: "disponible" });

      const liste = extraireListe(response, ["chambres"]);

      console.log("CHAMBRES REÇUES DE L'API :", liste);

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

      console.log(
        "CHAMBRES CONSERVÉES :",
        chambresDisponibles.map((room) => ({
          id: room.id,
          nom: room.nom,
          capacite: getCapaciteChambre(room),
          statut: room.statut,
          donnees: room,
        }))
      );

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

  // ==================================================
  // CHARGEMENT TARIFS, SAISONS ET PROMOTIONS
  // ==================================================

  const fetchTarifs = useCallback(async () => {
    try {
      setTarifsLoading(true);

      const [tarifsResponse, saisonsResponse, promotionsResponse] =
        await Promise.all([
          axios.get(`${TARIFS_API}/tarifs`),
          axios.get(`${TARIFS_API}/saisons`),
          axios.get(`${TARIFS_API}/promotions`),
        ]);

      setTarifs(extraireListe(tarifsResponse, ["tarifs"]).filter(estActif));

      setSaisons(
        extraireListe(saisonsResponse, ["saisons"]).filter(estActif)
      );

      setPromotions(
        extraireListe(promotionsResponse, ["promotions"]).filter(estActif)
      );
    } catch (err) {
      console.error(
        "Erreur récupération Tarifs :",
        err.response?.data || err.message
      );

      setTarifs([]);
      setSaisons([]);
      setPromotions([]);
    } finally {
      setTarifsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    fetchTarifs();
  }, [fetchTarifs]);

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
  // RECHERCHE DES DISPONIBILITÉS + CAPACITÉ
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
      setSearchError(
        "La date de départ doit être après la date d'arrivée."
      );
      return;
    }

    const nombreVoyageurs = Number(adultes);

    if (
      !Number.isInteger(nombreVoyageurs) ||
      nombreVoyageurs < 1 ||
      nombreVoyageurs > capaciteRechercheMax
    ) {
      setSearchError(
        `Le nombre de voyageurs ne peut pas dépasser ${capaciteRechercheMax}, la capacité maximale des chambres disponibles.`
      );
      return;
    }

    const criteres = {
      date_debut: dateDebut,
      date_fin: dateFin,
      adultes: nombreVoyageurs,
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
      // ÉTAPE 1 : filtrer les chambres selon leur capacité connue.
      const chambresCompatibles = rooms.filter((room) =>
        chambrePeutAccueillir(room, nombreVoyageurs)
      );

      console.log("RECHERCHE :", {
        voyageurs: nombreVoyageurs,
        chambresTotal: rooms.length,
        chambresCompatibles: chambresCompatibles.map((room) => ({
          id: room.id,
          nom: room.nom,
          capacite: getCapaciteChambre(room),
        })),
      });

      if (chambresCompatibles.length === 0) {
        setSearchedRooms([]);
        setSearchError(
          `Aucune chambre ne peut accueillir ${nombreVoyageurs} voyageur(s).`
        );
        return;
      }

      // ÉTAPE 2 : vérifier les disponibilités auprès du service.
      const verifications = await Promise.all(
        chambresCompatibles.map(async (room) => {
          try {
            const response = await verifierChambre(room.id, {
              date_debut: criteres.date_debut,
              date_fin: criteres.date_fin,
              adultes: nombreVoyageurs,
            });

            const data = unwrapResponse(response);
            const disponible = estChambreDisponible(response);

            console.log(`DISPONIBILITÉ CHAMBRE ${room.id} :`, {
              reponseAPI: data,
              disponible,
              capacite: getCapaciteChambre(room),
            });

            return {
              room: {
                ...room,
                disponibilite: data,
              },
              disponible,
              erreur: false,
            };
          } catch (err) {
            console.error(
              `Erreur disponibilité chambre ${room.id} :`,
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

      // ÉTAPE 3 : vérifier que le service a répondu.
      const controlesReussis = verifications.filter(
        (resultat) => !resultat.erreur
      );

      if (controlesReussis.length === 0) {
        throw new Error(
          "Impossible de contacter le service Disponibilités. Veuillez réessayer."
        );
      }

      // ÉTAPE 4 : conserver les chambres disponibles et compatibles.
      const disponibles = verifications
        .filter((resultat) => {
          if (resultat.erreur || !resultat.disponible) {
            return false;
          }

          return chambrePeutAccueillir(
            resultat.room,
            nombreVoyageurs
          );
        })
        .map((resultat) => resultat.room);

      setSearchedRooms(disponibles);

      if (verifications.some((resultat) => resultat.erreur)) {
        setSearchError(
          "Certaines chambres n'ont pas pu être vérifiées. Seules les disponibilités confirmées sont affichées."
        );
      }

      if (
        disponibles.length === 0 &&
        !verifications.some((resultat) => resultat.erreur)
      ) {
        setSearchError(
          `Aucune chambre disponible pour ${nombreVoyageurs} voyageur(s) aux dates sélectionnées.`
        );
      }
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

  const chambresSource = searchedRooms !== null ? searchedRooms : rooms;

  const filteredRooms = chambresSource.filter((room) => {
    const type = String(room.type || "").toLowerCase();

    if (selectedFilter === "all") return true;

    if (selectedFilter === "suite") {
      return type === "suite" || type === "presidentielle";
    }

    if (selectedFilter === "double") return type === "double";
    if (selectedFilter === "simple") return type === "simple";

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

  const filtres = [
    { id: "all", label: `Toutes (${chambresSource.length})` },
    { id: "suite", label: "Suites" },
    { id: "double", label: "Chambres Doubles" },
    { id: "simple", label: "Chambres Simples" },
  ];

  // ==================================================
  // AFFICHAGE
  // ==================================================

  return (
    <>
      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__overlay" />

        <div className="hero__content">
          <div className="hero__badge">
            Hôtellerie d'exception & séjours sur-mesure
          </div>

          <h1 className="hero__title">
            Votre prochaine expérience
            <br />
            commence ici
          </h1>

          <p className="hero__subtitle">
            Découvrez des hébergements d'exception soigneusement
            sélectionnés pour vos séjours d'affaires et de loisirs.
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
            <span className="search-bar__icon">📍</span>

            <div className="search-bar__info">
              <span className="search-bar__label">Établissement</span>
              <span className="search-bar__value">
                Marrakech, Palmeraie
              </span>
            </div>
          </div>

          <label className="search-bar__field">
            <span className="search-bar__icon">📅</span>

            <div className="search-bar__info">
              <span className="search-bar__label">Date d'arrivée</span>

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
            <span className="search-bar__icon">📅</span>

            <div className="search-bar__info">
              <span className="search-bar__label">Date de départ</span>

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
            <span className="search-bar__icon">👥</span>

            <div className="search-bar__info">
              <span className="search-bar__label">Voyageurs</span>

              <select
                className="search-bar__input"
                value={adultes}
                onChange={(e) => setAdultes(Number(e.target.value))}
              >
                {Array.from(
                  { length: capaciteRechercheMax },
                  (_, index) => index + 1
                ).map((n) => (
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
          <p className="search-error">{searchError}</p>
        )}
      </div>

      {/* CHAMBRES */}
      <section className="rooms-section" id="chambres-signature">
        <div className="rooms-section__header">
          <div className="rooms-section__header-left">
            <span className="badge">Sélection Exclusive</span>

            <h2 className="section-title">
              Nos Chambres & Suites Signature
            </h2>

            <p className="section-subtitle" style={{ marginTop: 10 }}>
              Une architecture raffinée où chaque détail honore le calme,
              les matières nobles et le confort absolu.
            </p>

            {searchedRooms !== null && !searchLoading && (
              <div className="search-results-info">
                {searchedRooms.length} chambre(s) disponible(s) pour{" "}
                {criteresRecherche?.adultes} voyageur(s).
                <button
                  type="button"
                  className="reset-search-btn"
                  onClick={reinitialiserRecherche}
                >
                  Réinitialiser la recherche
                </button>
              </div>
            )}
          </div>

          <div className="rooms-filter">
            {filtres.map((filtre) => (
              <button
                key={filtre.id}
                type="button"
                className={`filter-btn ${
                  selectedFilter === filtre.id ? "active" : ""
                }`}
                onClick={() => setSelectedFilter(filtre.id)}
                disabled={loading || searchLoading}
              >
                {filtre.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="rooms-loading">
            <div className="rooms-spinner" />
            <p>Chargement des chambres d'exception...</p>
          </div>
        )}

        {searchLoading && !loading && (
          <div className="rooms-search-loading">
            <p>Vérification des disponibilités...</p>
            <p>Nous recherchons les chambres adaptées à votre séjour.</p>
          </div>
        )}

        {error && !loading && (
          <div className="rooms-error">
            <p>⚠️ {error}</p>

            <button type="button" onClick={fetchRooms}>
              Réessayer
            </button>
          </div>
        )}

        {!loading && tarifsLoading && (
          <p className="tarifs-loading">
            Chargement des tarifs et promotions...
          </p>
        )}

        {!loading &&
          !tarifsLoading &&
          tarifs.length === 0 &&
          saisons.length === 0 &&
          promotions.length === 0 && (
            <p className="tarifs-unavailable">
              Tarifs saisonniers et promotions indisponibles. Les prix de
              base des chambres restent affichés.
            </p>
          )}

        {!loading &&
          !searchLoading &&
          !error &&
          searchedRooms !== null &&
          filteredRooms.length === 0 && (
            <div className="rooms-empty">
              <h3>Aucune chambre disponible</h3>
              <p>
                Essayez d'autres dates ou modifiez le nombre de
                voyageurs.
              </p>
            </div>
          )}

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
                  tarifs={tarifs}
                  saisons={saisons}
                  promotions={promotions}
                  dateActuelle={dateActuelle}
                />
              ))}
            </div>
          )}
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <div className="features-section__header">
          <span className="badge">Excellence & Sérénité</span>

          <h2 className="section-title">Pourquoi choisir HotelHub</h2>

          <p className="section-subtitle">
            Une exigence continue conçue pour transformer chaque instant
            de réservation en une promesse de sérénité absolue.
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
            séjour d'exception ?
          </h2>

          <p className="cta-section__subtitle">
            Rejoignez le cercle privilégié HotelHub et découvrez nos
            chambres et suites.
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
