import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminTarifsPage.css";

// =====================================================
// CONFIGURATION API
// =====================================================

const TARIFS_API =
  import.meta.env.VITE_TARIFS_API_URL || "http://localhost:8004/api";

const CHAMBRES_API =
  import.meta.env.VITE_CHAMBRES_API_URL || "http://localhost:8001/api";

const PAGE_SIZE = 8;

const STATUT_ACTIF = "active";
const STATUT_INACTIF = "inactive";

// =====================================================
// FORMULAIRES INITIAUX
// =====================================================

function obtenirDateLocale() {
  const maintenant = new Date();
  const annee = maintenant.getFullYear();
  const mois = String(maintenant.getMonth() + 1).padStart(2, "0");
  const jour = String(maintenant.getDate()).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
}

const EMPTY_TARIF = {
  numero_chambre: "",
  promotion_id: "",
  date_application: obtenirDateLocale(),
  statut: STATUT_ACTIF,
};

const EMPTY_SAISON = {
  nom: "",
  coefficient: 1,
  date_debut: "",
  date_fin: "",
};

const EMPTY_PROMOTION = {
  libelle: "",
  type_reduction: "POURCENTAGE",
  valeur: "",
  nuits_min: 1,
  chambre_id: "",
  date_debut: "",
  date_fin: "",
  statut: STATUT_ACTIF,
};

// =====================================================
// AXIOS
// =====================================================

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    ""
  );
}

const api = axios.create({ timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers.Accept = "application/json";
  config.headers["Content-Type"] = "application/json";

  return config;
});

// =====================================================
// FONCTIONS UTILITAIRES
// =====================================================

function extraireListe(response) {
  let data = response?.data ?? response;

  for (let i = 0; i < 4; i += 1) {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.data)) {
      data = data.data;
      continue;
    }

    if (data?.data && typeof data.data === "object") {
      data = data.data;
      continue;
    }

    break;
  }

  return Array.isArray(data) ? data : [];
}

function extraireErreur(error) {
  const data = error?.response?.data;

  if (data?.errors) {
    return Object.values(data.errors).flat().join(" ");
  }

  return (
    data?.message ||
    data?.error ||
    error?.message ||
    "Une erreur est survenue."
  );
}

function formaterPrix(value) {
  return `${Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MAD`;
}

function formaterDate(value) {
  if (!value) return "—";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("fr-FR");
}

function normaliserStatut(value) {
  if (
    value === true ||
    value === 1 ||
    ["actif", "active", "1", "true"].includes(
      String(value ?? "").trim().toLowerCase()
    )
  ) {
    return STATUT_ACTIF;
  }

  return STATUT_INACTIF;
}

function statutActif(item) {
  return normaliserStatut(item?.statut ?? item?.active) === STATUT_ACTIF;
}

function dateEstDansPeriode(date, debut, fin) {
  if (!date || !debut || !fin) return false;

  const jour = String(date).slice(0, 10);
  const dateDebut = String(debut).slice(0, 10);
  const dateFin = String(fin).slice(0, 10);

  // Les dates ISO YYYY-MM-DD peuvent être comparées directement.
  return jour >= dateDebut && jour <= dateFin;
}

function valeurNumerique(value, valeurParDefaut = 0) {
  const nombre = Number(value);
  return Number.isFinite(nombre) ? nombre : valeurParDefaut;
}

// =====================================================
// GESTION DES CHAMBRES
// =====================================================

function obtenirNumeroChambre(chambre) {
  const numero =
    chambre?.numero ??
    chambre?.numero_chambre ??
    chambre?.num_chambre ??
    chambre?.numeroChambre ??
    chambre?.chambre_numero;

  return numero === null || numero === undefined ? "" : String(numero);
}

function trouverChambreParNumero(chambres, numero) {
  return chambres.find(
    (chambre) => obtenirNumeroChambre(chambre) === String(numero)
  );
}

function nomChambre(chambre) {
  const numero = obtenirNumeroChambre(chambre);
  const type =
    chambre?.type_chambre?.nom ||
    chambre?.type ||
    chambre?.nom ||
    "";

  if (numero && type) return `Chambre ${numero} - ${type}`;
  if (numero) return `Chambre ${numero}`;

  return `Chambre #${chambre?.id ?? "?"}`;
}

function obtenirPrixNaturel(chambre) {
  const prix = valeurNumerique(chambre?.prix_nuit, 0);
  return prix > 0 ? prix : 0;
}

// =====================================================
// GESTION DES SAISONS
// =====================================================

function saisonApplicable(saison, date) {
  if (!saison) return false;

  // Certaines API ne possèdent pas de statut pour les saisons.
  // Si le champ existe, il doit obligatoirement être actif.
  if (
    (saison.statut !== undefined || saison.active !== undefined) &&
    !statutActif(saison)
  ) {
    return false;
  }

  return dateEstDansPeriode(
    date,
    saison.date_debut,
    saison.date_fin
  );
}

function saisonEstActive(saison) {
  return saisonApplicable(saison, obtenirDateLocale());
}

function trouverSaisonApplicable(saisons, date) {
  const saisonsValides = saisons
    .filter((saison) => saisonApplicable(saison, date))
    .sort((a, b) =>
      String(b.date_debut).slice(0, 10).localeCompare(
        String(a.date_debut).slice(0, 10)
      )
    );

  // En cas de périodes qui se chevauchent, on retient
  // la saison dont la date de début est la plus récente.
  return saisonsValides[0] || null;
}

// =====================================================
// GESTION DES PROMOTIONS
// =====================================================

function promotionApplicable(
  promotion,
  chambreId,
  date,
  nombreNuits = 1
) {
  if (!promotion || !statutActif(promotion)) return false;

  if (
    !dateEstDansPeriode(
      date,
      promotion.date_debut,
      promotion.date_fin
    )
  ) {
    return false;
  }

  // Une promotion avec chambre_id = null concerne toutes les chambres.
  // Sinon, elle concerne uniquement la chambre indiquée.
  if (
    promotion.chambre_id !== null &&
    promotion.chambre_id !== undefined &&
    promotion.chambre_id !== ""
  ) {
    if (
      !chambreId ||
      String(promotion.chambre_id) !== String(chambreId)
    ) {
      return false;
    }
  }

  if (
    Number(nombreNuits) <
    Number(promotion.nuits_min || 1)
  ) {
    return false;
  }

  return true;
}

// =====================================================
// CALCUL DU PRIX
// =====================================================

function calculerPrixFinal(prixNaturel, coefficient, promotion) {
  const base = valeurNumerique(prixNaturel, 0);
  const coef = valeurNumerique(coefficient, 1);

  if (base <= 0 || coef <= 0) return 0;

  const prixSaison = base * coef;

  if (!promotion) {
    return Math.max(0, prixSaison);
  }

  const valeur = valeurNumerique(promotion.valeur, 0);
  let prixFinal = prixSaison;

  if (promotion.type_reduction === "MONTANT_FIXE") {
    prixFinal = prixSaison - valeur;
  } else if (promotion.type_reduction === "POURCENTAGE") {
    prixFinal = prixSaison * (1 - valeur / 100);
  }

  return Math.max(0, prixFinal);
}

// =====================================================
// COMPOSANT PRINCIPAL
// =====================================================

export default function AdminTarifsPage() {
  const [tarifs, setTarifs] = useState([]);
  const [saisons, setSaisons] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [chambres, setChambres] = useState([]);

  const [activeTab, setActiveTab] = useState("tarifs");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("tous");
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [tarifForm, setTarifForm] = useState({
    ...EMPTY_TARIF,
  });

  const [saisonForm, setSaisonForm] = useState({
    ...EMPTY_SAISON,
  });

  const [promotionForm, setPromotionForm] = useState({
    ...EMPTY_PROMOTION,
  });

  // ===================================================
  // CHARGEMENT DES DONNÉES
  // ===================================================

  const chargerDonnees = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        tarifsRes,
        saisonsRes,
        promotionsRes,
        chambresRes,
      ] = await Promise.all([
        api.get(`${TARIFS_API}/tarifs`),
        api.get(`${TARIFS_API}/saisons`),
        api.get(`${TARIFS_API}/promotions`),
        api.get(`${CHAMBRES_API}/chambres`),
      ]);

      setTarifs(extraireListe(tarifsRes));
      setSaisons(extraireListe(saisonsRes));
      setPromotions(extraireListe(promotionsRes));
      setChambres(extraireListe(chambresRes));
    } catch (err) {
      console.error(
        "Erreur chargement :",
        err?.response?.data || err
      );
      setError(extraireErreur(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  // ===================================================
  // CHAMBRE SÉLECTIONNÉE
  // ===================================================

  const chambreSelectionnee = useMemo(
    () =>
      trouverChambreParNumero(
        chambres,
        tarifForm.numero_chambre
      ),
    [chambres, tarifForm.numero_chambre]
  );

  const prixNaturel = useMemo(
    () => obtenirPrixNaturel(chambreSelectionnee),
    [chambreSelectionnee]
  );

  // ===================================================
  // SAISON AUTOMATIQUE SELON LA DATE
  // ===================================================

  const saisonSelectionnee = useMemo(
    () =>
      trouverSaisonApplicable(
        saisons,
        tarifForm.date_application
      ),
    [saisons, tarifForm.date_application]
  );

  const coefficientActuel = saisonSelectionnee
    ? valeurNumerique(saisonSelectionnee.coefficient, 1)
    : 1;

  // ===================================================
  // PROMOTION SÉLECTIONNÉE ET VALIDITÉ
  // ===================================================

  const promotionSelectionnee = useMemo(
    () =>
      promotions.find(
        (promotion) =>
          String(promotion.id) ===
          String(tarifForm.promotion_id)
      ) || null,
    [promotions, tarifForm.promotion_id]
  );

  const promotionValide = useMemo(() => {
    if (!promotionSelectionnee || !chambreSelectionnee) {
      return false;
    }

    return promotionApplicable(
      promotionSelectionnee,
      chambreSelectionnee.id,
      tarifForm.date_application,
      1
    );
  }, [
    promotionSelectionnee,
    chambreSelectionnee,
    tarifForm.date_application,
  ]);

  const promotionPourCalcul = promotionValide
    ? promotionSelectionnee
    : null;

  // ===================================================
  // CALCUL AUTOMATIQUE DU PRIX FINAL
  // ===================================================

  const prixPrevisionnel = useMemo(
    () =>
      calculerPrixFinal(
        prixNaturel,
        coefficientActuel,
        promotionPourCalcul
      ),
    [prixNaturel, coefficientActuel, promotionPourCalcul]
  );

  // ===================================================
  // STATISTIQUES
  // ===================================================

  const statistiques = useMemo(() => {
    const tarifsActifs = tarifs.filter(statutActif).length;
    const saisonsActives = saisons.filter(saisonEstActive).length;
    const promotionsActives = promotions.filter(statutActif).length;

    const prixMoyen = tarifs.length
      ? tarifs.reduce(
          (total, tarif) =>
            total + valeurNumerique(tarif.prix_nuit, 0),
          0
        ) / tarifs.length
      : 0;

    return {
      totalTarifs: tarifs.length,
      tarifsActifs,
      saisonsActives,
      promotionsActives,
      prixMoyen,
    };
  }, [tarifs, saisons, promotions]);

  // ===================================================
  // RECHERCHE ET FILTRES
  // ===================================================

  const donneesActuelles = useMemo(() => {
    const liste =
      activeTab === "tarifs"
        ? tarifs
        : activeTab === "saisons"
          ? saisons
          : promotions;

    return liste.filter((item) => {
      const texte = search.toLowerCase().trim();

      const chambre = chambres.find(
        (c) => String(c.id) === String(item.chambre_id)
      );

      const correspondRecherche =
        !texte ||
        [
          item.nom,
          item.libelle,
          item.numero_chambre,
          obtenirNumeroChambre(chambre),
          item.prix_base,
          item.prix_nuit,
          item.valeur,
          item.id,
        ]
          .filter(
            (value) => value !== null && value !== undefined
          )
          .some((value) =>
            String(value).toLowerCase().includes(texte)
          );

      const actif =
        activeTab === "saisons"
          ? saisonEstActive(item)
          : statutActif(item);

      const correspondStatut =
        filterStatut === "tous" ||
        (filterStatut === "actif" && actif) ||
        (filterStatut === "inactif" && !actif);

      return correspondRecherche && correspondStatut;
    });
  }, [
    tarifs,
    saisons,
    promotions,
    chambres,
    activeTab,
    search,
    filterStatut,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(donneesActuelles.length / PAGE_SIZE)
  );

  const donneesPage = donneesActuelles.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, filterStatut]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // ===================================================
  // OUVERTURE DES MODALES
  // ===================================================

  function ouvrirAjout() {
    setEditingItem(null);

    setTarifForm({
      ...EMPTY_TARIF,
      date_application: obtenirDateLocale(),
    });

    setSaisonForm({ ...EMPTY_SAISON });
    setPromotionForm({ ...EMPTY_PROMOTION });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function ouvrirModification(item) {
    setEditingItem(item);
    setError("");
    setSuccess("");

    if (activeTab === "tarifs") {
      const chambre = chambres.find(
        (c) => String(c.id) === String(item.chambre_id)
      );

      setTarifForm({
        numero_chambre:
          item.numero_chambre ||
          obtenirNumeroChambre(chambre),
        promotion_id: item.promotion_id ?? "",
        date_application: item.date_application
          ? String(item.date_application).slice(0, 10)
          : obtenirDateLocale(),
        statut: normaliserStatut(item.statut ?? item.active),
      });
    }

    if (activeTab === "saisons") {
      setSaisonForm({
        nom: item.nom ?? "",
        coefficient: item.coefficient ?? 1,
        date_debut: item.date_debut
          ? String(item.date_debut).slice(0, 10)
          : "",
        date_fin: item.date_fin
          ? String(item.date_fin).slice(0, 10)
          : "",
      });
    }

    if (activeTab === "promotions") {
      setPromotionForm({
        ...EMPTY_PROMOTION,
        ...item,
        libelle: item.libelle ?? "",
        valeur: item.valeur ?? "",
        nuits_min: item.nuits_min ?? 1,
        chambre_id: item.chambre_id ?? "",
        date_debut: item.date_debut
          ? String(item.date_debut).slice(0, 10)
          : "",
        date_fin: item.date_fin
          ? String(item.date_fin).slice(0, 10)
          : "",
        statut: normaliserStatut(item.statut ?? item.active),
      });
    }

    setShowModal(true);
  }

  function fermerModal() {
    if (saving) return;

    setShowModal(false);
    setEditingItem(null);
    setError("");
  }

  // ===================================================
  // MODIFICATION DES FORMULAIRES
  // ===================================================

  function modifierTarif(champ, valeur) {
    setTarifForm((previous) => ({
      ...previous,
      [champ]: valeur,
    }));
  }

  function selectionnerPromotion(promotionId) {
    // Le choix d'une promotion ne modifie jamais la date.
    setTarifForm((previous) => ({
      ...previous,
      promotion_id: promotionId,
    }));
  }

  // ===================================================
  // VALIDATION
  // ===================================================

  function validerFormulaire() {
    if (activeTab === "tarifs") {
      if (!tarifForm.numero_chambre) {
        return "Veuillez sélectionner un numéro de chambre.";
      }

      if (!chambreSelectionnee) {
        return "La chambre sélectionnée est introuvable.";
      }

      if (prixNaturel <= 0) {
        return "Le prix naturel de cette chambre est invalide.";
      }

      if (!tarifForm.date_application) {
        return "Veuillez renseigner la date d'application.";
      }

      if (promotionSelectionnee && !promotionValide) {
        return "La promotion sélectionnée n'est pas applicable à cette chambre ou à cette date. Choisissez une autre promotion ou sélectionnez « Sans promotion ».";
      }

      if (prixPrevisionnel <= 0) {
        return "Le prix final doit être supérieur à zéro.";
      }
    }

    if (activeTab === "saisons") {
      if (!saisonForm.nom.trim()) {
        return "Le nom de la saison est obligatoire.";
      }

      if (
        !Number.isFinite(Number(saisonForm.coefficient)) ||
        Number(saisonForm.coefficient) <= 0
      ) {
        return "Le coefficient doit être supérieur à zéro.";
      }

      if (!saisonForm.date_debut || !saisonForm.date_fin) {
        return "Veuillez renseigner les dates de la saison.";
      }

      if (saisonForm.date_fin < saisonForm.date_debut) {
        return "La date de fin doit être après la date de début.";
      }
    }

    if (activeTab === "promotions") {
      if (!promotionForm.libelle.trim()) {
        return "Le libellé de la promotion est obligatoire.";
      }

      if (
        !Number.isFinite(Number(promotionForm.valeur)) ||
        Number(promotionForm.valeur) <= 0
      ) {
        return "La valeur de la promotion doit être positive.";
      }

      if (
        promotionForm.type_reduction === "POURCENTAGE" &&
        Number(promotionForm.valeur) > 100
      ) {
        return "La réduction ne peut pas dépasser 100%.";
      }

      if (!promotionForm.date_debut || !promotionForm.date_fin) {
        return "Veuillez renseigner les dates de la promotion.";
      }

      if (promotionForm.date_fin < promotionForm.date_debut) {
        return "La date de fin doit être après la date de début.";
      }

      if (Number(promotionForm.nuits_min) < 1) {
        return "Le nombre minimum de nuits doit être au moins égal à 1.";
      }

      if (
        promotionForm.chambre_id &&
        !chambres.some(
          (chambre) =>
            String(chambre.id) === String(promotionForm.chambre_id)
        )
      ) {
        return "La chambre sélectionnée pour cette promotion est introuvable.";
      }
    }

    return "";
  }

  // ===================================================
  // ENREGISTREMENT
  // ===================================================

  async function enregistrer(e) {
    e.preventDefault();

    const validation = validerFormulaire();

    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const base =
      activeTab === "tarifs"
        ? "tarifs"
        : activeTab === "saisons"
          ? "saisons"
          : "promotions";

    let payload = {};

    if (activeTab === "tarifs") {
      // La saison est déterminée par la date d'application.
      // Si aucune saison ne correspond, saison_id = null et coefficient = 1.
      const saison = saisonSelectionnee;
      const promotion = promotionPourCalcul;

      payload = {
        chambre_id: Number(chambreSelectionnee.id),
        numero_chambre: obtenirNumeroChambre(chambreSelectionnee),

        saison_id: saison ? Number(saison.id) : null,
        coefficient_saison: saison
          ? Number(saison.coefficient || 1)
          : 1,

        promotion_id: promotion ? Number(promotion.id) : null,
        promotion_pourcent:
          promotion?.type_reduction === "POURCENTAGE"
            ? Number(promotion.valeur)
            : 0,

        date_application: tarifForm.date_application,
        prix_base: Number(prixNaturel.toFixed(2)),
        prix_nuit: Number(prixPrevisionnel.toFixed(2)),
        devise: "MAD",
        statut: normaliserStatut(tarifForm.statut),
      };
    }

    if (activeTab === "saisons") {
      payload = {
        nom: saisonForm.nom.trim(),
        coefficient: Number(saisonForm.coefficient),
        date_debut: saisonForm.date_debut,
        date_fin: saisonForm.date_fin,
      };
    }

    if (activeTab === "promotions") {
      payload = {
        libelle: promotionForm.libelle.trim(),
        type_reduction: promotionForm.type_reduction,
        valeur: Number(promotionForm.valeur),
        nuits_min: Number(promotionForm.nuits_min || 1),
        chambre_id: promotionForm.chambre_id
          ? Number(promotionForm.chambre_id)
          : null,
        date_debut: promotionForm.date_debut,
        date_fin: promotionForm.date_fin,
        statut: normaliserStatut(promotionForm.statut),
      };
    }

    console.log("Données envoyées au backend :", payload);

    try {
      if (editingItem) {
        await api.put(
          `${TARIFS_API}/${base}/${editingItem.id}`,
          payload
        );
        setSuccess("Modification effectuée avec succès.");
      } else {
        await api.post(`${TARIFS_API}/${base}`, payload);
        setSuccess("Enregistrement effectué avec succès.");
      }

      setShowModal(false);
      setEditingItem(null);

      await chargerDonnees();
    } catch (err) {
      console.error(
        "Erreur API :",
        err?.response?.data || err
      );
      setError(extraireErreur(err));
    } finally {
      setSaving(false);
    }
  }

  // ===================================================
  // SUPPRESSION
  // ===================================================

  async function supprimer(item) {
    const nom = item.nom || item.libelle || `#${item.id}`;

    if (!window.confirm(`Voulez-vous vraiment supprimer "${nom}" ?`)) {
      return;
    }

    setError("");
    setSuccess("");

    const base =
      activeTab === "tarifs"
        ? "tarifs"
        : activeTab === "saisons"
          ? "saisons"
          : "promotions";

    try {
      await api.delete(`${TARIFS_API}/${base}/${item.id}`);
      setSuccess("Suppression effectuée avec succès.");
      await chargerDonnees();
    } catch (err) {
      console.error(
        "Erreur suppression :",
        err?.response?.data || err
      );
      setError(extraireErreur(err));
    }
  }

  // ===================================================
  // AFFICHAGE DES STATUTS
  // ===================================================

  function badgeStatut(item) {
    const actif = statutActif(item);

    return (
      <span className={`tarifs-badge ${actif ? "active" : "inactive"}`}>
        {actif ? "Actif" : "Inactif"}
      </span>
    );
  }

  function badgeStatutSaison(saison) {
    const actif = saisonEstActive(saison);

    return (
      <span className={`tarifs-badge ${actif ? "active" : "inactive"}`}>
        {actif ? "En cours" : "Hors période"}
      </span>
    );
  }

  function nomChambreTarif(tarif) {
    const chambre = chambres.find(
      (item) => String(item.id) === String(tarif.chambre_id)
    );

    return (
      tarif.numero_chambre ||
      (chambre
        ? nomChambre(chambre)
        : `Chambre #${tarif.chambre_id}`)
    );
  }

  // ===================================================
  // CALCUL DU PRIX D'UN TARIF POUR LE TABLEAU
  // ===================================================

  function calculerPrixTarifAffiche(tarif) {
    const chambre = chambres.find(
      (item) => String(item.id) === String(tarif.chambre_id)
    );

    // On privilégie le prix_base enregistré pour conserver
    // la base historique du tarif. Sinon, on utilise le prix chambre.
    const prixBaseEnregistre = valeurNumerique(tarif.prix_base, 0);
    const prixBase =
      prixBaseEnregistre > 0
        ? prixBaseEnregistre
        : obtenirPrixNaturel(chambre);

    const date = tarif.date_application
      ? String(tarif.date_application).slice(0, 10)
      : "";

    const saison = trouverSaisonApplicable(saisons, date);
    const coefficient = saison
      ? valeurNumerique(saison.coefficient, 1)
      : 1;

    const promotion = promotions.find(
      (item) =>
        String(item.id) === String(tarif.promotion_id)
    );

    const promotionValide = promotionApplicable(
      promotion,
      tarif.chambre_id,
      date,
      1
    );

    return calculerPrixFinal(
      prixBase,
      coefficient,
      promotionValide ? promotion : null
    );
  }

  function obtenirSaisonTarif(tarif) {
    return trouverSaisonApplicable(
      saisons,
      tarif.date_application
    );
  }

  function obtenirPromotionTarif(tarif) {
    const promotion = promotions.find(
      (item) =>
        String(item.id) === String(tarif.promotion_id)
    );

    return promotionApplicable(
      promotion,
      tarif.chambre_id,
      tarif.date_application,
      1
    )
      ? promotion
      : null;
  }

  // ===================================================
  // TABLEAU TARIFS
  // ===================================================

  function renderTarifs() {
    return (
      <div className="tarifs-table-wrapper">
        <table className="tarifs-table">
          <thead>
            <tr>
              <th>Chambre</th>
              <th>Prix naturel</th>
              <th>Saison</th>
              <th>Promotion</th>
              <th>Prix final / nuit</th>
              <th>Date d'application</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {donneesPage.length === 0 ? (
              <tr>
                <td colSpan="8" className="tarifs-empty">
                  Aucun tarif trouvé.
                </td>
              </tr>
            ) : (
              donneesPage.map((tarif) => {
                const chambre = chambres.find(
                  (c) =>
                    String(c.id) === String(tarif.chambre_id)
                );

                const saison = obtenirSaisonTarif(tarif);
                const promotion = obtenirPromotionTarif(tarif);

                const prixNaturelChambre =
                  valeurNumerique(tarif.prix_base, 0) > 0
                    ? Number(tarif.prix_base)
                    : chambre
                      ? obtenirPrixNaturel(chambre)
                      : 0;

                const prixCalcule = calculerPrixTarifAffiche(tarif);

                return (
                  <tr key={tarif.id}>
                    <td>
                      <div className="tarifs-room-info">
                        <div className="tarifs-room-icon">🛏</div>
                        <div>
                          <strong>{nomChambreTarif(tarif)}</strong>
                          <small>ID : {tarif.chambre_id}</small>
                        </div>
                      </div>
                    </td>

                    <td>{formaterPrix(prixNaturelChambre)}</td>

                    <td>{saison?.nom || "Sans saison"}</td>

                    <td>
                      {promotion ? (
                        <span className="tarifs-discount">
                          {promotion.type_reduction === "POURCENTAGE"
                            ? `-${promotion.valeur}%`
                            : `-${formaterPrix(promotion.valeur)}`}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>
                      <strong className="tarifs-price">
                        {formaterPrix(prixCalcule)}
                      </strong>
                    </td>

                    <td>{formaterDate(tarif.date_application)}</td>
                    <td>{badgeStatut(tarif)}</td>

                    <td>
                      <div className="tarifs-actions">
                        <button
                          type="button"
                          className="tarifs-action-btn"
                          title="Modifier"
                          onClick={() => ouvrirModification(tarif)}
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          className="tarifs-action-btn delete"
                          title="Supprimer"
                          onClick={() => supprimer(tarif)}
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // ===================================================
  // TABLEAU SAISONS
  // ===================================================

  function renderSaisons() {
    return (
      <div className="tarifs-table-wrapper">
        <table className="tarifs-table">
          <thead>
            <tr>
              <th>Nom de la saison</th>
              <th>Coefficient</th>
              <th>Date de début</th>
              <th>Date de fin</th>
              <th>État actuel</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {donneesPage.length === 0 ? (
              <tr>
                <td colSpan="6" className="tarifs-empty">
                  Aucune saison trouvée.
                </td>
              </tr>
            ) : (
              donneesPage.map((saison) => (
                <tr key={saison.id}>
                  <td>
                    <strong>{saison.nom}</strong>
                  </td>

                  <td>
                    <span className="tarifs-badge season">
                      × {saison.coefficient}
                    </span>
                  </td>

                  <td>{formaterDate(saison.date_debut)}</td>
                  <td>{formaterDate(saison.date_fin)}</td>
                  <td>{badgeStatutSaison(saison)}</td>

                  <td>
                    <div className="tarifs-actions">
                      <button
                        type="button"
                        className="tarifs-action-btn"
                        title="Modifier"
                        onClick={() => ouvrirModification(saison)}
                      >
                        ✎
                      </button>

                      <button
                        type="button"
                        className="tarifs-action-btn delete"
                        title="Supprimer"
                        onClick={() => supprimer(saison)}
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // ===================================================
  // TABLEAU PROMOTIONS
  // ===================================================

  function renderPromotions() {
    return (
      <div className="tarifs-table-wrapper">
        <table className="tarifs-table">
          <thead>
            <tr>
              <th>Promotion</th>
              <th>Type</th>
              <th>Valeur</th>
              <th>Nuits minimum</th>
              <th>Chambre concernée</th>
              <th>Période</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {donneesPage.length === 0 ? (
              <tr>
                <td colSpan="8" className="tarifs-empty">
                  Aucune promotion trouvée.
                </td>
              </tr>
            ) : (
              donneesPage.map((promotion) => {
                const chambrePromo = promotion.chambre_id
                  ? chambres.find(
                      (chambre) =>
                        String(chambre.id) ===
                        String(promotion.chambre_id)
                    )
                  : null;

                return (
                  <tr key={promotion.id}>
                    <td>
                      <strong>{promotion.libelle}</strong>
                    </td>

                    <td>
                      <span className="tarifs-badge promotion">
                        {promotion.type_reduction === "POURCENTAGE"
                          ? "POURCENTAGE"
                          : "MONTANT FIXE"}
                      </span>
                    </td>

                    <td>
                      <strong className="tarifs-discount">
                        {promotion.type_reduction === "POURCENTAGE"
                          ? `${promotion.valeur}%`
                          : formaterPrix(promotion.valeur)}
                      </strong>
                    </td>

                    <td>{promotion.nuits_min || 1}</td>

                    <td>
                      {chambrePromo
                        ? nomChambre(chambrePromo)
                        : promotion.chambre_id
                          ? `Chambre #${promotion.chambre_id}`
                          : "Toutes les chambres"}
                    </td>

                    <td>
                      {formaterDate(promotion.date_debut)}
                      {" - "}
                      {formaterDate(promotion.date_fin)}
                    </td>

                    <td>{badgeStatut(promotion)}</td>

                    <td>
                      <div className="tarifs-actions">
                        <button
                          type="button"
                          className="tarifs-action-btn"
                          title="Modifier"
                          onClick={() => ouvrirModification(promotion)}
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          className="tarifs-action-btn delete"
                          title="Supprimer"
                          onClick={() => supprimer(promotion)}
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // ===================================================
  // FORMULAIRE TARIF
  // ===================================================

  function renderTarifForm() {
    return (
      <form className="tarifs-form" onSubmit={enregistrer}>
        <div className="tarifs-form-group">
          <label>Numéro de chambre *</label>

          <select
            value={tarifForm.numero_chambre}
            onChange={(e) =>
              modifierTarif("numero_chambre", e.target.value)
            }
            required
          >
            <option value="">Sélectionner une chambre</option>

            {chambres.map((chambre) => (
              <option
                key={chambre.id}
                value={obtenirNumeroChambre(chambre)}
              >
                {nomChambre(chambre)}
              </option>
            ))}
          </select>
        </div>

        <div className="tarifs-form-group">
          <label>Prix naturel de la chambre</label>

          <input
            type="text"
            value={
              chambreSelectionnee
                ? formaterPrix(prixNaturel)
                : "Sélectionnez une chambre"
            }
            readOnly
          />
        </div>

        <div className="tarifs-form-group">
          <label>Saison applicable automatiquement</label>

          <input
            type="text"
            value={
              saisonSelectionnee
                ? `${saisonSelectionnee.nom} (×${saisonSelectionnee.coefficient})`
                : "Aucune saison - Prix normal"
            }
            readOnly
          />
        </div>

        <div className="tarifs-form-group">
          <label>Coefficient appliqué</label>

          <input
            type="text"
            value={`× ${coefficientActuel}`}
            readOnly
          />
        </div>

        <div className="tarifs-form-group">
          <label>Promotion applicable</label>

          <select
            value={tarifForm.promotion_id}
            onChange={(e) =>
              selectionnerPromotion(e.target.value)
            }
          >
            <option value="">Sans promotion</option>

            {promotions
              .filter((promotion) => {
                if (!chambreSelectionnee) return false;

                return promotionApplicable(
                  promotion,
                  chambreSelectionnee.id,
                  tarifForm.date_application,
                  1
                );
              })
              .map((promotion) => (
                <option key={promotion.id} value={promotion.id}>
                  {promotion.libelle} (
                  {promotion.type_reduction === "POURCENTAGE"
                    ? `-${promotion.valeur}%`
                    : `-${promotion.valeur} MAD`}
                  )
                </option>
              ))}
          </select>
        </div>

        <div className="tarifs-form-group">
          <label>Date d'application *</label>

          <input
            type="date"
            value={tarifForm.date_application}
            onChange={(e) =>
              modifierTarif("date_application", e.target.value)
            }
            required
          />
        </div>

        <div className="tarifs-form-group">
          <label>Statut</label>

          <select
            value={tarifForm.statut}
            onChange={(e) =>
              modifierTarif("statut", e.target.value)
            }
            required
          >
            <option value={STATUT_ACTIF}>Actif</option>
            <option value={STATUT_INACTIF}>Inactif</option>
          </select>
        </div>

        <div className="tarifs-form-group full">
          <label>Prix final calculé par nuit</label>

          <input
            type="text"
            value={formaterPrix(prixPrevisionnel)}
            readOnly
          />
        </div>

        {promotionSelectionnee && !promotionValide && (
          <div className="tarifs-error full">
            La promotion sélectionnée n'est plus applicable à cette
            chambre ou à cette date. Sélectionnez « Sans promotion »
            ou choisissez une promotion valide.
          </div>
        )}

        {saisonSelectionnee && (
          <div className="tarifs-info full">
            La saison « {saisonSelectionnee.nom} » est appliquée
            automatiquement pour cette date.
          </div>
        )}

        {!saisonSelectionnee && tarifForm.date_application && (
          <div className="tarifs-info full">
            Aucune saison ne couvre cette date : le prix naturel est
            appliqué avec un coefficient ×1.
          </div>
        )}

        <div className="tarifs-form-actions">
          <button
            type="button"
            className="tarifs-btn tarifs-btn-secondary"
            onClick={fermerModal}
            disabled={saving}
          >
            Annuler
          </button>

          <button
            type="submit"
            className="tarifs-btn tarifs-btn-primary"
            disabled={saving}
          >
            {saving
              ? "Enregistrement..."
              : editingItem
                ? "Enregistrer les modifications"
                : "Ajouter le tarif"}
          </button>
        </div>
      </form>
    );
  }

  // ===================================================
  // FORMULAIRE SAISON
  // ===================================================

  function renderSaisonForm() {
    return (
      <form className="tarifs-form" onSubmit={enregistrer}>
        <div className="tarifs-form-group full">
          <label>Nom de la saison *</label>

          <input
            type="text"
            value={saisonForm.nom}
            onChange={(e) =>
              setSaisonForm((previous) => ({
                ...previous,
                nom: e.target.value,
              }))
            }
            placeholder="Ex : Haute saison"
            required
          />
        </div>

        <div className="tarifs-form-group">
          <label>Coefficient tarifaire *</label>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={saisonForm.coefficient}
            onChange={(e) =>
              setSaisonForm((previous) => ({
                ...previous,
                coefficient: e.target.value,
              }))
            }
            placeholder="Ex : 1.5"
            required
          />
        </div>

        <div className="tarifs-form-group">
          <label>Date de début *</label>

          <input
            type="date"
            value={saisonForm.date_debut}
            onChange={(e) =>
              setSaisonForm((previous) => ({
                ...previous,
                date_debut: e.target.value,
              }))
            }
            required
          />
        </div>

        <div className="tarifs-form-group">
          <label>Date de fin *</label>

          <input
            type="date"
            value={saisonForm.date_fin}
            onChange={(e) =>
              setSaisonForm((previous) => ({
                ...previous,
                date_fin: e.target.value,
              }))
            }
            required
          />
        </div>

        <div className="tarifs-form-actions">
          <button
            type="button"
            className="tarifs-btn tarifs-btn-secondary"
            onClick={fermerModal}
            disabled={saving}
          >
            Annuler
          </button>

          <button
            type="submit"
            className="tarifs-btn tarifs-btn-primary"
            disabled={saving}
          >
            {saving
              ? "Enregistrement..."
              : editingItem
                ? "Modifier la saison"
                : "Ajouter la saison"}
          </button>
        </div>
      </form>
    );
  }

  // ===================================================
  // FORMULAIRE PROMOTION
  // ===================================================

  function renderPromotionForm() {
    return (
      <form className="tarifs-form" onSubmit={enregistrer}>
        <div className="tarifs-form-group full">
          <label>Nom de la promotion *</label>

          <input
            type="text"
            value={promotionForm.libelle}
            onChange={(e) =>
              setPromotionForm((previous) => ({
                ...previous,
                libelle: e.target.value,
              }))
            }
            placeholder="Ex : Offre été"
            required
          />
        </div>

        <div className="tarifs-form-group">
          <label>Type de réduction *</label>

          <select
            value={promotionForm.type_reduction}
            onChange={(e) =>
              setPromotionForm((previous) => ({
                ...previous,
                type_reduction: e.target.value,
              }))
            }
            required
          >
            <option value="POURCENTAGE">Pourcentage (%)</option>
            <option value="MONTANT_FIXE">Montant fixe (MAD)</option>
          </select>
        </div>

        <div className="tarifs-form-group">
          <label>Valeur de la réduction *</label>

          <input
            type="number"
            min="0.01"
            step="0.01"
            max={
              promotionForm.type_reduction === "POURCENTAGE"
                ? 100
                : undefined
            }
            value={promotionForm.valeur}
            onChange={(e) =>
              setPromotionForm((previous) => ({
                ...previous,
                valeur: e.target.value,
              }))
            }
            placeholder="Ex : 15"
            required
          />
        </div>

        <div className="tarifs-form-group">
          <label>Nombre minimum de nuits</label>

          <input
            type="number"
            min="1"
            step="1"
            value={promotionForm.nuits_min}
            onChange={(e) =>
              setPromotionForm((previous) => ({
                ...previous,
                nuits_min: e.target.value,
              }))
            }
            required
          />
        </div>

        <div className="tarifs-form-group">
          <label>Chambre concernée</label>

          <select
            value={promotionForm.chambre_id}
            onChange={(e) =>
              setPromotionForm((previous) => ({
                ...previous,
                chambre_id: e.target.value,
              }))
            }
          >
            <option value="">Toutes les chambres</option>

            {chambres.map((chambre) => (
              <option key={chambre.id} value={chambre.id}>
                {nomChambre(chambre)}
              </option>
            ))}
          </select>
        </div>

        <div className="tarifs-form-group">
          <label>Date de début *</label>

          <input
            type="date"
            value={promotionForm.date_debut}
            onChange={(e) =>
              setPromotionForm((previous) => ({
                ...previous,
                date_debut: e.target.value,
              }))
            }
            required
          />
        </div>

        <div className="tarifs-form-group">
          <label>Date de fin *</label>

          <input
            type="date"
            value={promotionForm.date_fin}
            onChange={(e) =>
              setPromotionForm((previous) => ({
                ...previous,
                date_fin: e.target.value,
              }))
            }
            required
          />
        </div>

        <div className="tarifs-form-group">
          <label>Statut</label>

          <select
            value={promotionForm.statut}
            onChange={(e) =>
              setPromotionForm((previous) => ({
                ...previous,
                statut: e.target.value,
              }))
            }
          >
            <option value={STATUT_ACTIF}>Actif</option>
            <option value={STATUT_INACTIF}>Inactif</option>
          </select>
        </div>

        <div className="tarifs-form-actions">
          <button
            type="button"
            className="tarifs-btn tarifs-btn-secondary"
            onClick={fermerModal}
            disabled={saving}
          >
            Annuler
          </button>

          <button
            type="submit"
            className="tarifs-btn tarifs-btn-primary"
            disabled={saving}
          >
            {saving
              ? "Enregistrement..."
              : editingItem
                ? "Modifier la promotion"
                : "Ajouter la promotion"}
          </button>
        </div>
      </form>
    );
  }

  // ===================================================
  // TITRES DES ONGLETS
  // ===================================================

  const titreTab =
    activeTab === "tarifs"
      ? "Gestion des tarifs"
      : activeTab === "saisons"
        ? "Gestion des saisons"
        : "Gestion des promotions";

  const descriptionTab =
    activeTab === "tarifs"
      ? "Consultez et gérez les prix de vos chambres."
      : activeTab === "saisons"
        ? "Définissez les périodes et coefficients tarifaires."
        : "Gérez les offres et réductions de votre hôtel.";

  // ===================================================
  // RENDU PRINCIPAL
  // ===================================================

  return (
    <div className="admin-tarifs-page">
      <header className="tarifs-dashboard-header">
        <div>
          <span className="tarifs-eyebrow">
            HOTELHUB / ADMINISTRATION
          </span>

          <h1>Gestion des tarifs</h1>

          <p>
            Gérez les prix, les saisons et les promotions de votre hôtel.
          </p>
        </div>

        <div className="tarifs-header-actions">
          <button
            type="button"
            className="tarifs-btn tarifs-btn-secondary"
            onClick={chargerDonnees}
            disabled={loading}
          >
            ↻ {loading ? "Actualisation..." : "Actualiser"}
          </button>

          <button
            type="button"
            className="tarifs-btn tarifs-btn-primary"
            onClick={ouvrirAjout}
          >
            + Ajouter{" "}
            {activeTab === "tarifs"
              ? "un tarif"
              : activeTab === "saisons"
                ? "une saison"
                : "une promotion"}
          </button>
        </div>
      </header>

      {error && !showModal && (
        <div className="tarifs-error">
          <span>⚠</span>
          <span>{error}</span>

          <button
            type="button"
            className="tarifs-btn tarifs-btn-secondary"
            onClick={() => setError("")}
          >
            Fermer
          </button>
        </div>
      )}

      {success && (
        <div className="tarifs-success-message">
          ✓ {success}
        </div>
      )}

      <section className="tarifs-dashboard-stats">
        <article className="tarifs-stat-card">
          <div className="tarifs-stat-top">
            <div className="tarifs-stat-icon">◈</div>
            <span className="tarifs-stat-label">
              TOTAL DES TARIFS
            </span>
          </div>

          <strong>{statistiques.totalTarifs}</strong>
          <small>Tarifs enregistrés</small>
        </article>

        <article className="tarifs-stat-card">
          <div className="tarifs-stat-top">
            <div className="tarifs-stat-icon">✓</div>
            <span className="tarifs-stat-label">
              TARIFS ACTIFS
            </span>
          </div>

          <strong>{statistiques.tarifsActifs}</strong>
          <small>Tarifs actuellement actifs</small>
        </article>

        <article className="tarifs-stat-card">
          <div className="tarifs-stat-top">
            <div className="tarifs-stat-icon">✧</div>
            <span className="tarifs-stat-label">
              SAISONS EN COURS
            </span>
          </div>

          <strong>{statistiques.saisonsActives}</strong>
          <small>
            {statistiques.promotionsActives} promotion(s) active(s)
          </small>
        </article>

        <article className="tarifs-stat-card">
          <div className="tarifs-stat-top">
            <div className="tarifs-stat-icon">MAD</div>
            <span className="tarifs-stat-label">
              PRIX MOYEN / NUIT
            </span>
          </div>

          <strong>
            {statistiques.prixMoyen.toLocaleString("fr-FR", {
              maximumFractionDigits: 0,
            })}
          </strong>

          <small>Prix moyen des tarifs enregistrés</small>
        </article>
      </section>

      <nav className="tarifs-tabs">
        <button
          type="button"
          className={`tarifs-tab ${
            activeTab === "tarifs" ? "active" : ""
          }`}
          onClick={() => setActiveTab("tarifs")}
        >
          ◈ Tarifs ({tarifs.length})
        </button>

        <button
          type="button"
          className={`tarifs-tab ${
            activeTab === "saisons" ? "active" : ""
          }`}
          onClick={() => setActiveTab("saisons")}
        >
          ✧ Saisons ({saisons.length})
        </button>

        <button
          type="button"
          className={`tarifs-tab ${
            activeTab === "promotions" ? "active" : ""
          }`}
          onClick={() => setActiveTab("promotions")}
        >
          % Promotions ({promotions.length})
        </button>
      </nav>

      <section className="tarifs-panel">
        <div className="tarifs-panel-header">
          <div>
            <span className="tarifs-section-label">
              HOTELHUB / GESTION COMMERCIALE
            </span>

            <h2>{titreTab}</h2>
            <p>{descriptionTab}</p>
          </div>

          <span className="tarifs-count">
            {donneesActuelles.length} résultat(s)
          </span>
        </div>

        <div className="tarifs-toolbar">
          <div className="tarifs-search">
            <span>⌕</span>

            <input
              type="search"
              placeholder={
                activeTab === "tarifs"
                  ? "Rechercher une chambre..."
                  : activeTab === "saisons"
                    ? "Rechercher une saison..."
                    : "Rechercher une promotion..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
          >
            <option value="tous">Tous les statuts</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
          </select>
        </div>

        {loading ? (
          <div className="tarifs-empty">
            Chargement des données...
          </div>
        ) : (
          <>
            {activeTab === "tarifs" && renderTarifs()}
            {activeTab === "saisons" && renderSaisons()}
            {activeTab === "promotions" && renderPromotions()}
          </>
        )}

        {!loading && (
          <div className="tarifs-pagination">
            <span>
              Affichage de{" "}
              {donneesActuelles.length === 0
                ? 0
                : (page - 1) * PAGE_SIZE + 1}
              {" à "}
              {Math.min(
                page * PAGE_SIZE,
                donneesActuelles.length
              )}
              {" sur "}
              {donneesActuelles.length} résultats
            </span>

            <div className="tarifs-pagination-controls">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((previous) => previous - 1)
                }
                aria-label="Page précédente"
              >
                ‹
              </button>

              <span>
                Page {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((previous) => previous + 1)
                }
                aria-label="Page suivante"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </section>

      {showModal && (
        <div
          className="tarifs-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) fermerModal();
          }}
        >
          <div
            className="tarifs-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tarifs-modal-title"
          >
            <div className="tarifs-modal-header">
              <div>
                <span>
                  HOTELHUB / {editingItem ? "MODIFICATION" : "NOUVEAU"}
                </span>

                <h2 id="tarifs-modal-title">
                  {editingItem ? "Modifier " : "Ajouter "}
                  {activeTab === "tarifs"
                    ? "un tarif"
                    : activeTab === "saisons"
                      ? "une saison"
                      : "une promotion"}
                </h2>
              </div>

              <button
                type="button"
                onClick={fermerModal}
                disabled={saving}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="tarifs-error">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {activeTab === "tarifs" && renderTarifForm()}
            {activeTab === "saisons" && renderSaisonForm()}
            {activeTab === "promotions" && renderPromotionForm()}
          </div>
        </div>
      )}
    </div>
  );
}
