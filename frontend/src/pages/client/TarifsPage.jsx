import React, { useEffect, useMemo, useState } from "react";

const CHAMBRES_API = "http://localhost:8001/api/chambres";

const styles = {
  card: {
    maxWidth: "540px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    border: "1px solid #e6e2da",
    borderRadius: "14px",
    padding: "24px",
    boxShadow: "0 6px 20px rgba(15, 23, 42, 0.05)",
    fontFamily: "system-ui, -apple-system, sans-serif",
    color: "#1e293b",
  },
  title: {
    margin: "0 0 18px 0",
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
  },
  group: {
    marginBottom: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
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
    backgroundColor: "#fff",
  },
  select: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    color: "#0f172a",
    backgroundColor: "#fff",
  },
  priceBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    borderRadius: "10px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    marginBottom: "16px",
    fontSize: "14px",
  },
  summaryBox: {
    padding: "16px",
    borderRadius: "12px",
    backgroundColor: "#f4f1ea",
    border: "1px solid #e2dccf",
    marginTop: "8px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    marginBottom: "8px",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    paddingTop: "10px",
    borderTop: "1px solid #dcd5c5",
  },
  error: {
    color: "#b91c1c",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    marginTop: "4px",
  },
};

function trouverSaisonPourDate(saisons, dateStr) {
  if (!dateStr || !Array.isArray(saisons)) return null;
  const dateChoisie = new Date(dateStr);
  return (
    saisons.find((s) => {
      if (!s.date_debut || !s.date_fin) return false;
      return (
        dateChoisie >= new Date(s.date_debut) &&
        dateChoisie <= new Date(s.date_fin)
      );
    }) || null
  );
}

export default function SimulateurPrixClient({
  saisons = [],
  promotions = [],
}) {
  const [numeroChambre, setNumeroChambre] = useState("");
  const [chambre, setChambre] = useState(null);
  const [prixBase, setPrixBase] = useState(0);
  const [dateArrivee, setDateArrivee] = useState("");
  const [nuitees, setNuitees] = useState(1);
  const [saisonManuelleId, setSaisonManuelleId] = useState("");
  const [promotionId, setPromotionId] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const num = numeroChambre.trim();
    if (!num) {
      setChambre(null);
      setPrixBase(0);
      setErreur("");
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(CHAMBRES_API);
        if (!res.ok) throw new Error("Erreur service chambres");
        const json = await res.json();
        const liste = Array.isArray(json) ? json : json.data || [];

        const match = liste.find(
          (c) =>
            String(c.numero ?? c.numero_chambre ?? c.code ?? "")
              .trim()
              .toLowerCase() === num.toLowerCase()
        );

        if (cancelled) return;
        if (!match) {
          setChambre(null);
          setPrixBase(0);
          setErreur(`Chambre "${num}" introuvable.`);
        } else {
          setErreur("");
          setChambre(match);
          setPrixBase(
            Number(match.prix_nuit ?? match.prix ?? match.tarif_base ?? 0)
          );
        }
      } catch {
        if (!cancelled) {
          setChambre(null);
          setPrixBase(0);
          setErreur("Service Chambres indisponible.");
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [numeroChambre]);

  const calcul = useMemo(() => {
    const saisonDate = trouverSaisonPourDate(saisons, dateArrivee);
    const saisonManuelle = saisons.find(
      (s) => String(s.id) === String(saisonManuelleId)
    );
    const saisonActive = saisonDate || saisonManuelle || null;

    const coeff = Number(saisonActive?.coefficient ?? 1);
    const promoObj = promotions.find(
      (p) => String(p.id) === String(promotionId)
    );
    const remise = Number(
      promoObj?.pourcentage ?? promoObj?.reduction ?? promoObj?.remise ?? 0
    );
    const nbNuits = Math.max(1, Number(nuitees || 1));

    const nuitAvecSaison = prixBase * coeff;
    const nuitFinale = nuitAvecSaison * (1 - remise / 100);
    const total = nuitFinale * nbNuits;

    return {
      saisonNom: saisonActive?.nom || "Standard",
      coeff,
      remise,
      nbNuits,
      nuitFinale: Number(nuitFinale.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }, [
    prixBase,
    saisons,
    dateArrivee,
    saisonManuelleId,
    promotions,
    promotionId,
    nuitees,
  ]);

  const devise = chambre?.devise || "MAD";

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Estimation du séjour</h2>

      <div style={styles.group}>
        <label style={styles.label}>Numéro de chambre</label>
        <input
          type="text"
          style={styles.input}
          value={numeroChambre}
          onChange={(e) => setNumeroChambre(e.target.value)}
          placeholder="Entrez votre numéro de chambre"
        />
        {erreur && <div style={styles.error}>{erreur}</div>}
      </div>

      {chambre && (
        <>
          <div style={styles.priceBanner}>
            <span>
              Chambre{" "}
              <strong>{chambre.titre || chambre.nom || numeroChambre}</strong>
            </span>
            <strong>
              {prixBase.toFixed(2)} {devise} / nuit
            </strong>
          </div>

          <div style={styles.grid2}>
            <div style={styles.group}>
              <label style={styles.label}>Date d'arrivée</label>
              <input
                type="date"
                style={styles.input}
                value={dateArrivee}
                onChange={(e) => setDateArrivee(e.target.value)}
              />
            </div>

            <div style={styles.group}>
              <label style={styles.label}>Nombre de nuitées</label>
              <input
                type="number"
                min="1"
                style={styles.input}
                value={nuitees}
                onChange={(e) => setNuitees(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Saison</label>
            <select
              style={styles.select}
              value={saisonManuelleId}
              onChange={(e) => setSaisonManuelleId(e.target.value)}
            >
              <option value="">Automatique selon date / Standard (×1.00)</option>
              {saisons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom} (×{Number(s.coefficient ?? 1).toFixed(2)})
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
                  {p.titre || p.nom || p.code} (-
                  {Number(p.pourcentage ?? p.reduction ?? p.remise ?? 0)}%)
                </option>
              ))}
            </select>
          </div>

          <div style={styles.summaryBox}>
            <div style={styles.row}>
              <span>Saison appliquée</span>
              <strong>
                {calcul.saisonNom} (×{calcul.coeff.toFixed(2)})
              </strong>
            </div>
            <div style={styles.row}>
              <span>Promotion</span>
              <strong>-{calcul.remise}%</strong>
            </div>
            <div style={styles.row}>
              <span>Prix / nuit final</span>
              <strong>
                {calcul.nuitFinale.toFixed(2)} {devise}
              </strong>
            </div>
            <div style={styles.totalRow}>
              <span>Total ({calcul.nbNuits} nuit(s))</span>
              <span>
                {calcul.total.toFixed(2)} {devise}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}