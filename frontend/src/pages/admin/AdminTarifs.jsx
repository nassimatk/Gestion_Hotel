
import { useMemo, useState } from "react";
import "./AdminTarifsPage.css";

// ==========================================
// DONNÉES STATIQUES
// ==========================================

const CHAMBRES = [
  { id: 1, numero: "101", type: "Simple", prix_base: 300 },
  { id: 2, numero: "102", type: "Double", prix_base: 450 },
  { id: 3, numero: "201", type: "Suite", prix_base: 800 },
  { id: 4, numero: "202", type: "Double", prix_base: 500 },
  { id: 5, numero: "301", type: "Familiale", prix_base: 650 },
];

const SAISONS_INITIALES = [
  {
    id: 1,
    nom: "Basse saison",
    coefficient: 0.8,
    date_debut: "2026-01-01",
    date_fin: "2026-03-31",
  },
  {
    id: 2,
    nom: "Moyenne saison",
    coefficient: 1,
    date_debut: "2026-04-01",
    date_fin: "2026-06-30",
  },
  {
    id: 3,
    nom: "Haute saison",
    coefficient: 1.5,
    date_debut: "2026-07-01",
    date_fin: "2026-08-31",
  },
];

const PROMOTIONS_INITIALES = [
  {
    id: 1,
    libelle: "Offre été",
    type_reduction: "POURCENTAGE",
    valeur: 15,
    nuits_min: 2,
    date_debut: "2026-07-01",
    date_fin: "2026-08-31",
    chambre_id: null,
    statut: "active",
  },
  {
    id: 2,
    libelle: "Offre spéciale",
    type_reduction: "MONTANT_FIXE",
    valeur: 50,
    nuits_min: 1,
    date_debut: "2026-04-01",
    date_fin: "2026-06-30",
    chambre_id: 2,
    statut: "active",
  },
];

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

const dateValide = (date) => {
  return date && !Number.isNaN(new Date(date).getTime());
};

const estDansPeriode = (date, debut, fin) => {
  return date >= debut && date <= fin;
};

const calculerPrix = (prixBase, coefficient, promotion) => {
  const prixSaisonnier = prixBase * coefficient;

  if (!promotion) return prixSaisonnier;

  if (promotion.type_reduction === "POURCENTAGE") {
    return prixSaisonnier * (1 - promotion.valeur / 100);
  }

  return Math.max(0, prixSaisonnier - promotion.valeur);
};

const formatPrix = (prix) =>
  `${Number(prix).toFixed(2)} DH`;

const formatDate = (date) =>
  date ? new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR") : "-";

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

export default function AdminTarifsPage() {
  const [onglet, setOnglet] = useState("tarifs");

  const [saisons, setSaisons] = useState(SAISONS_INITIALES);
  const [promotions, setPromotions] = useState(PROMOTIONS_INITIALES);

  const [tarifs, setTarifs] = useState(
    CHAMBRES.map((chambre, index) => ({
      id: index + 1,
      chambre_id: chambre.id,
      numero_chambre: chambre.numero,
      prix_base: chambre.prix_base,
      saison_id: null,
      promotion_id: null,
      statut: "active",
    }))
  );

  const [formTarif, setFormTarif] = useState({
    chambre_id: "",
    saison_id: "",
    promotion_id: "",
    statut: "active",
  });

  const [formSaison, setFormSaison] = useState({
    nom: "",
    coefficient: "1",
    date_debut: "",
    date_fin: "",
  });

  const [formPromotion, setFormPromotion] = useState({
    libelle: "",
    type_reduction: "POURCENTAGE",
    valeur: "",
    nuits_min: "1",
    chambre_id: "",
    date_debut: "",
    date_fin: "",
    statut: "active",
  });

  const [editionTarif, setEditionTarif] = useState(null);
  const [editionSaison, setEditionSaison] = useState(null);
  const [editionPromotion, setEditionPromotion] = useState(null);

  const [erreur, setErreur] = useState("");

  // ==========================================
  // CALCUL DU PRIX D'UN TARIF
  // ==========================================

  const obtenirPrixTarif = (tarif) => {
    const saison = saisons.find(
      (s) => s.id === Number(tarif.saison_id)
    );

    const promotion = promotions.find(
      (p) =>
        p.id === Number(tarif.promotion_id) &&
        p.statut === "active"
    );

    return calculerPrix(
      tarif.prix_base,
      saison?.coefficient ?? 1,
      promotion
    );
  };

  const chambreSelectionnee = CHAMBRES.find(
    (c) => c.id === Number(formTarif.chambre_id)
  );

  const saisonSelectionnee = saisons.find(
    (s) => s.id === Number(formTarif.saison_id)
  );

  const promotionSelectionnee = promotions.find(
    (p) =>
      p.id === Number(formTarif.promotion_id) &&
      p.statut === "active"
  );

  const prixSimule = useMemo(() => {
    if (!chambreSelectionnee) return 0;

    return calculerPrix(
      chambreSelectionnee.prix_base,
      saisonSelectionnee?.coefficient ?? 1,
      promotionSelectionnee
    );
  }, [
    chambreSelectionnee,
    saisonSelectionnee,
    promotionSelectionnee,
  ]);

  // ==========================================
  // GESTION DES TARIFS
  // ==========================================

  const reinitialiserTarif = () => {
    setFormTarif({
      chambre_id: "",
      saison_id: "",
      promotion_id: "",
      statut: "active",
    });
    setEditionTarif(null);
    setErreur("");
  };

  const enregistrerTarif = (e) => {
    e.preventDefault();
    setErreur("");

    const chambre = CHAMBRES.find(
      (c) => c.id === Number(formTarif.chambre_id)
    );

    if (!chambre) {
      setErreur("Veuillez sélectionner une chambre.");
      return;
    }

    const saisonId = formTarif.saison_id
      ? Number(formTarif.saison_id)
      : null;

    const promotionId = formTarif.promotion_id
      ? Number(formTarif.promotion_id)
      : null;

    if (
      tarifs.some(
        (t) =>
          t.chambre_id === chambre.id &&
          t.saison_id === saisonId &&
          t.id !== editionTarif
      )
    ) {
      setErreur("Un tarif existe déjà pour cette chambre et cette saison.");
      return;
    }

    const nouveauTarif = {
      id: editionTarif ?? Date.now(),
      chambre_id: chambre.id,
      numero_chambre: chambre.numero,
      prix_base: chambre.prix_base,
      saison_id: saisonId,
      promotion_id: promotionId,
      statut: formTarif.statut,
    };

    if (editionTarif) {
      setTarifs((anciens) =>
        anciens.map((t) =>
          t.id === editionTarif ? nouveauTarif : t
        )
      );
    } else {
      setTarifs((anciens) => [...anciens, nouveauTarif]);
    }

    reinitialiserTarif();
  };

  const modifierTarif = (tarif) => {
    setEditionTarif(tarif.id);
    setFormTarif({
      chambre_id: String(tarif.chambre_id),
      saison_id: tarif.saison_id ? String(tarif.saison_id) : "",
      promotion_id: tarif.promotion_id
        ? String(tarif.promotion_id)
        : "",
      statut: tarif.statut,
    });
    setOnglet("tarifs");
  };

  const supprimerTarif = (id) => {
    if (window.confirm("Supprimer ce tarif ?")) {
      setTarifs((anciens) => anciens.filter((t) => t.id !== id));
    }
  };

  // ==========================================
  // GESTION DES SAISONS
  // ==========================================

  const enregistrerSaison = (e) => {
    e.preventDefault();
    setErreur("");

    const { nom, coefficient, date_debut, date_fin } = formSaison;
    const coeff = Number(coefficient);

    if (!nom.trim() || !dateValide(date_debut) || !dateValide(date_fin)) {
      setErreur("Veuillez remplir tous les champs.");
      return;
    }

    if (coeff < 0.1 || coeff > 10) {
      setErreur("Le coefficient doit être entre 0.1 et 10.");
      return;
    }

    if (date_fin < date_debut) {
      setErreur("La date de fin doit être après la date de début.");
      return;
    }

    const chevauchement = saisons.some((s) => {
      if (s.id === editionSaison) return false;

      return date_debut <= s.date_fin && date_fin >= s.date_debut;
    });

    if (chevauchement) {
      setErreur("Cette période chevauche une autre saison.");
      return;
    }

    const nouvelleSaison = {
      id: editionSaison ?? Date.now(),
      nom: nom.trim(),
      coefficient: coeff,
      date_debut,
      date_fin,
    };

    setSaisons((anciens) =>
      editionSaison
        ? anciens.map((s) =>
            s.id === editionSaison ? nouvelleSaison : s
          )
        : [...anciens, nouvelleSaison]
    );

    setFormSaison({
      nom: "",
      coefficient: "1",
      date_debut: "",
      date_fin: "",
    });
    setEditionSaison(null);
  };

  const modifierSaison = (saison) => {
    setEditionSaison(saison.id);
    setFormSaison({
      nom: saison.nom,
      coefficient: String(saison.coefficient),
      date_debut: saison.date_debut,
      date_fin: saison.date_fin,
    });
    setOnglet("saisons");
  };

  const supprimerSaison = (id) => {
    if (!window.confirm("Supprimer cette saison ?")) return;

    setSaisons((anciens) => anciens.filter((s) => s.id !== id));

    setTarifs((anciens) =>
      anciens.map((t) =>
        t.saison_id === id ? { ...t, saison_id: null } : t
      )
    );
  };

  // ==========================================
  // GESTION DES PROMOTIONS
  // ==========================================

  const enregistrerPromotion = (e) => {
    e.preventDefault();
    setErreur("");

    const valeur = Number(formPromotion.valeur);
    const nuits = Number(formPromotion.nuits_min);

    if (
      !formPromotion.libelle.trim() ||
      !dateValide(formPromotion.date_debut) ||
      !dateValide(formPromotion.date_fin) ||
      !Number.isFinite(valeur) ||
      valeur <= 0
    ) {
      setErreur("Veuillez remplir correctement tous les champs.");
      return;
    }

    if (formPromotion.date_fin < formPromotion.date_debut) {
      setErreur("La date de fin doit être après la date de début.");
      return;
    }

    if (
      formPromotion.type_reduction === "POURCENTAGE" &&
      valeur >= 100
    ) {
      setErreur("La réduction en pourcentage doit être inférieure à 100.");
      return;
    }

    if (!Number.isInteger(nuits) || nuits < 1) {
      setErreur("Le nombre minimum de nuits doit être supérieur à zéro.");
      return;
    }

    const nouvellePromotion = {
      ...formPromotion,
      id: editionPromotion ?? Date.now(),
      libelle: formPromotion.libelle.trim(),
      valeur,
      nuits_min: nuits,
      chambre_id: formPromotion.chambre_id
        ? Number(formPromotion.chambre_id)
        : null,
    };

    setPromotions((anciennes) =>
      editionPromotion
        ? anciennes.map((p) =>
            p.id === editionPromotion ? nouvellePromotion : p
          )
        : [...anciennes, nouvellePromotion]
    );

    setFormPromotion({
      libelle: "",
      type_reduction: "POURCENTAGE",
      valeur: "",
      nuits_min: "1",
      chambre_id: "",
      date_debut: "",
      date_fin: "",
      statut: "active",
    });

    setEditionPromotion(null);
  };

  const modifierPromotion = (promotion) => {
    setEditionPromotion(promotion.id);
    setFormPromotion({
      ...promotion,
      valeur: String(promotion.valeur),
      nuits_min: String(promotion.nuits_min),
      chambre_id: promotion.chambre_id
        ? String(promotion.chambre_id)
        : "",
    });
    setOnglet("promotions");
  };

  const supprimerPromotion = (id) => {
    if (!window.confirm("Supprimer cette promotion ?")) return;

    setPromotions((anciennes) =>
      anciennes.filter((p) => p.id !== id)
    );

    setTarifs((anciens) =>
      anciens.map((t) =>
        t.promotion_id === id
          ? { ...t, promotion_id: null }
          : t
      )
    );
  };

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <div className="tarifs-page">
      <div className="tarifs-header">
        <div>
          <h1>Gestion des tarifs</h1>
          <p>Gérez les prix, les saisons et les promotions.</p>
        </div>
      </div>

      <div className="tarifs-stats">
        <div className="tarif-stat">
          <span>Tarifs</span>
          <strong>{tarifs.length}</strong>
        </div>
        <div className="tarif-stat">
          <span>Saisons</span>
          <strong>{saisons.length}</strong>
        </div>
        <div className="tarif-stat">
          <span>Promotions actives</span>
          <strong>
            {promotions.filter((p) => p.statut === "active").length}
          </strong>
        </div>
      </div>

      <div className="tarifs-tabs">
        {[
          ["tarifs", "Tarifs"],
          ["saisons", "Saisons"],
          ["promotions", "Promotions"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={onglet === value ? "active" : ""}
            onClick={() => {
              setOnglet(value);
              setErreur("");
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {erreur && <div className="tarifs-error">{erreur}</div>}

      {/* ================================= */}
      {/* ONGLET TARIFS */}
      {/* ================================= */}

      {onglet === "tarifs" && (
        <div className="tarifs-content">
          <form className="tarifs-form" onSubmit={enregistrerTarif}>
            <h2>{editionTarif ? "Modifier le tarif" : "Ajouter un tarif"}</h2>

            <label>Chambre</label>
            <select
              value={formTarif.chambre_id}
              onChange={(e) =>
                setFormTarif({
                  ...formTarif,
                  chambre_id: e.target.value,
                })
              }
              required
            >
              <option value="">Sélectionner une chambre</option>
              {CHAMBRES.map((c) => (
                <option key={c.id} value={c.id}>
                  Chambre {c.numero} - {c.type}
                </option>
              ))}
            </select>

            <label>Prix de base (DH / nuit)</label>
            <input
              value={
                chambreSelectionnee
                  ? formatPrix(chambreSelectionnee.prix_base)
                  : ""
              }
              placeholder="Prix automatique"
              disabled
            />

            <label>Saison</label>
            <select
              value={formTarif.saison_id}
              onChange={(e) =>
                setFormTarif({
                  ...formTarif,
                  saison_id: e.target.value,
                })
              }
            >
              <option value="">Tarif standard (toute l'année)</option>
              {saisons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom} - coefficient {s.coefficient}
                </option>
              ))}
            </select>

            <label>Promotion</label>
            <select
              value={formTarif.promotion_id}
              onChange={(e) =>
                setFormTarif({
                  ...formTarif,
                  promotion_id: e.target.value,
                })
              }
            >
              <option value="">Aucune promotion</option>
              {promotions
                .filter((p) => p.statut === "active")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.libelle} -{" "}
                    {p.type_reduction === "POURCENTAGE"
                      ? `${p.valeur}%`
                      : `${p.valeur} DH`}
                  </option>
                ))}
            </select>

            <label>Statut</label>
            <select
              value={formTarif.statut}
              onChange={(e) =>
                setFormTarif({
                  ...formTarif,
                  statut: e.target.value,
                })
              }
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>

            <div className="tarif-preview">
              <span>Prix final par nuit</span>
              <strong>
                {chambreSelectionnee ? formatPrix(prixSimule) : "--"}
              </strong>
              {chambreSelectionnee && (
                <small>
                  Base : {formatPrix(chambreSelectionnee.prix_base)}
                  {" "}× {saisonSelectionnee?.coefficient ?? 1}
                  {promotionSelectionnee
                    ? ` - ${promotionSelectionnee.libelle}`
                    : ""}
                </small>
              )}
            </div>

            <div className="tarifs-actions">
              <button type="submit" className="btn-primary">
                {editionTarif ? "Modifier" : "Enregistrer"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={reinitialiserTarif}
              >
                Annuler
              </button>
            </div>
          </form>

          <div className="tarifs-table-container">
            <h2>Liste des tarifs</h2>
            <table>
              <thead>
                <tr>
                  <th>Chambre</th>
                  <th>Prix de base</th>
                  <th>Saison</th>
                  <th>Promotion</th>
                  <th>Prix final</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tarifs.map((t) => {
                  const saison = saisons.find(
                    (s) => s.id === t.saison_id
                  );
                  const promotion = promotions.find(
                    (p) => p.id === t.promotion_id
                  );

                  return (
                    <tr key={t.id}>
                      <td>{t.numero_chambre}</td>
                      <td>{formatPrix(t.prix_base)}</td>
                      <td>{saison?.nom ?? "Standard"}</td>
                      <td>{promotion?.libelle ?? "Aucune"}</td>
                      <td>
                        <strong>{formatPrix(obtenirPrixTarif(t))}</strong>
                      </td>
                      <td>
                        <span className={`status ${t.statut}`}>
                          {t.statut === "active" ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => modifierTarif(t)}>Modifier</button>
                        <button onClick={() => supprimerTarif(t.id)}>
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================= */}
      {/* ONGLET SAISONS */}
      {/* ================================= */}

      {onglet === "saisons" && (
        <div className="tarifs-content">
          <form className="tarifs-form" onSubmit={enregistrerSaison}>
            <h2>{editionSaison ? "Modifier la saison" : "Ajouter une saison"}</h2>

            <label>Nom de la saison</label>
            <input
              value={formSaison.nom}
              onChange={(e) =>
                setFormSaison({ ...formSaison, nom: e.target.value })
              }
              placeholder="Ex. Haute saison"
              required
            />

            <label>Coefficient</label>
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={formSaison.coefficient}
              onChange={(e) =>
                setFormSaison({
                  ...formSaison,
                  coefficient: e.target.value,
                })
              }
              required
            />

            <label>Date de début</label>
            <input
              type="date"
              value={formSaison.date_debut}
              onChange={(e) =>
                setFormSaison({
                  ...formSaison,
                  date_debut: e.target.value,
                })
              }
              required
            />

            <label>Date de fin</label>
            <input
              type="date"
              value={formSaison.date_fin}
              onChange={(e) =>
                setFormSaison({
                  ...formSaison,
                  date_fin: e.target.value,
                })
              }
              required
            />

            <div className="tarifs-actions">
              <button className="btn-primary" type="submit">
                {editionSaison ? "Modifier" : "Enregistrer"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditionSaison(null);
                  setFormSaison({
                    nom: "",
                    coefficient: "1",
                    date_debut: "",
                    date_fin: "",
                  });
                  setErreur("");
                }}
              >
                Annuler
              </button>
            </div>
          </form>

          <div className="tarifs-table-container">
            <h2>Liste des saisons</h2>
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Coefficient</th>
                  <th>Date de début</th>
                  <th>Date de fin</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {saisons.map((s) => (
                  <tr key={s.id}>
                    <td>{s.nom}</td>
                    <td>× {s.coefficient}</td>
                    <td>{formatDate(s.date_debut)}</td>
                    <td>{formatDate(s.date_fin)}</td>
                    <td>
                      <button onClick={() => modifierSaison(s)}>Modifier</button>
                      <button onClick={() => supprimerSaison(s.id)}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================= */}
      {/* ONGLET PROMOTIONS */}
      {/* ================================= */}

      {onglet === "promotions" && (
        <div className="tarifs-content">
          <form className="tarifs-form" onSubmit={enregistrerPromotion}>
            <h2>
              {editionPromotion ? "Modifier la promotion" : "Ajouter une promotion"}
            </h2>

            <label>Nom de la promotion</label>
            <input
              value={formPromotion.libelle}
              onChange={(e) =>
                setFormPromotion({
                  ...formPromotion,
                  libelle: e.target.value,
                })
              }
              placeholder="Ex. Offre été"
              required
            />

            <label>Chambre concernée</label>
            <select
              value={formPromotion.chambre_id}
              onChange={(e) =>
                setFormPromotion({
                  ...formPromotion,
                  chambre_id: e.target.value,
                })
              }
            >
              <option value="">Toutes les chambres</option>
              {CHAMBRES.map((c) => (
                <option key={c.id} value={c.id}>
                  Chambre {c.numero}
                </option>
              ))}
            </select>

            <label>Type de réduction</label>
            <select
              value={formPromotion.type_reduction}
              onChange={(e) =>
                setFormPromotion({
                  ...formPromotion,
                  type_reduction: e.target.value,
                })
              }
            >
              <option value="POURCENTAGE">Pourcentage (%)</option>
              <option value="MONTANT_FIXE">Montant fixe (DH)</option>
            </select>

            <label>Valeur de réduction</label>
            <input
              type="number"
              min="0.01"
              max={
                formPromotion.type_reduction === "POURCENTAGE"
                  ? 99.99
                  : undefined
              }
              step="0.01"
              value={formPromotion.valeur}
              onChange={(e) =>
                setFormPromotion({
                  ...formPromotion,
                  valeur: e.target.value,
                })
              }
              required
            />

            <label>Nombre minimum de nuits</label>
            <input
              type="number"
              min="1"
              step="1"
              value={formPromotion.nuits_min}
              onChange={(e) =>
                setFormPromotion({
                  ...formPromotion,
                  nuits_min: e.target.value,
                })
              }
              required
            />

            <label>Date de début</label>
            <input
              type="date"
              value={formPromotion.date_debut}
              onChange={(e) =>
                setFormPromotion({
                  ...formPromotion,
                  date_debut: e.target.value,
                })
              }
              required
            />

            <label>Date de fin</label>
            <input
              type="date"
              value={formPromotion.date_fin}
              onChange={(e) =>
                setFormPromotion({
                  ...formPromotion,
                  date_fin: e.target.value,
                })
              }
              required
            />

            <label>Statut</label>
            <select
              value={formPromotion.statut}
              onChange={(e) =>
                setFormPromotion({
                  ...formPromotion,
                  statut: e.target.value,
                })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <div className="tarifs-actions">
              <button type="submit" className="btn-primary">
                {editionPromotion ? "Modifier" : "Enregistrer"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditionPromotion(null);
                  setFormPromotion({
                    libelle: "",
                    type_reduction: "POURCENTAGE",
                    valeur: "",
                    nuits_min: "1",
                    chambre_id: "",
                    date_debut: "",
                    date_fin: "",
                    statut: "active",
                  });
                  setErreur("");
                }}
              >
                Annuler
              </button>
            </div>
          </form>

          <div className="tarifs-table-container">
            <h2>Liste des promotions</h2>
            <table>
              <thead>
                <tr>
                  <th>Promotion</th>
                  <th>Chambre</th>
                  <th>Réduction</th>
                  <th>Nuits min.</th>
                  <th>Période</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((p) => (
                  <tr key={p.id}>
                    <td>{p.libelle}</td>
                    <td>
                      {p.chambre_id
                        ? CHAMBRES.find((c) => c.id === p.chambre_id)?.numero
                        : "Toutes"}
                    </td>
                    <td>
                      {p.type_reduction === "POURCENTAGE"
                        ? `${p.valeur}%`
                        : `${p.valeur} DH`}
                    </td>
                    <td>{p.nuits_min}</td>
                    <td>
                      {formatDate(p.date_debut)} - {formatDate(p.date_fin)}
                    </td>
                    <td>
                      <span className={`status ${p.statut}`}>
                        {p.statut === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => modifierPromotion(p)}>
                        Modifier
                      </button>
                      <button onClick={() => supprimerPromotion(p.id)}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
