import React, { useEffect, useMemo, useState } from "react";

const CHAMBRES_API = "http://localhost:8001/api/chambres";
const TARIFS_API = "http://localhost:8004/api/tarifs";
const SAISONS_API = "http://localhost:8004/api/saisons";
const PROMOTIONS_API = "http://localhost:8004/api/promotions";

const styles = {
  wrapper: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    color: "#1e293b",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
  },
  tabsBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "12px",
    marginBottom: "22px",
  },
  tabBtn: {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#334155",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },
  tabBtnActive: {
    backgroundColor: "#14273e",
    color: "#ffffff",
    borderColor: "#14273e",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr",
    gap: "24px",
    alignItems: "start",
  },
  gridDates: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e6e2da",
    borderRadius: "12px",
    padding: "22px",
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
  },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  title: {
    margin: 0,
    fontSize: "19px",
    fontWeight: "700",
    color: "#0f172a",
  },
  group: {
    marginBottom: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#475569",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    color: "#0f172a",
    backgroundColor: "#ffffff",
    outline: "none",
  },
  select: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    color: "#0f172a",
    backgroundColor: "#ffffff",
    outline: "none",
  },
  roomCard: {
    padding: "14px",
    borderRadius: "10px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    marginBottom: "16px",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  autoBadgeBox: {
    padding: "10px 12px",
    borderRadius: "8px",
    backgroundColor: "#eef6ff",
    border: "1px solid #bfdbfe",
    color: "#1e3a8a",
    fontSize: "13px",
    marginBottom: "14px",
    lineHeight: "1.5",
  },
  summaryBox: {
    padding: "14px",
    borderRadius: "10px",
    backgroundColor: "#f4f1ea",
    border: "1px solid #e2dccf",
    marginBottom: "16px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    marginBottom: "6px",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    paddingTop: "8px",
    borderTop: "1px solid #dcd5c5",
  },
  btnPrimary: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#14273e",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  btnDanger: {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #fecaca",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  btnCancel: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  actionsCell: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  error: {
    color: "#b91c1c",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "12px",
    whiteSpace: "pre-line",
  },
  success: {
    color: "#166534",
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "12px",
    fontWeight: "600",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    textAlign: "left",
    padding: "10px 8px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "11px",
    textTransform: "uppercase",
    color: "#64748b",
  },
  td: {
    padding: "10px 8px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
  },
  badgeActive: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "999px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    fontSize: "11px",
    fontWeight: "600",
  },
  badgeInactive: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "999px",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    fontSize: "11px",
    fontWeight: "600",
  },
};

function getAuthHeaders() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("jwt") ||
    sessionStorage.getItem("token") ||
    "";
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function parsePrix(val) {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  const cleaned = String(val ?? "").replace(/[^0-9.]/g, "");
  return Number(cleaned) || 0;
}

function getSaisonCoeff(s) {
  return (
    Number(
      s?.coefficient ?? s?.multiplicateur ?? s?.taux ?? s?.coeff ?? 1
    ) || 1
  );
}

function getPromoValeur(p) {
  return (
    Number(
      p?.valeur ??
        p?.pourcentage ??
        p?.reduction ??
        p?.remise ??
        p?.taux ??
        p?.discount ??
        0
    ) || 0
  );
}

function getPromoType(p) {
  const raw = String(p?.type_reduction ?? p?.type ?? "POURCENTAGE").toUpperCase();
  return raw === "MONTANT_FIXE" ? "MONTANT_FIXE" : "POURCENTAGE";
}

function formatPromoLabel(p) {
  const val = getPromoValeur(p);
  if (!val) return "0%";
  return getPromoType(p) === "MONTANT_FIXE" ? `-${val} MAD` : `-${val}%`;
}

function getLabelItem(item, fallback = "Sans nom") {
  return (
    item?.libelle ||
    item?.nom ||
    item?.titre ||
    item?.name ||
    item?.code ||
    fallback
  );
}

function normalizeDateOnly(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function toInputDate(dateInput) {
  if (!dateInput) return "";
  return String(dateInput).slice(0, 10);
}

function findMatchingByDate(items, dateStr) {
  const target = normalizeDateOnly(dateStr);
  if (!target || !Array.isArray(items)) return null;

  return (
    items.find((item) => {
      const start = normalizeDateOnly(
        item.date_debut ?? item.start_date ?? item.dateDebut
      );
      const end = normalizeDateOnly(
        item.date_fin ?? item.end_date ?? item.dateFin
      );
      if (start && end) return target >= start && target <= end;
      if (start && !end) return target >= start;
      if (!start && end) return target <= end;
      return false;
    }) || null
  );
}

function formatApiError(errData, status) {
  if (errData?.errors && typeof errData.errors === "object") {
    const details = Object.entries(errData.errors)
      .map(([champ, msgs]) => `${champ}: ${[].concat(msgs).join(", ")}`)
      .join("\n");
    if (details) return details;
  }
  if (typeof errData === "string" && errData.trim()) {
    return errData.trim();
  }
  return errData?.message || errData?.error || `Erreur HTTP ${status}`;
}

async function sendJsonRequest(url, method, payload = null) {
  const options = {
    method,
    headers: getAuthHeaders(),
  };
  if (payload !== null && method !== "DELETE") {
    options.body = JSON.stringify(payload);
  }

  const res = await fetch(url, options);
  const rawText = await res.text();
  let parsed = {};
  try {
    parsed = rawText ? JSON.parse(rawText) : {};
  } catch {
    parsed = { message: rawText };
  }

  if (!res.ok) {
    throw new Error(formatApiError(parsed, res.status));
  }
  return parsed;
}

export default function AdminGestionTarifsPromotions() {
  const [activeTab, setActiveTab] = useState("tarifs");

  const [chambres, setChambres] = useState([]);
  const [saisons, setSaisons] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [tarifs, setTarifs] = useState([]);

  // --- CRUD TARIFS ---
  const [editingTarifId, setEditingTarifId] = useState(null);
  const [numeroChambre, setNumeroChambre] = useState("");
  const [dateApplication, setDateApplication] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [saisonId, setSaisonId] = useState("");
  const [promotionId, setPromotionId] = useState("");
  const [statut, setStatut] = useState("active");
  const [savingTarif, setSavingTarif] = useState(false);

  // --- CRUD SAISONS ---
  const [editingSaisonId, setEditingSaisonId] = useState(null);
  const [saisonNom, setSaisonNom] = useState("");
  const [saisonCoeff, setSaisonCoeff] = useState("1.00");
  const [saisonDateDebut, setSaisonDateDebut] = useState("");
  const [saisonDateFin, setSaisonDateFin] = useState("");
  const [saisonStatut, setSaisonStatut] = useState("active");
  const [savingSaison, setSavingSaison] = useState(false);

  // --- CRUD PROMOTIONS ---
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [promoLibelle, setPromoLibelle] = useState("");
  const [promoTypeReduction, setPromoTypeReduction] = useState("POURCENTAGE");
  const [promoValeur, setPromoValeur] = useState("");
  const [promoDateDebut, setPromoDateDebut] = useState("");
  const [promoDateFin, setPromoDateFin] = useState("");
  const [promoStatut, setPromoStatut] = useState("active");
  const [savingPromo, setSavingPromo] = useState(false);

  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");

  async function chargerDonnees() {
    const [resCh, resSa, resPr, resTa] = await Promise.allSettled([
      fetch(CHAMBRES_API),
      fetch(SAISONS_API),
      fetch(PROMOTIONS_API),
      fetch(TARIFS_API),
    ]);

    if (resCh.status === "fulfilled" && resCh.value.ok) {
      const d = await resCh.value.json();
      setChambres(Array.isArray(d) ? d : d.data || []);
    }
    if (resSa.status === "fulfilled" && resSa.value.ok) {
      const d = await resSa.value.json();
      setSaisons(Array.isArray(d) ? d : d.data || []);
    }
    if (resPr.status === "fulfilled" && resPr.value.ok) {
      const d = await resPr.value.json();
      setPromotions(Array.isArray(d) ? d : d.data || []);
    }
    if (resTa.status === "fulfilled" && resTa.value.ok) {
      const d = await resTa.value.json();
      setTarifs(Array.isArray(d) ? d : d.data || []);
    }
  }

  useEffect(() => {
    chargerDonnees();
  }, []);

  // Résout toujours le NUMÉRO de chambre (jamais l'ID) pour un tarif enregistré
  function getNumeroFromTarif(tarif) {
    if (tarif?.numero_chambre) {
      return String(tarif.numero_chambre);
    }
    const ch = chambres.find(
      (c) => String(c.id) === String(tarif?.chambre_id)
    );
    return String(ch?.numero ?? ch?.numero_chambre ?? "");
  }

  const saisonAuto = useMemo(
    () => findMatchingByDate(saisons, dateApplication),
    [saisons, dateApplication]
  );
  const promotionAuto = useMemo(
    () => findMatchingByDate(promotions, dateApplication),
    [promotions, dateApplication]
  );

  useEffect(() => {
    if (!editingTarifId) {
      setSaisonId(saisonAuto ? String(saisonAuto.id) : "");
    }
  }, [saisonAuto, editingTarifId]);

  useEffect(() => {
    if (!editingTarifId) {
      setPromotionId(promotionAuto ? String(promotionAuto.id) : "");
    }
  }, [promotionAuto, editingTarifId]);

  const chambreTrouvee = useMemo(() => {
    const num = numeroChambre.trim().toLowerCase();
    if (!num) return null;
    return (
      chambres.find(
        (c) =>
          String(c.numero ?? c.numero_chambre ?? c.code ?? "")
            .trim()
            .toLowerCase() === num
      ) || null
    );
  }, [chambres, numeroChambre]);

  const numChambreVal =
    chambreTrouvee?.numero ??
    chambreTrouvee?.numero_chambre ??
    numeroChambre.trim();

  const typeLabel = chambreTrouvee?.type
    ? chambreTrouvee.type.charAt(0).toUpperCase() + chambreTrouvee.type.slice(1)
    : "";
  const vueLabel = chambreTrouvee?.vue ? `Vue ${chambreTrouvee.vue}` : "";
  const detailsChambre = [typeLabel, vueLabel].filter(Boolean).join(" • ");

  const nomChambre = chambreTrouvee
    ? chambreTrouvee.nom?.trim() ||
      `Chambre ${numChambreVal}${detailsChambre ? ` (${detailsChambre})` : ""}`
    : "";

  const prixChambreActuel = parsePrix(
    chambreTrouvee?.prix_nuit ??
      chambreTrouvee?.prix ??
      chambreTrouvee?.tarif_base ??
      0
  );

  const saisonSelectionnee = saisons.find(
    (s) => String(s.id) === String(saisonId)
  );
  const promotionSelectionnee = promotions.find(
    (p) => String(p.id) === String(promotionId)
  );

  const coefficientSaison = getSaisonCoeff(saisonSelectionnee);
  const valeurPromo = getPromoValeur(promotionSelectionnee);
  const typePromo = getPromoType(promotionSelectionnee);

  const prixApresSaison = prixChambreActuel * coefficientSaison;
  const prixApresPromo =
    typePromo === "MONTANT_FIXE"
      ? Math.max(0, prixApresSaison - valeurPromo)
      : prixApresSaison * (1 - valeurPromo / 100);

  const nouveauPrixChambre = Number(prixApresPromo.toFixed(2));

  const pourcentageEquivalent =
    typePromo === "MONTANT_FIXE" && prixApresSaison > 0
      ? Number(
          Math.min(100, (valeurPromo / prixApresSaison) * 100).toFixed(2)
        )
      : valeurPromo;

  // ==================== HANDLERS TARIFS CRUD ====================
  function resetTarifForm() {
    setEditingTarifId(null);
    setNumeroChambre("");
    setDateApplication(new Date().toISOString().slice(0, 10));
    setSaisonId("");
    setPromotionId("");
    setStatut("active");
  }

  function handleEditTarif(tarif) {
    setErreur("");
    setSucces("");
    setEditingTarifId(tarif.id);
    setNumeroChambre(getNumeroFromTarif(tarif));
    setDateApplication(
      toInputDate(tarif.date_application) || new Date().toISOString().slice(0, 10)
    );
    setSaisonId(tarif.saison_id ? String(tarif.saison_id) : "");
    setPromotionId(tarif.promotion_id ? String(tarif.promotion_id) : "");
    setStatut(tarif.statut || "active");
  }

  async function handleSaveTarif(e) {
    e.preventDefault();
    setErreur("");
    setSucces("");

    if (!chambreTrouvee) {
      setErreur("Veuillez entrer un numéro de chambre valide.");
      return;
    }

    setSavingTarif(true);
    try {
      const chambrePayload = {
        ...chambreTrouvee,
        prix_nuit: nouveauPrixChambre,
      };
      await sendJsonRequest(
        `${CHAMBRES_API}/${chambreTrouvee.id}`,
        "PUT",
        chambrePayload
      );

      const tarifPayload = {
        chambre_id: chambreTrouvee.id,
        numero_chambre: String(numChambreVal),
        saison_id: saisonId ? Number(saisonId) : null,
        coefficient_saison: coefficientSaison,
        promotion_id: promotionId ? Number(promotionId) : null,
        promotion_pourcent: pourcentageEquivalent,
        date_application: dateApplication || null,
        prix_base: prixChambreActuel,
        prix_nuit: nouveauPrixChambre,
        devise: "MAD",
        statut,
      };

      if (editingTarifId) {
        await sendJsonRequest(
          `${TARIFS_API}/${editingTarifId}`,
          "PUT",
          tarifPayload
        );
        setSucces(
          `Tarif mis à jour et chambre "${nomChambre}" réglée à ${nouveauPrixChambre.toFixed(
            2
          )} MAD / nuit.`
        );
      } else {
        await sendJsonRequest(TARIFS_API, "POST", tarifPayload);
        setSucces(
          `Tarif ajouté et chambre "${nomChambre}" réglée à ${nouveauPrixChambre.toFixed(
            2
          )} MAD / nuit.`
        );
      }

      resetTarifForm();
      await chargerDonnees();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setSavingTarif(false);
    }
  }

  async function handleDeleteTarif(id) {
    if (!window.confirm("Supprimer ce tarif ?")) return;
    setErreur("");
    setSucces("");
    try {
      await sendJsonRequest(`${TARIFS_API}/${id}`, "DELETE");
      if (editingTarifId === id) resetTarifForm();
      setSucces("Tarif supprimé avec succès.");
      await chargerDonnees();
    } catch (err) {
      setErreur(err.message);
    }
  }

  // ==================== HANDLERS SAISONS CRUD ====================
  function resetSaisonForm() {
    setEditingSaisonId(null);
    setSaisonNom("");
    setSaisonCoeff("1.00");
    setSaisonDateDebut("");
    setSaisonDateFin("");
    setSaisonStatut("active");
  }

  function handleEditSaison(s) {
    setErreur("");
    setSucces("");
    setEditingSaisonId(s.id);
    setSaisonNom(getLabelItem(s, ""));
    setSaisonCoeff(String(getSaisonCoeff(s)));
    setSaisonDateDebut(toInputDate(s.date_debut));
    setSaisonDateFin(toInputDate(s.date_fin));
    setSaisonStatut(s.statut || "active");
  }

  async function handleSaveSaison(e) {
    e.preventDefault();
    setErreur("");
    setSucces("");
    setSavingSaison(true);

    try {
      const coeffVal = Number(saisonCoeff);
      const payload = {
        nom: saisonNom.trim(),
        coefficient: Number.isFinite(coeffVal) && coeffVal > 0 ? coeffVal : 1,
        date_debut: saisonDateDebut || null,
        date_fin: saisonDateFin || null,
        statut: saisonStatut,
      };

      if (editingSaisonId) {
        await sendJsonRequest(
          `${SAISONS_API}/${editingSaisonId}`,
          "PUT",
          payload
        );
        setSucces("Saison modifiée avec succès.");
      } else {
        await sendJsonRequest(SAISONS_API, "POST", payload);
        setSucces("Saison ajoutée avec succès.");
      }

      resetSaisonForm();
      await chargerDonnees();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setSavingSaison(false);
    }
  }

  async function handleDeleteSaison(id) {
    if (!window.confirm("Supprimer cette saison ?")) return;
    setErreur("");
    setSucces("");
    try {
      await sendJsonRequest(`${SAISONS_API}/${id}`, "DELETE");
      if (editingSaisonId === id) resetSaisonForm();
      setSucces("Saison supprimée avec succès.");
      await chargerDonnees();
    } catch (err) {
      setErreur(err.message);
    }
  }

  // ==================== HANDLERS PROMOTIONS CRUD ====================
  function resetPromoForm() {
    setEditingPromoId(null);
    setPromoLibelle("");
    setPromoTypeReduction("POURCENTAGE");
    setPromoValeur("");
    setPromoDateDebut("");
    setPromoDateFin("");
    setPromoStatut("active");
  }

  function handleEditPromo(p) {
    setErreur("");
    setSucces("");
    setEditingPromoId(p.id);
    setPromoLibelle(getLabelItem(p, ""));
    setPromoTypeReduction(getPromoType(p));
    setPromoValeur(String(getPromoValeur(p)));
    setPromoDateDebut(toInputDate(p.date_debut));
    setPromoDateFin(toInputDate(p.date_fin));
    setPromoStatut(p.statut || "active");
  }

  async function handleSavePromotion(e) {
    e.preventDefault();
    setErreur("");
    setSucces("");
    setSavingPromo(true);

    try {
      const val = Number(promoValeur);
      const payload = {
        libelle: promoLibelle.trim(),
        type_reduction: promoTypeReduction,
        valeur: val,
        date_debut: promoDateDebut || null,
        date_fin: promoDateFin || null,
        statut: promoStatut,
      };

      if (editingPromoId) {
        await sendJsonRequest(
          `${PROMOTIONS_API}/${editingPromoId}`,
          "PUT",
          payload
        );
        setSucces("Promotion modifiée avec succès.");
      } else {
        await sendJsonRequest(PROMOTIONS_API, "POST", payload);
        setSucces("Promotion ajoutée avec succès.");
      }

      resetPromoForm();
      await chargerDonnees();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setSavingPromo(false);
    }
  }

  async function handleDeletePromo(id) {
    if (!window.confirm("Supprimer cette promotion ?")) return;
    setErreur("");
    setSucces("");
    try {
      await sendJsonRequest(`${PROMOTIONS_API}/${id}`, "DELETE");
      if (editingPromoId === id) resetPromoForm();
      setSucces("Promotion supprimée avec succès.");
      await chargerDonnees();
    } catch (err) {
      setErreur(err.message);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.tabsBar}>
        <button
          type="button"
          onClick={() => {
            setErreur("");
            setSucces("");
            setActiveTab("tarifs");
          }}
          style={{
            ...styles.tabBtn,
            ...(activeTab === "tarifs" ? styles.tabBtnActive : {}),
          }}
        >
          Tarifs & Mise à jour Chambre
        </button>
        <button
          type="button"
          onClick={() => {
            setErreur("");
            setSucces("");
            setActiveTab("saisons");
          }}
          style={{
            ...styles.tabBtn,
            ...(activeTab === "saisons" ? styles.tabBtnActive : {}),
          }}
        >
          Saisons
        </button>
        <button
          type="button"
          onClick={() => {
            setErreur("");
            setSucces("");
            setActiveTab("promotions");
          }}
          style={{
            ...styles.tabBtn,
            ...(activeTab === "promotions" ? styles.tabBtnActive : {}),
          }}
        >
          Promotions
        </button>
      </div>

      {erreur && <div style={styles.error}>{erreur}</div>}
      {succes && <div style={styles.success}>{succes}</div>}

      {/* ==================== ONGLET TARIFS CRUD ==================== */}
      {activeTab === "tarifs" && (
        <div style={styles.grid2}>
          <div style={styles.card}>
            <div style={styles.titleRow}>
              <h2 style={styles.title}>
                {editingTarifId
                  ? `Modifier le tarif #${editingTarifId}`
                  : "Appliquer Saison & Promotion sur une chambre"}
              </h2>
              {editingTarifId && (
                <button
                  type="button"
                  style={styles.btnCancel}
                  onClick={resetTarifForm}
                >
                  Annuler
                </button>
              )}
            </div>

            <form onSubmit={handleSaveTarif}>
              <div style={styles.group}>
                <label style={styles.label}>Numéro de chambre *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={numeroChambre}
                  onChange={(e) => setNumeroChambre(e.target.value)}
                  placeholder="Ex. 101 ou 201"
                  required
                />
              </div>

              {numeroChambre.trim() && !chambreTrouvee && (
                <div style={styles.error}>
                  Aucune chambre trouvée avec le numéro "{numeroChambre.trim()}".
                </div>
              )}

              {chambreTrouvee && (
                <div style={styles.roomCard}>
                  <div>
                    Nom de la chambre : <strong>{nomChambre}</strong>
                  </div>
                  <div>
                    Prix actuel de la chambre :{" "}
                    <strong>{prixChambreActuel.toFixed(2)} MAD / nuit</strong>
                  </div>
                </div>
              )}

              <div style={styles.group}>
                <label style={styles.label}>Date d'application</label>
                <input
                  type="date"
                  style={styles.input}
                  value={dateApplication}
                  onChange={(e) => setDateApplication(e.target.value)}
                />
              </div>

              {dateApplication && !editingTarifId && (
                <div style={styles.autoBadgeBox}>
                  <div>
                    Saison détectée pour le <strong>{dateApplication}</strong> :{" "}
                    <strong>
                      {saisonAuto
                        ? getLabelItem(saisonAuto)
                        : "Aucune (Standard)"}
                    </strong>
                  </div>
                  <div>
                    Promotion détectée pour le{" "}
                    <strong>{dateApplication}</strong> :{" "}
                    <strong>
                      {promotionAuto
                        ? `${getLabelItem(promotionAuto)} (${formatPromoLabel(
                            promotionAuto
                          )})`
                        : "Aucune"}
                    </strong>
                  </div>
                </div>
              )}

              <div style={styles.group}>
                <label style={styles.label}>Saison</label>
                <select
                  style={styles.select}
                  value={saisonId}
                  onChange={(e) => setSaisonId(e.target.value)}
                >
                  <option value="">Standard (×1.00)</option>
                  {saisons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {getLabelItem(s)} (×{getSaisonCoeff(s).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.group}>
                <label style={styles.label}>Promotion</label>
                <select
                  style={styles.select}
                  value={promotionId}
                  onChange={(e) => setPromotionId(e.target.value)}
                >
                  <option value="">Aucune promotion</option>
                  {promotions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {getLabelItem(p)} ({formatPromoLabel(p)})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.group}>
                <label style={styles.label}>Statut</label>
                <select
                  style={styles.select}
                  value={statut}
                  onChange={(e) => setStatut(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div style={styles.summaryBox}>
                <div style={styles.row}>
                  <span>Prix chambre actuel</span>
                  <span>{prixChambreActuel.toFixed(2)} MAD</span>
                </div>
                <div style={styles.row}>
                  <span>
                    Saison (
                    {saisonSelectionnee
                      ? getLabelItem(saisonSelectionnee)
                      : "Standard"}{" "}
                    ×{coefficientSaison.toFixed(2)})
                  </span>
                  <span>{prixApresSaison.toFixed(2)} MAD</span>
                </div>
                <div style={styles.row}>
                  <span>Promotion</span>
                  <span>
                    {promotionSelectionnee
                      ? formatPromoLabel(promotionSelectionnee)
                      : "0%"}
                  </span>
                </div>
                <div style={styles.totalRow}>
                  <span>Nouveau prix chambre</span>
                  <span>{nouveauPrixChambre.toFixed(2)} MAD</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!chambreTrouvee || savingTarif}
                style={{
                  ...styles.btnPrimary,
                  ...(!chambreTrouvee || savingTarif ? styles.btnDisabled : {}),
                }}
              >
                {savingTarif
                  ? "Enregistrement..."
                  : editingTarifId
                  ? "Mettre à jour le tarif et la chambre"
                  : "Appliquer directement sur la chambre"}
              </button>
            </form>
          </div>

          <div style={styles.card}>
            <div style={styles.titleRow}>
              <h2 style={styles.title}>Tarifs enregistrés</h2>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>N° Chambre</th>
                  <th style={styles.th}>Saison</th>
                  <th style={styles.th}>Promo</th>
                  <th style={styles.th}>Prix / nuit</th>
                  <th style={styles.th}>Statut</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tarifs.length === 0 ? (
                  <tr>
                    <td style={styles.td} colSpan="6">
                      Aucun tarif enregistré.
                    </td>
                  </tr>
                ) : (
                  tarifs.map((t) => (
                    <tr key={t.id}>
                      <td style={styles.td}>
                        <strong>{getNumeroFromTarif(t) || "—"}</strong>
                      </td>
                      <td style={styles.td}>
                        {t.saison ? getLabelItem(t.saison) : "Standard"}
                      </td>
                      <td style={styles.td}>-{t.promotion_pourcent ?? 0}%</td>
                      <td style={styles.td}>
                        <strong>
                          {Number(t.prix_nuit ?? 0).toFixed(2)} MAD
                        </strong>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={
                            (t.statut || "active") === "active"
                              ? styles.badgeActive
                              : styles.badgeInactive
                          }
                        >
                          {t.statut || "active"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionsCell}>
                          <button
                            type="button"
                            style={styles.btnSecondary}
                            onClick={() => handleEditTarif(t)}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            style={styles.btnDanger}
                            onClick={() => handleDeleteTarif(t.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== ONGLET SAISONS CRUD ==================== */}
      {activeTab === "saisons" && (
        <div style={styles.grid2}>
          <div style={styles.card}>
            <div style={styles.titleRow}>
              <h2 style={styles.title}>
                {editingSaisonId
                  ? `Modifier la saison #${editingSaisonId}`
                  : "Ajouter une saison"}
              </h2>
              {editingSaisonId && (
                <button
                  type="button"
                  style={styles.btnCancel}
                  onClick={resetSaisonForm}
                >
                  Annuler
                </button>
              )}
            </div>

            <form onSubmit={handleSaveSaison}>
              <div style={styles.group}>
                <label style={styles.label}>Nom de la saison *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={saisonNom}
                  onChange={(e) => setSaisonNom(e.target.value)}
                  placeholder="Ex. Haute Saison / Printemps"
                  required
                />
              </div>

              <div style={styles.group}>
                <label style={styles.label}>Coefficient *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  style={styles.input}
                  value={saisonCoeff}
                  onChange={(e) => setSaisonCoeff(e.target.value)}
                  placeholder="Ex. 1.30"
                  required
                />
              </div>

              <div style={styles.gridDates}>
                <div style={styles.group}>
                  <label style={styles.label}>Date de début *</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={saisonDateDebut}
                    onChange={(e) => setSaisonDateDebut(e.target.value)}
                    required
                  />
                </div>
                <div style={styles.group}>
                  <label style={styles.label}>Date de fin *</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={saisonDateFin}
                    onChange={(e) => setSaisonDateFin(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={styles.group}>
                <label style={styles.label}>Statut</label>
                <select
                  style={styles.select}
                  value={saisonStatut}
                  onChange={(e) => setSaisonStatut(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingSaison}
                style={{
                  ...styles.btnPrimary,
                  ...(savingSaison ? styles.btnDisabled : {}),
                }}
              >
                {savingSaison
                  ? "Enregistrement..."
                  : editingSaisonId
                  ? "Mettre à jour la saison"
                  : "Enregistrer la saison"}
              </button>
            </form>
          </div>

          <div style={styles.card}>
            <div style={styles.titleRow}>
              <h2 style={styles.title}>Saisons existantes</h2>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nom</th>
                  <th style={styles.th}>Coeff.</th>
                  <th style={styles.th}>Période</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {saisons.length === 0 ? (
                  <tr>
                    <td style={styles.td} colSpan="4">
                      Aucune saison enregistrée.
                    </td>
                  </tr>
                ) : (
                  saisons.map((s) => (
                    <tr key={s.id}>
                      <td style={styles.td}>
                        <strong>{getLabelItem(s)}</strong>
                      </td>
                      <td style={styles.td}>×{getSaisonCoeff(s).toFixed(2)}</td>
                      <td style={styles.td}>
                        {toInputDate(s.date_debut) || "—"} →{" "}
                        {toInputDate(s.date_fin) || "—"}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionsCell}>
                          <button
                            type="button"
                            style={styles.btnSecondary}
                            onClick={() => handleEditSaison(s)}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            style={styles.btnDanger}
                            onClick={() => handleDeleteSaison(s.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== ONGLET PROMOTIONS CRUD ==================== */}
      {activeTab === "promotions" && (
        <div style={styles.grid2}>
          <div style={styles.card}>
            <div style={styles.titleRow}>
              <h2 style={styles.title}>
                {editingPromoId
                  ? `Modifier la promotion #${editingPromoId}`
                  : "Ajouter une promotion"}
              </h2>
              {editingPromoId && (
                <button
                  type="button"
                  style={styles.btnCancel}
                  onClick={resetPromoForm}
                >
                  Annuler
                </button>
              )}
            </div>

            <form onSubmit={handleSavePromotion}>
              <div style={styles.group}>
                <label style={styles.label}>Libellé de la promotion *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={promoLibelle}
                  onChange={(e) => setPromoLibelle(e.target.value)}
                  placeholder="Ex. WEEKEND"
                  required
                />
              </div>

              <div style={styles.gridDates}>
                <div style={styles.group}>
                  <label style={styles.label}>Type de réduction *</label>
                  <select
                    style={styles.select}
                    value={promoTypeReduction}
                    onChange={(e) => setPromoTypeReduction(e.target.value)}
                  >
                    <option value="POURCENTAGE">Pourcentage (%)</option>
                    <option value="MONTANT_FIXE">Montant fixe (MAD)</option>
                  </select>
                </div>

                <div style={styles.group}>
                  <label style={styles.label}>
                    Valeur ({promoTypeReduction === "MONTANT_FIXE" ? "MAD" : "%"}) *
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    max={promoTypeReduction === "POURCENTAGE" ? "99.99" : undefined}
                    step="0.5"
                    style={styles.input}
                    value={promoValeur}
                    onChange={(e) => setPromoValeur(e.target.value)}
                    placeholder={
                      promoTypeReduction === "MONTANT_FIXE" ? "Ex. 100" : "Ex. 15"
                    }
                    required
                  />
                </div>
              </div>

              <div style={styles.gridDates}>
                <div style={styles.group}>
                  <label style={styles.label}>Date de début *</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={promoDateDebut}
                    onChange={(e) => setPromoDateDebut(e.target.value)}
                    required
                  />
                </div>
                <div style={styles.group}>
                  <label style={styles.label}>Date de fin *</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={promoDateFin}
                    onChange={(e) => setPromoDateFin(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={styles.group}>
                <label style={styles.label}>Statut</label>
                <select
                  style={styles.select}
                  value={promoStatut}
                  onChange={(e) => setPromoStatut(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingPromo}
                style={{
                  ...styles.btnPrimary,
                  ...(savingPromo ? styles.btnDisabled : {}),
                }}
              >
                {savingPromo
                  ? "Enregistrement..."
                  : editingPromoId
                  ? "Mettre à jour la promotion"
                  : "Enregistrer la promotion"}
              </button>
            </form>
          </div>

          <div style={styles.card}>
            <div style={styles.titleRow}>
              <h2 style={styles.title}>Promotions existantes</h2>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Libellé</th>
                  <th style={styles.th}>Réduction</th>
                  <th style={styles.th}>Dates</th>
                  <th style={styles.th}>Statut</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.length === 0 ? (
                  <tr>
                    <td style={styles.td} colSpan="5">
                      Aucune promotion disponible.
                    </td>
                  </tr>
                ) : (
                  promotions.map((p) => (
                    <tr key={p.id}>
                      <td style={styles.td}>
                        <strong>{getLabelItem(p)}</strong>
                      </td>
                      <td style={styles.td}>{formatPromoLabel(p)}</td>
                      <td style={styles.td}>
                        {toInputDate(p.date_debut) || "—"} →{" "}
                        {toInputDate(p.date_fin) || "—"}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={
                            (p.statut || "active") === "active"
                              ? styles.badgeActive
                              : styles.badgeInactive
                          }
                        >
                          {p.statut || "active"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionsCell}>
                          <button
                            type="button"
                            style={styles.btnSecondary}
                            onClick={() => handleEditPromo(p)}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            style={styles.btnDanger}
                            onClick={() => handleDeletePromo(p.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}