
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { getChambres } from "../../services/chambresApi";
import { tarifsApi } from "../../services/tarifsApi";
import { useAuth } from "../../context/AuthContext";
import ClientAvisPage from "./ClientAvisPage";
import "./DetailChambrePage.css";

// ==================================================
// CONFIGURATION IMAGES
// ==================================================

const STORAGE_URL =
  import.meta.env.VITE_CHAMBRES_STORAGE_URL ||
  "http://localhost:8001/storage";

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
// EXTRACTION DES DONNÉES API
// ==================================================

const extraireListe = (response) => {
  let data = response?.data ?? response;

  for (let i = 0; i < 3; i++) {
    if (Array.isArray(data)) return data;

    if (data && typeof data === "object" && data.data !== undefined) {
      data = data.data;
      continue;
    }

    break;
  }

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.chambres)) return data.chambres;
  if (Array.isArray(data?.saisons)) return data.saisons;
  if (Array.isArray(data?.promotions)) return data.promotions;

  return [];
};

// ==================================================
// EXTRACTION DES CHEMINS DES IMAGES
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

// ==================================================
// CONSTRUCTION DES URL DES IMAGES
// ==================================================

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

// ==================================================
// RÉCUPÉRATION DE TOUTES LES IMAGES
// ==================================================

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
    .filter(
      (url) => typeof url === "string" && url.trim().length > 0
    );

  if (imagesReelles.length === 0) {
    return [DEFAULT_IMAGES[0]];
  }

  return imagesReelles;
};

// ==================================================
// FORMATAGE
// ==================================================

const formatPrix = (valeur) => {
  const prix = Number(valeur || 0);

  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(prix) ? prix : 0)} MAD`;
};

const formaterDateClient = (date) => {
  if (!date) return "—";

  const [annee, mois, jour] = String(date).slice(0, 10).split("-");

  return `${jour}/${mois}/${annee}`;
};

const getDateAujourdhui = () => {
  const date = new Date();

  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
};

const lendemain = (dateStr) => {
  if (!dateStr) return "";

  const [annee, mois, jour] = dateStr.split("-").map(Number);

  const date = new Date(annee, mois - 1, jour);
  date.setDate(date.getDate() + 1);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

// ==================================================
// CALCUL DES NUITS
// ==================================================

const nombreNuits = (arrivee, depart) => {
  if (!arrivee || !depart) return 0;

  const [a1, m1, j1] = arrivee.split("-").map(Number);
  const [a2, m2, j2] = depart.split("-").map(Number);

  const debut = Date.UTC(a1, m1 - 1, j1);
  const fin = Date.UTC(a2, m2 - 1, j2);

  const diff = fin - debut;

  return diff > 0 ? Math.round(diff / 86400000) : 0;
};

const obtenirDatesDuSejour = (arrivee, depart) => {
  const dates = [];

  if (!arrivee || !depart) return dates;

  const [a1, m1, j1] = arrivee.split("-").map(Number);
  const [a2, m2, j2] = depart.split("-").map(Number);

  const date = new Date(a1, m1 - 1, j1);
  const dateFin = new Date(a2, m2 - 1, j2);

  while (date < dateFin) {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, "0");
    const jour = String(date.getDate()).padStart(2, "0");

    dates.push(`${annee}-${mois}-${jour}`);

    date.setDate(date.getDate() + 1);
  }

  return dates;
};

// ==================================================
// RECHERCHE
// ==================================================

const normaliserCriteres = (criteres) => {
  if (!criteres) return null;

  const dateArrivee =
    criteres.date_debut ||
    criteres.dateArrivee ||
    criteres.arrivee ||
    "";

  const dateDepart =
    criteres.date_fin ||
    criteres.dateDepart ||
    criteres.depart ||
    "";

  const nombrePersonnes = Number(
    criteres.adultes ??
    criteres.nombrePersonnes ??
    criteres.voyageurs ??
    1
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

// ==================================================
// ÉQUIPEMENTS
// ==================================================

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
// STATUTS ET PÉRIODES
// ==================================================

const normaliserStatut = (value) => {
  return (
    value === true ||
    value === 1 ||
    ["actif", "active", "1", "true"].includes(
      String(value ?? "").trim().toLowerCase()
    )
  );
};

const dateDansPeriode = (date, debut, fin) => {
  if (!date || !debut || !fin) return false;

  const jour = String(date).slice(0, 10);
  const dateDebut = String(debut).slice(0, 10);
  const dateFin = String(fin).slice(0, 10);

  return jour >= dateDebut && jour <= dateFin;
};

// ==================================================
// CALCUL DES RÉDUCTIONS
// ==================================================

const calculerReduction = (prix, promotion) => {
  const valeur = Number(promotion?.valeur || 0);

  if (!promotion || !Number.isFinite(valeur) || valeur <= 0) {
    return prix;
  }

  if (promotion.type_reduction === "MONTANT_FIXE") {
    return Math.max(0, prix - valeur);
  }

  if (promotion.type_reduction === "POURCENTAGE") {
    return Math.max(0, prix * (1 - valeur / 100));
  }

  return prix;
};

// ==================================================
// IMAGE CHAMBRE AVEC SECOURS AUTOMATIQUE
// ==================================================

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
// PAGE DÉTAIL CHAMBRE
// ==================================================

function DetailChambrePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated } = useAuth();

  // CRITÈRES DE RECHERCHE

  const criteresRecherche = useMemo(
    () => normaliserCriteres(location.state?.criteresRecherche),
    [location.state]
  );

  const chambreTransmise = location.state?.chambre;

  // ÉTATS CHAMBRE

  const [chambre, setChambre] = useState(() => {
    if (
      chambreTransmise &&
      String(chambreTransmise.id) === String(id)
    ) {
      return chambreTransmise;
    }

    return null;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ÉTATS TARIFS

  const [saisons, setSaisons] = useState([]);
  const [promotions, setPromotions] = useState([]);

  const [chargementTarifs, setChargementTarifs] = useState(true);
  const [erreurTarifs, setErreurTarifs] = useState("");

  // ÉTATS RÉSERVATION

  const [arrivee, setArrivee] = useState(
    criteresRecherche?.dateArrivee || ""
  );

  const [depart, setDepart] = useState(
    criteresRecherche?.dateDepart || ""
  );

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

        if (
          chambreTransmise &&
          String(chambreTransmise.id) === String(id)
        ) {
          if (actif) {
            setChambre(chambreTransmise);
          }

          return;
        }

        setChambre(null);

        const response = await getChambres();
        const chambres = extraireListe(response);

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
  // CHARGEMENT SAISONS ET PROMOTIONS
  // VIA LE SERVICE CENTRALISÉ TARIFS API
  // ==================================================

  useEffect(() => {
    let actif = true;

    const chargerTarifs = async () => {
      setChargementTarifs(true);
      setErreurTarifs("");

      try {
        const [saisonsRes, promotionsRes] = await Promise.all([
          tarifsApi.getAllSaisons(),
          tarifsApi.getAllPromotions(),
        ]);

        if (!actif) return;

        setSaisons(extraireListe(saisonsRes));
        setPromotions(extraireListe(promotionsRes));

      } catch (err) {
        console.error(
          "Erreur chargement saisons et promotions :",
          err.response?.data || err
        );

        if (actif) {
          setErreurTarifs(
            "Les tarifs promotionnels sont momentanément indisponibles."
          );

          setSaisons([]);
          setPromotions([]);
        }
      } finally {
        if (actif) {
          setChargementTarifs(false);
        }
      }
    };

    chargerTarifs();

    return () => {
      actif = false;
    };
  }, []);

  // ==================================================
  // SYNCHRONISATION CRITÈRES
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
  // IMAGES
  // ==================================================

  const images = useMemo(
    () => getRoomImages(chambre),
    [chambre]
  );

  // ==================================================
  // ÉQUIPEMENTS
  // ==================================================

  const equipements = useMemo(
    () => extraireEquipements(chambre?.equipements),
    [chambre]
  );

  // ==================================================
  // CAPACITÉ
  // ==================================================

  const capacite = useMemo(() => {
    const valeur =
      chambre?.capacite ??
      chambre?.nombre_personnes ??
      chambre?.nb_personnes ??
      chambre?.capacity ??
      1;

    const nombre = Number(valeur);

    return Number.isFinite(nombre) && nombre > 0
      ? Math.floor(nombre)
      : 1;
  }, [chambre]);

  useEffect(() => {
    if (!chambre) return;

    setVoyageurs((valeur) => {
      const nombre = Number(valeur);

      if (!Number.isFinite(nombre) || nombre < 1) {
        return 1;
      }

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

  // ==================================================
  // CALCUL DU SÉJOUR
  // ==================================================

  const nuits = nombreNuits(arrivee, depart);
  const prixNaturel = Number(chambre?.prix_nuit || 0);
  const nombreVoyageurs = Number(voyageurs);

  const datesSejour = useMemo(
    () => obtenirDatesDuSejour(arrivee, depart),
    [arrivee, depart]
  );

  // ==================================================
  // CALCUL SAISONS ET PROMOTIONS
  // ==================================================

  const detailsPrix = useMemo(() => {
    if (
      !chambre ||
      !Number.isFinite(prixNaturel) ||
      prixNaturel <= 0 ||
      datesSejour.length === 0
    ) {
      return {
        lignes: [],
        total: 0,
        totalNaturel: 0,
        totalAvantPromotion: 0,
        reductionTotale: 0,
        prixMoyen: prixNaturel,
        promotionsUtilisees: [],
      };
    }

    const lignes = datesSejour.map((date) => {
      const saisonsApplicables = saisons
        .filter((saison) =>
          dateDansPeriode(date, saison.date_debut, saison.date_fin)
        )
        .sort(
          (a, b) =>
            new Date(a.date_debut) - new Date(b.date_debut)
        );

      const saison = saisonsApplicables[0] || null;

      const coefficient =
        saison && Number(saison.coefficient) > 0
          ? Number(saison.coefficient)
          : 1;

      const prixSaison = prixNaturel * coefficient;

      const promotionsApplicables = promotions.filter(
        (promotion) => {
          if (
            !normaliserStatut(
              promotion.statut ?? promotion.active
            )
          ) {
            return false;
          }

          if (
            !dateDansPeriode(
              date,
              promotion.date_debut,
              promotion.date_fin
            )
          ) {
            return false;
          }

          if (
            Number(promotion.nuits_min || 1) >
            datesSejour.length
          ) {
            return false;
          }

          if (
            promotion.chambre_id !== null &&
            promotion.chambre_id !== undefined &&
            promotion.chambre_id !== "" &&
            String(promotion.chambre_id) !== String(chambre.id)
          ) {
            return false;
          }

          const valeur = Number(promotion.valeur);

          if (!Number.isFinite(valeur) || valeur <= 0) {
            return false;
          }

          if (
            promotion.type_reduction === "POURCENTAGE" &&
            valeur > 100
          ) {
            return false;
          }

          if (
            !["POURCENTAGE", "MONTANT_FIXE"].includes(
              promotion.type_reduction
            )
          ) {
            return false;
          }

          return true;
        }
      );

      const promotionsTriees = promotionsApplicables
        .map((promotion) => ({
          promotion,
          prix: calculerReduction(prixSaison, promotion),
        }))
        .sort((a, b) => a.prix - b.prix);

      const meilleurePromotion = promotionsTriees[0] || null;

      const prixFinal = meilleurePromotion
        ? meilleurePromotion.prix
        : prixSaison;

      return {
        date,
        saison,
        coefficient,
        prixNaturel,
        prixSaison,
        promotion: meilleurePromotion?.promotion || null,
        prixFinal,
        reduction: prixSaison - prixFinal,
      };
    });

    const total = lignes.reduce(
      (somme, ligne) => somme + ligne.prixFinal,
      0
    );

    const totalNaturel = lignes.reduce(
      (somme, ligne) => somme + ligne.prixNaturel,
      0
    );

    const totalAvantPromotion = lignes.reduce(
      (somme, ligne) => somme + ligne.prixSaison,
      0
    );

    const reductionTotale = totalAvantPromotion - total;

    const promotionsUtilisees = [
      ...new Map(
        lignes
          .filter((ligne) => ligne.promotion)
          .map((ligne) => [
            ligne.promotion.id,
            ligne.promotion,
          ])
      ).values(),
    ];

    return {
      lignes,
      total,
      totalNaturel,
      totalAvantPromotion,
      reductionTotale,
      prixMoyen: total / lignes.length,
      promotionsUtilisees,
    };
  }, [chambre, prixNaturel, datesSejour, saisons, promotions]);

  const sousTotal = detailsPrix.total;

  // ==================================================
  // CARACTÉRISTIQUES
  // ==================================================

  const caracteristiques = chambre
    ? [
        {
          icone: "▢",
          texte: `${chambre.superficie || 0} m²`,
        },
        {
          icone: "☺",
          texte: `${capacite} voyageur(s)`,
        },
        {
          icone: "↕",
          texte: `Étage ${chambre.etage ?? "Non précisé"}`,
        },
        {
          icone: "◐",
          texte: chambre.vue || "Vue non précisée",
        },
        {
          icone: "▭",
          texte: chambre.type || "Type non précisé",
        },
      ]
    : [];

  // ==================================================
  // MODIFICATION DES DATES
  // ==================================================

  const changerArrivee = (nouvelleDate) => {
    setArrivee(nouvelleDate);
    setErreurReservation("");

    if (depart && depart <= nouvelleDate) {
      setDepart(lendemain(nouvelleDate));
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
      setErreurReservation(
        "Veuillez sélectionner les dates de votre séjour."
      );
      return;
    }

    if (arrivee < getDateAujourdhui()) {
      setErreurReservation(
        "La date d'arrivée ne peut pas être dans le passé."
      );
      return;
    }

    if (nuits <= 0) {
      setErreurReservation(
        "La date de départ doit être après la date d'arrivée."
      );
      return;
    }

    if (
      nombreVoyageurs < 1 ||
      nombreVoyageurs > capacite
    ) {
      setErreurReservation(
        `Cette chambre accepte maximum ${capacite} voyageurs.`
      );
      return;
    }

    if (prixNaturel <= 0) {
      setErreurReservation(
        "Le prix de cette chambre est indisponible."
      );
      return;
    }

    if (chargementTarifs || erreurTarifs) {
      setErreurReservation(
        "Impossible de vérifier les tarifs. Veuillez réessayer."
      );
      return;
    }

   navigate("/reservation", {
  state: {
    // Informations de la chambre
    chambreId: chambre.id,
    chambre,

    // Informations du séjour
    dateDebut: arrivee,
    dateFin: depart,
    dateArrivee: arrivee,
    dateDepart: depart,
    nombrePersonnes: nombreVoyageurs,

    // Prix calculés dans DetailChambrePage
    prixNuit: prixNaturel,
    prixTotal: Number(sousTotal.toFixed(2)),
    prixAvantPromotion: Number(
      detailsPrix.totalAvantPromotion.toFixed(2)
    ),
    reductionTotale: Number(
      detailsPrix.reductionTotale.toFixed(2)
    ),

    // Détail des tarifs par nuit
    detailsTarifs: detailsPrix.lignes.map((ligne) => ({
      date: ligne.date,
      prixNaturel: ligne.prixNaturel,
      prixSaison: ligne.prixSaison,
      coefficient: ligne.coefficient,
      saison: ligne.saison?.nom || null,
      prixFinal: ligne.prixFinal,
      reduction: ligne.reduction,
      promotion: ligne.promotion
        ? {
            id: ligne.promotion.id,
            libelle: ligne.promotion.libelle,
            valeur: ligne.promotion.valeur,
            type_reduction: ligne.promotion.type_reduction,
          }
        : null,
    })),

    // Promotions utilisées
    promotionsUtilisees: detailsPrix.promotionsUtilisees.map(
      (promotion) => ({
        id: promotion.id,
        libelle: promotion.libelle,
        valeur: promotion.valeur,
        type_reduction: promotion.type_reduction,
      })
    ),

    // Critères de recherche
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
    return (
      <p className="detail-loading">
        Chargement de la chambre...
      </p>
    );
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
                setIndexActif(
                  (i) => (i + 1) % images.length
                );
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
              {chambre.description ||
                "Aucune description disponible."}
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
              {detailsPrix.promotionsUtilisees.map((promotion) => (
                <span
                  key={promotion.id}
                  className="promotion-nom"
                >
                  Offre : {promotion.libelle}
                </span>
              ))}
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
                      ? lendemain(arrivee)
                      : lendemain(getDateAujourdhui())
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
                value={Math.min(
                  Math.max(1, Number(voyageurs) || 1),
                  capacite
                )}
                onChange={(e) => {
                  setVoyageurs(Number(e.target.value));
                  setErreurReservation("");
                }}
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

            {/* DÉTAIL DES PRIX */}

            <div className="reservation-lignes">
              {chargementTarifs ? (
                <p>Calcul des tarifs...</p>
              ) : erreurTarifs ? (
                <p className="reservation-error">
                  {erreurTarifs}
                </p>
              ) : nuits > 0 ? (
                <>
                  <div>
                    <span>Prix naturel / nuit</span>
                    <span>{formatPrix(prixNaturel)}</span>
                  </div>

                  <h4>Détail des tarifs par nuit</h4>

                  {detailsPrix.lignes.map((ligne, index) => (
                    <div
                      className="reservation-detail-nuit"
                      key={ligne.date}
                    >
                      <span>
                        Nuit {index + 1} –{" "}
                        {formaterDateClient(ligne.date)}
                      </span>

                      <strong>{formatPrix(ligne.prixFinal)}</strong>

                      {ligne.saison && (
                        <small>
                          {ligne.saison.nom} (×{ligne.coefficient})
                        </small>
                      )}

                      {ligne.promotion && (
                        <small className="reservation-remise">
                          {ligne.promotion.libelle} :{" "}
                          {ligne.promotion.type_reduction === "POURCENTAGE"
                            ? `-${ligne.promotion.valeur}%`
                            : `-${formatPrix(ligne.promotion.valeur)}`}
                        </small>
                      )}
                    </div>
                  ))}

                  {detailsPrix.reductionTotale > 0 && (
                    <div className="reservation-economie">
                      <span>Réduction totale</span>
                      <strong>
                        -{formatPrix(detailsPrix.reductionTotale)}
                      </strong>
                    </div>
                  )}

                  <div className="reservation-total">
                    <span>
                      Total du séjour ({nuits} nuit
                      {nuits > 1 ? "s" : ""})
                    </span>
                    <strong>{formatPrix(sousTotal)}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span>Prix par nuit</span>
                    <strong>{formatPrix(prixNaturel)}</strong>
                  </div>

                  <p className="reservation-info">
                    Sélectionnez vos dates pour voir le détail
                    des saisons et des promotions applicables.
                  </p>
                </>
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
              disabled={chargementTarifs || Boolean(erreurTarifs)}
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
