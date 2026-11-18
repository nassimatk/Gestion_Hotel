import { useCallback, useEffect, useState } from "react";
import { tarifsApi, messageErreur } from "../../services/tarifsApi";
import "../tarifs.css";

const mad = (n) =>
  `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n))}`;

// Lit le rôle dans le token JWT (le contrôle réel est fait par l'API : 401 / 403)
function lireRole() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

const STATUTS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// ---------- Section générique : liste + formulaire + modifier / désactiver ----------
function Section({ titre, resource, colonnes, champs, refreshKey, onChange }) {
  const valeursVides = () => Object.fromEntries(champs.map((c) => [c.name, c.defaut ?? ""]));
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(valeursVides());
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState(null);

  const charger = useCallback(async () => {
    try {
      setItems(await tarifsApi.list(resource));
    } catch (err) {
      setMessage({ type: "err", text: messageErreur(err) });
    }
  }, [resource]);

  useEffect(() => {
    charger();
  }, [charger, refreshKey]);

  const reinitialiser = () => {
    setForm(valeursVides());
    setEditId(null);
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    setMessage(null);
    const body = {};
    champs.forEach((c) => {
      if (editId && c.verrouille) return; // champ non modifiable
      body[c.name] = form[c.name] === "" ? null : form[c.name];
    });
    try {
      if (editId) await tarifsApi.update(resource, editId, body);
      else await tarifsApi.create(resource, body);
      setMessage({ type: "ok", text: editId ? "Modification enregistrée." : "Élément ajouté." });
      reinitialiser();
      await charger();
      onChange();
    } catch (err) {
      setMessage({ type: "err", text: messageErreur(err) });
    }
  };

  const modifier = (item) => {
    setEditId(item.id);
    setForm(Object.fromEntries(champs.map((c) => [c.name, item[c.name] ?? ""])));
    setMessage(null);
  };

  const desactiver = async (item) => {
    if (!window.confirm("Désactiver cet élément ?")) return;
    try {
      await tarifsApi.remove(resource, item.id);
      setMessage({ type: "ok", text: "Élément désactivé." });
      await charger();
      onChange();
    } catch (err) {
      setMessage({ type: "err", text: messageErreur(err) });
    }
  };

  return (
    <div className="tf-grid">
      <div className="tf-card" style={{ flex: 1.5 }}>
        <h3>{titre}</h3>
        {items.length === 0 ? (
          <p className="tf-hint">Aucun élément pour l’instant.</p>
        ) : (
          <table className="tf-table">
            <thead>
              <tr>
                {colonnes.map((c) => <th key={c.label}>{c.label}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  {colonnes.map((c) => <td key={c.label}>{c.render(it)}</td>)}
                  <td>
                    <button className="tf-mini" onClick={() => modifier(it)}>Modifier</button>
                    <button className="tf-del" onClick={() => desactiver(it)}>Désactiver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="tf-card">
        <h3>{editId ? "Modifier" : "Ajouter"}</h3>
        {message && <div className={`tf-msg ${message.type}`}>{message.text}</div>}
        <form onSubmit={enregistrer}>
          {champs.map((c, i) => (
            <div key={c.name}>
              <label className="tf-label" style={i === 0 ? { marginTop: 0 } : undefined}>
                {c.label}{c.requis ? " *" : ""}
              </label>
              {c.options ? (
                <select className="tf-input" value={form[c.name]} disabled={editId && c.verrouille}
                  required={c.requis} onChange={(e) => setForm({ ...form, [c.name]: e.target.value })}>
                  {!c.requis && <option value="">{c.vide || "—"}</option>}
                  {c.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input className="tf-input" type={c.type || "text"} step={c.step} min={c.min}
                  value={form[c.name]} required={c.requis} disabled={editId && c.verrouille}
                  onChange={(e) => setForm({ ...form, [c.name]: e.target.value })} />
              )}
            </div>
          ))}
          <button className="tf-btn" type="submit">Enregistrer</button>
          {editId && <button className="tf-btn out" type="button" onClick={reinitialiser}>Annuler</button>}
        </form>
      </div>
    </div>
  );
}

// ---------- Page d'administration ----------
export default function AdminTarifs() {
  const [onglet, setOnglet] = useState("tarifs");
  const [refreshKey, setRefreshKey] = useState(0);
  const [saisons, setSaisons] = useState([]);
  const [tokenSaisi, setTokenSaisi] = useState("");
  const [role, setRole] = useState(lireRole());
  const bump = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    tarifsApi.list("saisons").then(setSaisons).catch(() => setSaisons([]));
  }, [refreshKey]);

  const enregistrerToken = () => {
    localStorage.setItem("token", tokenSaisi.trim());
    setRole(lireRole());
    setTokenSaisi("");
    bump();
  };

  const optionsSaisons = saisons.map((s) => ({ value: s.id, label: s.nom }));

  const sections = {
    tarifs: {
      titre: "Tarifs en vigueur",
      resource: "tarifs",
      colonnes: [
        { label: "Chambre", render: (t) => `Chambre ${t.chambre_id}` },
        { label: "Saison", render: (t) => (t.saison ? t.saison.nom : "Standard") },
        { label: "Prix / nuit", render: (t) => `${mad(t.prix_nuit)} ${t.devise}` },
        { label: "Statut", render: (t) => <span className={`tf-tag ${t.statut === "active" ? "" : "off"}`}>{t.statut}</span> },
      ],
      champs: [
        { name: "chambre_id", label: "Numéro de chambre", type: "number", min: 1, requis: true, verrouille: true },
        { name: "saison_id", label: "Saison (vide = tarif standard)", options: optionsSaisons, vide: "Standard (hors saison)", verrouille: true },
        { name: "prix_nuit", label: "Prix par nuit", type: "number", step: "0.01", min: 0.01, requis: true },
        { name: "devise", label: "Devise", defaut: "MAD", requis: true },
        { name: "statut", label: "Statut", options: STATUTS, defaut: "active", requis: true },
      ],
    },
    saisons: {
      titre: "Saisons",
      resource: "saisons",
      colonnes: [
        { label: "Nom", render: (s) => s.nom },
        { label: "Début", render: (s) => s.date_debut },
        { label: "Fin", render: (s) => s.date_fin },
      ],
      champs: [
        { name: "nom", label: "Nom", requis: true },
        { name: "date_debut", label: "Date de début", type: "date", requis: true },
        { name: "date_fin", label: "Date de fin", type: "date", requis: true },
      ],
    },
    promotions: {
      titre: "Promotions",
      resource: "promotions",
      colonnes: [
        { label: "Libellé", render: (p) => p.libelle },
        { label: "Réduction", render: (p) => (p.type_reduction === "POURCENTAGE" ? `${p.valeur} %` : `${p.valeur} MAD`) },
        { label: "Nuits min.", render: (p) => p.nuits_min },
        { label: "Chambre", render: (p) => (p.chambre_id ? `Chambre ${p.chambre_id}` : "Toutes") },
        { label: "Statut", render: (p) => <span className={`tf-tag ${p.statut === "active" ? "" : "off"}`}>{p.statut}</span> },
      ],
      champs: [
        { name: "libelle", label: "Libellé", requis: true },
        { name: "type_reduction", label: "Type de réduction", requis: true, defaut: "POURCENTAGE",
          options: [{ value: "POURCENTAGE", label: "Pourcentage" }, { value: "MONTANT_FIXE", label: "Montant fixe" }] },
        { name: "valeur", label: "Valeur", type: "number", step: "0.01", min: 0.01, requis: true },
        { name: "nuits_min", label: "Nuits minimum", type: "number", min: 1, defaut: 1 },
        { name: "chambre_id", label: "Chambre (vide = toutes)", type: "number", min: 1 },
        { name: "date_debut", label: "Début de validité", type: "date", requis: true },
        { name: "date_fin", label: "Fin de validité", type: "date", requis: true },
        { name: "statut", label: "Statut", options: STATUTS, defaut: "active", requis: true },
      ],
    },
  };

  return (
    <div className="tf-page">
      <div className="tf-eyebrow">Administration</div>
      <h1 className="tf-title">Gestion des tarifs</h1>
      <p className="tf-sub">Ajoutez, modifiez ou désactivez les tarifs, les saisons et les promotions.</p>

      {role !== "admin" && (
        <div className="tf-msg err">
          Les modifications sont réservées à l’administrateur : connectez-vous avec un compte admin, ou collez un jeton JWT de test ci-dessous.
        </div>
      )}
      <details style={{ marginBottom: 20 }}>
        <summary className="tf-hint" style={{ cursor: "pointer" }}>Jeton JWT de test (développement)</summary>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input className="tf-input" placeholder="eyJ..." value={tokenSaisi} onChange={(e) => setTokenSaisi(e.target.value)} />
          <button className="tf-btn" style={{ marginTop: 0 }} onClick={enregistrerToken}>Enregistrer</button>
        </div>
      </details>

      <div className="tf-tabs">
        {[["tarifs", "Tarifs"], ["saisons", "Saisons"], ["promotions", "Promotions"]].map(([id, label]) => (
          <button key={id} className={`tf-tab ${onglet === id ? "on" : ""}`} onClick={() => setOnglet(id)}>{label}</button>
        ))}
      </div>

      <Section key={onglet} {...sections[onglet]} refreshKey={refreshKey} onChange={bump} />
    </div>
  );
}
