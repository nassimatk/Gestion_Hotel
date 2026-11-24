import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  BedDouble,
  CalendarCheck,
  Star,
  Users,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { getAllAvis } from "../../services/avisApi";
import { getAllUsers } from "../../services/authApi";
import { toutesReservations } from "../../services/disponibilitesApi";

import "./AdminDashboard.css";

/* ============================================================
   CONFIGURATION
============================================================ */

const CHAMBRES_API =
  import.meta.env.VITE_CHAMBRES_API_URL || "http://localhost:8001/api";

const SEUIL_VIP = 3;

const api = axios.create({ timeout: 15000 });

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers.Accept = "application/json";
  return config;
});

const PERIODES = [
  { id: "jour", label: "Aujourd'hui" },
  { id: "semaine", label: "Cette semaine" },
  { id: "mois", label: "Mois en cours" },
];

/* ============================================================
   UTILITAIRES
============================================================ */

function extraireListe(response) {
  let data = response?.data ?? response;
  for (let i = 0; i < 4; i += 1) {
    if (Array.isArray(data)) return data;
    if (data?.data && typeof data.data === "object") {
      data = data.data;
      continue;
    }
    if (Array.isArray(data?.value)) return data.value;
    if (Array.isArray(data?.avis)) return data.avis;
    if (Array.isArray(data?.users)) return data.users;
    if (Array.isArray(data?.reservations)) return data.reservations;
    break;
  }
  return Array.isArray(data) ? data : [];
}

function dateLocale(date = new Date()) {
  const a = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const j = String(date.getDate()).padStart(2, "0");
  return `${a}-${m}-${j}`;
}

const jour = (value) => (value ? String(value).slice(0, 10) : "");

function formaterDate(value) {
  if (!value) return "—";
  const d = new Date(`${jour(value)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d
    .toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
    .replace(".", "");
}

function formaterPrix(value) {
  return `${Number(value || 0).toLocaleString("fr-FR", {
    maximumFractionDigits: 0,
  })} MAD`;
}

function num(value, defaut = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : defaut;
}

function nuits(debut, fin) {
  const diff = Math.round(
    (new Date(jour(fin)) - new Date(jour(debut))) / 86400000
  );
  return diff > 0 ? diff : 0;
}

function roleUtilisateur(user) {
  const role =
    user?.role?.name ?? user?.role?.nom ?? user?.role_name ?? user?.role;
  return typeof role === "string" ? role.toLowerCase().trim() : "client";
}

function initiales(nom = "") {
  return (
    nom
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((m) => m[0])
      .join("")
      .toUpperCase() || "?"
  );
}

/* Champs de réservation (snake_case ou camelCase) */
const resDebut = (r) => r.date_debut ?? r.dateDebut;
const resFin = (r) => r.date_fin ?? r.dateFin;
const resChambre = (r) => r.chambre_id ?? r.chambreId;
const resClient = (r) => r.client_id ?? r.clientId ?? r.user_id;
const resMontant = (r) =>
  r.montant_total ?? r.prix_total ?? r.total ?? r.montant ?? null;

function bornesPeriode(periode) {
  const d = new Date();
  if (periode === "jour") return [dateLocale(d), dateLocale(d)];

  if (periode === "semaine") {
    const lundi = new Date(d);
    lundi.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const dimanche = new Date(lundi);
    dimanche.setDate(lundi.getDate() + 6);
    return [dateLocale(lundi), dateLocale(dimanche)];
  }

  return [
    dateLocale(new Date(d.getFullYear(), d.getMonth(), 1)),
    dateLocale(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
  ];
}

/* Statut d'une réservation, tel qu'affiché dans le tableau */
function statutReservation(r, aujourdhui) {
  const s = String(r.statut || "").toUpperCase();
  if (s === "ANNULEE") return { label: "Annulée", tone: "red" };
  if (s === "EN_ATTENTE" || s === "ATTENTE")
    return { label: "En attente", tone: "orange" };
  if (jour(resDebut(r)) <= aujourdhui && aujourdhui < jour(resFin(r)))
    return { label: "Enregistré", tone: "blue" };
  return { label: "Confirmée", tone: "green" };
}

/* ============================================================
   SOUS-COMPOSANTS
============================================================ */

function Skeleton({ width = "60%" }) {
  return <span className="dash-skeleton" style={{ width }} />;
}

function Kpi({ icon: Icon, tone, label, value, trend, hint, loading }) {
  return (
    <article className="dash-kpi">
      <div className="dash-kpi-top">
        <span className="dash-kpi-label">{label}</span>
        <div className={`dash-kpi-icon ${tone}`}>
          <Icon size={16} />
        </div>
      </div>

      <div className="dash-kpi-value">
        {loading ? <Skeleton width="60px" /> : value}
        {!loading && trend && <em>{trend}</em>}
      </div>

      <small>{loading ? <Skeleton width="80%" /> : hint}</small>
    </article>
  );
}

function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <article className={`dash-panel ${className}`}>
      <header className="dash-panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </article>
  );
}

function PanelLink({ to, children }) {
  return (
    <Link to={to} className="dash-panel-link">
      {children}
      <ChevronRight size={14} />
    </Link>
  );
}

function Etoiles({ note }) {
  const n = Math.round(note);
  return (
    <span className="dash-stars" aria-label={`${note} sur 5`}>
      {"★".repeat(n)}
      <i>{"★".repeat(5 - n)}</i>
    </span>
  );
}

/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */

export default function AdminDashboard() {
  const [data, setData] = useState({
    chambres: [],
    reservations: [],
    avis: [],
    users: [],
  });
  const [echecs, setEchecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState("jour");

  /* ---------- Chargement ---------- */

  const charger = useCallback(async () => {
    setLoading(true);

    const sources = [
      ["chambres", () => api.get(`${CHAMBRES_API}/chambres`)],
      ["reservations", () => toutesReservations()],
      ["avis", () => getAllAvis()],
      ["users", () => getAllUsers()],
    ];

    const resultats = await Promise.allSettled(sources.map(([, f]) => f()));

    const suivant = {};
    const ratés = [];

    resultats.forEach((res, i) => {
      const cle = sources[i][0];
      if (res.status === "fulfilled") {
        suivant[cle] = extraireListe(res.value);
      } else {
        suivant[cle] = [];
        ratés.push(cle);
      }
    });

    setData(suivant);
    setEchecs(ratés);
    setLoading(false);
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const manque = (...cles) => cles.some((c) => echecs.includes(c));

  /* ---------- Index ---------- */

  const aujourdhui = dateLocale();

  const chambresMap = useMemo(
    () => Object.fromEntries(data.chambres.map((c) => [String(c.id), c])),
    [data.chambres]
  );

  const usersMap = useMemo(
    () => Object.fromEntries(data.users.map((u) => [String(u.id), u])),
    [data.users]
  );

  const nomClient = (id) => usersMap[String(id)]?.name || `Client #${id}`;
  const infosChambre = (id) => {
    const c = chambresMap[String(id)];
    return {
      numero: c?.numero ? `Ch. ${c.numero}` : `Ch. #${id}`,
      type: c?.type_chambre ?? c?.type ?? c?.categorie ?? c?.nom ?? "",
    };
  };

  /* ---------- Réservations ---------- */

  const resa = useMemo(() => {
    const [debutP, finP] = bornesPeriode(periode);
    const valides = data.reservations.filter((r) => r.statut !== "ANNULEE");
    const confirmees = data.reservations.filter(
      (r) => r.statut === "CONFIRMEE"
    );

    const enCours = confirmees.filter(
      (r) => jour(resDebut(r)) <= aujourdhui && aujourdhui < jour(resFin(r))
    );
    const departsAujourdhui = confirmees.filter(
      (r) => jour(resFin(r)) === aujourdhui
    );

    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    const arriveesHier = confirmees.filter(
      (r) => jour(resDebut(r)) === dateLocale(hier)
    ).length;
    const arriveesAujourdhui = confirmees.filter(
      (r) => jour(resDebut(r)) === aujourdhui
    ).length;

    // Réservations qui chevauchent la période choisie
    const dansPeriode = valides.filter(
      (r) => jour(resDebut(r)) <= finP && jour(resFin(r)) >= debutP
    );
    const arriveesPeriode = dansPeriode.filter((r) => {
      const d = jour(resDebut(r));
      return d >= debutP && d <= finP;
    }).length;
    const departsPeriode = dansPeriode.filter((r) => {
      const f = jour(resFin(r));
      return f >= debutP && f <= finP;
    }).length;

    const tendance = arriveesHier
      ? Math.round(
          ((arriveesAujourdhui - arriveesHier) / arriveesHier) * 100
        )
      : null;

    return {
      periode: dansPeriode
        .sort((a, b) => jour(resDebut(a)).localeCompare(jour(resDebut(b))))
        .slice(0, 5),
      total: dansPeriode.length,
      arrivees: arriveesPeriode,
      departs: departsPeriode,
      tendance,
      occupees: new Set(enCours.map((r) => String(resChambre(r)))),
      departsAujourdhui: new Set(
        departsAujourdhui.map((r) => String(resChambre(r)))
      ),
    };
  }, [data.reservations, periode, aujourdhui]);

  /* ---------- Chambres ---------- */

  const chambres = useMemo(() => {
    const liste = [...data.chambres]
      .sort((a, b) =>
        String(a.numero ?? a.id).localeCompare(String(b.numero ?? b.id), "fr", {
          numeric: true,
        })
      )
      .map((c) => {
        const id = String(c.id);
        const brut = String(c.statut ?? c.etat ?? "").toLowerCase();
        let cle = "libre";
        let label = "Disponible";

        if (/menage|nettoy/.test(brut)) {
          cle = "menage";
          label = "Ménage en cours";
        } else if (resa.departsAujourdhui.has(id)) {
          cle = "depart";
          label = "Départ aujourd'hui";
        } else if (resa.occupees.has(id)) {
          cle = "occupee";
          label = "Occupée";
        }

        return {
          id,
          numero: c.numero ?? c.id,
          type: c.type_chambre ?? c.type ?? c.categorie ?? c.nom ?? "",
          cle,
          label,
        };
      });

    return {
      liste,
      libres: liste.filter((c) => c.cle === "libre").length,
      occupees: liste.filter((c) => c.cle === "occupee" || c.cle === "depart")
        .length,
      menage: liste.filter((c) => c.cle === "menage").length,
    };
  }, [data.chambres, resa]);

  const totalChambres = data.chambres.length;
  const tauxOccupation = totalChambres
    ? Math.min(100, Math.round((resa.occupees.size / totalChambres) * 100))
    : 0;

  /* ---------- Clients ---------- */

  const clients = useMemo(() => {
    const reels = data.users.filter((u) => roleUtilisateur(u) !== "admin");

    const stats = {};
    data.reservations.forEach((r) => {
      const id = resClient(r);
      if (id == null) return;
      const s = (stats[id] ||= { total: 0, derniere: null });
      s.total += 1;
      if (!s.derniere || num(r.id) > num(s.derniere.id)) s.derniere = r;
    });

    const enrichis = reels.map((u) => ({
      user: u,
      total: stats[u.id]?.total || 0,
      derniere: stats[u.id]?.derniere || null,
    }));

    const surPlace = new Set(
      data.reservations
        .filter(
          (r) =>
            r.statut === "CONFIRMEE" &&
            jour(resDebut(r)) <= aujourdhui &&
            aujourdhui < jour(resFin(r))
        )
        .map((r) => String(resClient(r)))
    ).size;

    return {
      total: reels.length,
      surPlace,
      vip: enrichis.filter((c) => c.total >= SEUIL_VIP).length,
      liste: enrichis
        .filter((c) => c.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 3),
    };
  }, [data.users, data.reservations, aujourdhui]);

  /* ---------- Avis ---------- */

  const avis = useMemo(() => {
    const liste = data.avis.map((a) => {
      const u = a.user ?? a.client ?? {};
      return {
        id: a.id,
        client:
          u.name ||
          u.nom ||
          a.user_name ||
          a.client_name ||
          (a.user_id ? `Client #${a.user_id}` : "Client"),
        note: Math.min(5, Math.max(0, num(a.note))),
        commentaire: typeof a.commentaire === "string" ? a.commentaire : "",
        date: a.created_at || a.date,
        source: a.source || "",
      };
    });

    const moyenneDe = (l) =>
      l.length ? l.reduce((t, a) => t + a.note, 0) / l.length : 0;

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);
    const ceMois = liste.filter((a) => a.date && new Date(a.date) >= debutMois);
    const avant = liste.filter((a) => a.date && new Date(a.date) < debutMois);

    return {
      total: liste.length,
      moyenne: moyenneDe(liste),
      positifs: liste.filter((a) => a.note >= 4).length,
      evolution:
        ceMois.length && avant.length
          ? moyenneDe(ceMois) - moyenneDe(avant)
          : null,
      recents: [...liste]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 2),
    };
  }, [data.avis]);

  const pctPositifs = avis.total
    ? Math.round((avis.positifs / avis.total) * 100)
    : 0;

  /* ---------- Libellés ---------- */

  const libellesEchecs = {
    chambres: "chambres",
    reservations: "réservations",
    avis: "avis",
    users: "clients",
  };

  const libellePeriode = {
    jour: "du jour",
    semaine: "de la semaine",
    mois: "du mois",
  }[periode];

  /* ============================================================
     RENDU
  ============================================================ */

  return (
    <div className="dash">
      {/* EN-TÊTE */}
      <header className="dash-header">
        <div>
          <h1>Tableau de bord hôtelier</h1>
          <p>
            Vue d'ensemble de vos réservations, de l'état des chambres, des
            clients et de leurs avis.
          </p>
        </div>

        <div className="dash-header-actions">
          <div className="dash-tabs" role="tablist">
            {PERIODES.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={periode === p.id}
                className={periode === p.id ? "active" : ""}
                onClick={() => setPeriode(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="dash-refresh"
            onClick={charger}
            disabled={loading}
            aria-label="Actualiser"
            title="Actualiser"
          >
            <RefreshCw size={15} className={loading ? "dash-spin" : ""} />
          </button>
        </div>
      </header>

      {echecs.length > 0 && (
        <div className="dash-alert" role="alert">
          <AlertCircle size={17} />
          <span>
            Données indisponibles :{" "}
            {echecs.map((c) => libellesEchecs[c]).join(", ")}. Les chiffres
            concernés peuvent être incomplets.
          </span>
          <button type="button" onClick={charger}>
            Réessayer
          </button>
        </div>
      )}

      {/* INDICATEURS */}
      <section className="dash-kpis">
        <Kpi
          icon={CalendarCheck}
          tone="blue"
          label="Réservations"
          value={resa.total}
          trend={
            periode === "jour" && resa.tendance !== null
              ? `${resa.tendance >= 0 ? "+" : ""}${resa.tendance}% vs hier`
              : null
          }
          hint={`${resa.arrivees} arrivée(s) • ${resa.departs} départ(s) prévu(s)`}
          loading={loading}
        />
        <Kpi
          icon={BedDouble}
          tone="green"
          label="Chambres"
          value={manque("chambres", "reservations") ? "—" : `${tauxOccupation}%`}
          hint={`${chambres.libres} libre(s) • ${chambres.occupees} occupée(s) • ${chambres.menage} ménage`}
          loading={loading}
        />
        <Kpi
          icon={Users}
          tone="indigo"
          label="Clients"
          value={clients.total}
          hint={`${clients.vip} client(s) VIP (${SEUIL_VIP}+ séjours)`}
          loading={loading}
        />
        <Kpi
          icon={Star}
          tone="amber"
          label="Avis & satisfaction"
          value={
            <>
              {avis.moyenne.toFixed(1)}
              <span className="dash-kpi-unit">/5</span>
              <Etoiles note={avis.moyenne} />
            </>
          }
          hint={`${avis.total} avis cumulés (${pctPositifs}% positifs)`}
          loading={loading}
        />
      </section>

      <div className="dash-layout">
        {/* COLONNE GAUCHE */}
        <div className="dash-col">
          <Panel
            title={`Réservations ${libellePeriode}`}
            subtitle="Arrivées, départs et séjours en cours"
            action={<PanelLink to="/admin/disponibilites">Tout afficher</PanelLink>}
          >
            {loading ? (
              <div className="dash-empty">Chargement...</div>
            ) : resa.periode.length === 0 ? (
              <div className="dash-empty">
                Aucune réservation sur cette période.
              </div>
            ) : (
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Chambre</th>
                      <th>Dates</th>
                      <th>Montant</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resa.periode.map((r) => {
                      const ch = infosChambre(resChambre(r));
                      const st = statutReservation(r, aujourdhui);
                      const montant = resMontant(r);
                      return (
                        <tr key={r.id}>
                          <td>
                            <strong>{nomClient(resClient(r))}</strong>
                          </td>
                          <td>
                            <strong>{ch.numero}</strong>
                            {ch.type && <small>{ch.type}</small>}
                          </td>
                          <td>
                            <strong>
                              {formaterDate(resDebut(r))} →{" "}
                              {formaterDate(resFin(r))}
                            </strong>
                            <small>
                              ({nuits(resDebut(r), resFin(r))} nuit
                              {nuits(resDebut(r), resFin(r)) > 1 ? "s" : ""})
                            </small>
                          </td>
                          <td className="dash-amount">
                            {montant != null ? formaterPrix(montant) : "—"}
                          </td>
                          <td>
                            <span className={`dash-pill ${st.tone}`}>
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel
            title="Statut des chambres"
            subtitle="Vue rapide de la disponibilité et de l'état du parc"
            action={
              <div className="dash-legend">
                <span className="libre">Disponible ({chambres.libres})</span>
                <span className="occupee">Occupée ({chambres.occupees})</span>
                <span className="menage">Ménage ({chambres.menage})</span>
              </div>
            }
          >
            {loading ? (
              <div className="dash-empty">Chargement...</div>
            ) : chambres.liste.length === 0 ? (
              <div className="dash-empty">Aucune chambre au catalogue.</div>
            ) : (
              <div className="dash-rooms">
                {chambres.liste.slice(0, 8).map((c) => (
                  <Link
                    to="/admin/chambres"
                    key={c.id}
                    className={`dash-room ${c.cle}`}
                  >
                    <div className="dash-room-top">
                      <strong>{c.numero}</strong>
                      <i />
                    </div>
                    <span className="dash-room-type">{c.type || "Chambre"}</span>
                    <small>{c.label}</small>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* COLONNE DROITE */}
        <div className="dash-col">
          <Panel
            title="Fiches clients & VIP"
            subtitle="Voyageurs notables et préférences"
            action={<PanelLink to="/admin/clients">Annuaire</PanelLink>}
          >
            {loading ? (
              <div className="dash-empty">Chargement...</div>
            ) : clients.liste.length === 0 ? (
              <div className="dash-empty">Aucun client avec réservation.</div>
            ) : (
              <ul className="dash-clients">
                {clients.liste.map(({ user, total, derniere }) => {
                  const vip = total >= SEUIL_VIP;
                  return (
                    <li key={user.id} className="dash-client">
                      <div className="dash-avatar">
                        {initiales(user.name)}
                      </div>
                      <div className="dash-client-main">
                        <div className="dash-client-row">
                          <strong>{user.name}</strong>
                          <span className={`dash-badge ${vip ? "gold" : "soft"}`}>
                            {vip ? "VIP" : "Client"}
                          </span>
                        </div>
                        <small>
                          {derniere
                            ? `${infosChambre(resChambre(derniere)).numero} • `
                            : ""}
                          {total} séjour{total > 1 ? "s" : ""}
                        </small>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel
            title="Derniers avis reçus"
            subtitle="Notes récentes et retours d'expérience"
            action={
              avis.evolution !== null && (
                <span
                  className={`dash-delta ${avis.evolution < 0 ? "down" : "up"}`}
                >
                  {avis.evolution >= 0 ? "+" : ""}
                  {avis.evolution.toFixed(1)} ce mois
                </span>
              )
            }
          >
            {loading ? (
              <div className="dash-empty">Chargement...</div>
            ) : avis.recents.length === 0 ? (
              <div className="dash-empty">Aucun avis pour le moment.</div>
            ) : (
              <ul className="dash-reviews">
                {avis.recents.map((a) => (
                  <li key={a.id} className="dash-review">
                    <div className="dash-review-head">
                      <strong>{a.client}</strong>
                      <span>• {formaterDate(a.date)}</span>
                      <Etoiles note={a.note} />
                    </div>
                    <p>{a.commentaire || "Aucun commentaire."}</p>
                    <div className="dash-review-foot">
                      <small>{a.source}</small>
                      <Link to="/admin/avis">Répondre</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <Link to="/admin/avis" className="dash-btn-block">
              Consulter les {avis.total} avis
            </Link>
          </Panel>
        </div>
      </div>
    </div>
  );
}