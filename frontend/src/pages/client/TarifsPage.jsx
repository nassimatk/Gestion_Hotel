import { useEffect, useState } from "react";
import { tarifsApi, messageErreur } from "../../services/tarifsApi";
import "../tarifs.css";

const mad = (n) =>
  `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n))} MAD`;

const dateFr = (d) => {
  const [y, m, j] = String(d).slice(0, 10).split("-");
  return `${j}/${m}/${y}`;
};

export default function TarifsPage() {
  // ----- Liste des tarifs -----
  const [tarifs, setTarifs] = useState([]);
  const [filtre, setFiltre] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreurListe, setErreurListe] = useState("");

  const charger = async (chambreId) => {
    setChargement(true);
    setErreurListe("");
    try {
      const params = { statut: "active" };
      if (chambreId) params.chambre_id = chambreId;
      setTarifs(await tarifsApi.list("tarifs", params));
    } catch (err) {
      setErreurListe(messageErreur(err));
    } finally {
      setChargement(false);
    }
  };

  // ----- Saisons et promotions (lecture publique) -----
  const [saisons, setSaisons] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [erreurInfos, setErreurInfos] = useState("");

  useEffect(() => {
    charger("");
    tarifsApi.list("saisons").then(setSaisons).catch((err) => setErreurInfos(messageErreur(err)));
    tarifsApi.list("promotions", { statut: "active" }).then(setPromotions).catch((err) => setErreurInfos(messageErreur(err)));
  }, []);

  // ----- Calcul du prix -----
  const [form, setForm] = useState({ chambre_id: "", arrivee: "", depart: "" });
  const [resultat, setResultat] = useState(null);
  const [erreurCalcul, setErreurCalcul] = useState("");

  const calculer = async (e) => {
    e.preventDefault();
    setResultat(null);
    setErreurCalcul("");
    try {
      setResultat(await tarifsApi.calculer(form));
    } catch (err) {
      setErreurCalcul(messageErreur(err));
    }
  };

  const remise = resultat ? Number(resultat.sous_total) - Number(resultat.prix_total) : 0;

  return (
    <div className="tf-page">
      <div className="tf-eyebrow">Tarification</div>
      <h1 className="tf-title">Nos tarifs par chambre</h1>
      <p className="tf-sub">Consultez les prix par nuit selon la saison et calculez le prix de votre séjour.</p>

      <div className="tf-grid">
        <div className="tf-card" style={{ flex: 1.4 }}>
          <h3>Liste des tarifs</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              charger(filtre);
            }}
            style={{ display: "flex", gap: 12, alignItems: "flex-end" }}
          >
            <div style={{ flex: 1 }}>
              <label className="tf-label" style={{ marginTop: 0 }}>Numéro de chambre</label>
              <input
                className="tf-input"
                type="number"
                min="1"
                placeholder="Toutes les chambres"
                value={filtre}
                onChange={(e) => setFiltre(e.target.value)}
              />
            </div>
            <button className="tf-btn" type="submit" style={{ marginTop: 0 }}>Filtrer</button>
          </form>

          {chargement && <p className="tf-hint">Chargement…</p>}
          {erreurListe && <div className="tf-msg err" style={{ marginTop: 14 }}>{erreurListe}</div>}
          {!chargement && !erreurListe && tarifs.length === 0 && <p className="tf-hint">Aucun tarif disponible pour l’instant.</p>}

          {tarifs.length > 0 && (
            <table className="tf-table" style={{ marginTop: 16 }}>
              <thead>
                <tr><th>Chambre</th><th>Saison</th><th>Prix par nuit</th><th>Statut</th></tr>
              </thead>
              <tbody>
                {tarifs.map((t) => (
                  <tr key={t.id}>
                    <td>Chambre {t.chambre_id}</td>
                    <td>{t.saison ? t.saison.nom : "Standard"}</td>
                    <td>{mad(t.prix_nuit)}</td>
                    <td><span className="tf-tag">{t.statut === "active" ? "Active" : "Inactive"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="tf-card">
          <h3>Calculer le prix d’un séjour</h3>
          <form onSubmit={calculer}>
            <label className="tf-label" style={{ marginTop: 0 }}>Numéro de chambre *</label>
            <input className="tf-input" type="number" min="1" required value={form.chambre_id}
              onChange={(e) => setForm({ ...form, chambre_id: e.target.value })} />
            <div className="tf-row">
              <div>
                <label className="tf-label">Arrivée *</label>
                <input className="tf-input" type="date" required value={form.arrivee}
                  onChange={(e) => setForm({ ...form, arrivee: e.target.value })} />
              </div>
              <div>
                <label className="tf-label">Départ *</label>
                <input className="tf-input" type="date" required value={form.depart}
                  onChange={(e) => setForm({ ...form, depart: e.target.value })} />
              </div>
            </div>
            <button className="tf-btn" type="submit">Calculer le prix</button>
          </form>

          {erreurCalcul && <div className="tf-msg err" style={{ marginTop: 16 }}>{erreurCalcul}</div>}

          {resultat && (
            <div className="tf-result">
              <div className="tf-line"><span>Séjour ({resultat.nb_nuits} nuit{resultat.nb_nuits > 1 ? "s" : ""})</span><span>{mad(resultat.sous_total)}</span></div>
              {remise > 0 && (
                <div className="tf-line">
                  <span>Promotion {resultat.promotion_appliquee || ""}</span>
                  <span>− {mad(remise)}</span>
                </div>
              )}
              <div className="tf-total"><span>Total</span><span>{mad(resultat.prix_total)}</span></div>
            </div>
          )}
        </div>
      </div>
      <div className="tf-grid" style={{ marginTop: 26 }}>
        <div className="tf-card">
          <h3>Saisons</h3>
          {saisons.length === 0 ? (
            <p className="tf-hint">Aucune saison définie pour l’instant.</p>
          ) : (
            <table className="tf-table">
              <thead>
                <tr><th>Saison</th><th>Du</th><th>Au</th></tr>
              </thead>
              <tbody>
                {saisons.map((s) => (
                  <tr key={s.id}>
                    <td>{s.nom}</td>
                    <td>{dateFr(s.date_debut)}</td>
                    <td>{dateFr(s.date_fin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="tf-hint">Le prix d’une nuit dépend de la saison qui la couvre.</p>
        </div>

        <div className="tf-card">
          <h3>Promotions en cours</h3>
          {promotions.length === 0 ? (
            <p className="tf-hint">Aucune promotion pour l’instant.</p>
          ) : (
            <table className="tf-table">
              <thead>
                <tr><th>Offre</th><th>Réduction</th><th>Conditions</th><th>Validité</th></tr>
              </thead>
              <tbody>
                {promotions.map((p) => (
                  <tr key={p.id}>
                    <td>{p.libelle}</td>
                    <td>{p.type_reduction === "POURCENTAGE" ? `${Number(p.valeur)} %` : mad(p.valeur)}</td>
                    <td>
                      {p.nuits_min} nuit{p.nuits_min > 1 ? "s" : ""} minimum
                      <br />
                      <span className="tf-hint">{p.chambre_id ? `Chambre ${p.chambre_id}` : "Toutes les chambres"}</span>
                    </td>
                    <td>{dateFr(p.date_debut)} au {dateFr(p.date_fin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {erreurInfos && <div className="tf-msg err" style={{ marginTop: 14 }}>{erreurInfos}</div>}
        </div>
      </div>
    </div>
  );
}