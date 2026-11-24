import { useEffect, useMemo, useState } from "react";
import {
  toutesReservations,
  annulerReservation,
  getDisponibilites,
} from "../../../services/disponibilitesApi";
import "./AdminDisponibilitesPage.css";

const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL || "http://localhost:8005/api";
const CHAMBRES_API_URL =
  import.meta.env.VITE_CHAMBRES_API_URL || "http://localhost:8001/api";

function getAuthHeaders() {
  const token =
    localStorage.getItem("token") || localStorage.getItem("access_token");
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formaterDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formaterDateHeure(val) {
  if (!val) return "—";
  let d;
  if (Array.isArray(val)) {
    const [y, m, day, h = 0, min = 0, s = 0] = val;
    d = new Date(y, m - 1, day, h, min, s);
  } else {
    d = new Date(val);
  }
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculerNuits(debut, fin) {
  if (!debut || !fin) return 0;
  const diff = Math.round((new Date(fin) - new Date(debut)) / 86400000);
  return diff > 0 ? diff : 0;
}

function messageErreur(err) {
  const status = err.response?.status;
  if (status === 401) return "Session expirée. Veuillez vous reconnecter.";
  if (status === 403) return "Accès refusé : droits administrateur requis.";
  return (
    err.response?.data?.error ||
    err.response?.data?.message ||
    "Une erreur est survenue lors du chargement."
  );
}

export default function AdminDisponibilitesPage() {
  const [reservations, setReservations] = useState([]);
  const [clientsMap, setClientsMap] = useState({});
  const [chambresMap, setChambresMap] = useState({});
  const [chargement, setChargement] = useState(true);
  const [alerte, setAlerte] = useState(null);
  const [annulationId, setAnnulationId] = useState(null);

  // Filtres tableau
  const [filtreStatut, setFiltreStatut] = useState("TOUTES");
  const [recherche, setRecherche] = useState("");

  // Vérificateur rapide de disponibilité
  const [dateDebutCheck, setDateDebutCheck] = useState("");
  const [dateFinCheck, setDateFinCheck] = useState("");
  const [dispoResultat, setDispoResultat] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);

  async function chargerReservations() {
    setChargement(true);
    try {
      const res = await toutesReservations();
      const liste = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setReservations(liste);

      // 1. Récupérer les infos des chambres (chambres-service)
      try {
        const chRes = await fetch(`${CHAMBRES_API_URL}/chambres`, {
          headers: getAuthHeaders(),
        });
        if (chRes.ok) {
          const chData = await chRes.json();
          const chListe = Array.isArray(chData) ? chData : chData?.data ?? [];
          const mapCh = {};
          chListe.forEach((c) => {
            mapCh[c.id] = c;
          });
          setChambresMap(mapCh);
        }
      } catch {
        // Fallback silencieux sur Chambre #ID
      }

      // 2. Récupérer les noms des clients via GET /api/users/{id} (auth-service)
      const uniqueClientIds = [
        ...new Set(
          liste.map((r) => r.client_id ?? r.clientId).filter(Boolean)
        ),
      ];

      if (uniqueClientIds.length > 0) {
        const mapCl = {};
        await Promise.all(
          uniqueClientIds.map(async (id) => {
            try {
              const uRes = await fetch(`${AUTH_API_URL}/users/${id}`, {
                headers: getAuthHeaders(),
              });
              if (uRes.ok) {
                mapCl[id] = await uRes.json();
              }
            } catch {
              // Fallback silencieux sur Client #ID
            }
          })
        );
        setClientsMap(mapCl);
      }
    } catch (err) {
      setAlerte({ type: "error", text: messageErreur(err) });
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerReservations();
  }, []);

  async function handleAnnuler(id) {
    if (!window.confirm(`Confirmer l'annulation de la réservation #${id} ?`))
      return;
    setAlerte(null);
    setAnnulationId(id);
    try {
      await annulerReservation(id);
      setAlerte({
        type: "success",
        text: `La réservation #${id} a été annulée avec succès.`,
      });
      await chargerReservations();
    } catch (err) {
      setAlerte({ type: "error", text: messageErreur(err) });
    } finally {
      setAnnulationId(null);
    }
  }

  async function handleVerifierDispo(e) {
    e.preventDefault();
    if (!dateDebutCheck || !dateFinCheck) return;
    setCheckLoading(true);
    setDispoResultat(null);
    try {
      const res = await getDisponibilites({
        date_debut: dateDebutCheck,
        date_fin: dateFinCheck,
      });
      setDispoResultat({ ok: true, data: res.data });
    } catch (err) {
      setDispoResultat({ ok: false, error: messageErreur(err) });
    } finally {
      setCheckLoading(false);
    }
  }

  // Statistiques globales
  const stats = useMemo(() => {
    const total = reservations.length;
    const confirmees = reservations.filter((r) => r.statut === "CONFIRMEE");
    const annulees = reservations.filter((r) => r.statut === "ANNULEE");
    const nuiteesActives = confirmees.reduce(
      (acc, r) =>
        acc + calculerNuits(r.date_debut ?? r.dateDebut, r.date_fin ?? r.dateFin),
      0
    );
    return {
      total,
      confirmees: confirmees.length,
      annulees: annulees.length,
      nuiteesActives,
    };
  }, [reservations]);

  // Filtrage + recherche (par ID, nom client, email, numéro chambre, téléphone)
  const reservationsFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return reservations.filter((r) => {
      if (filtreStatut !== "TOUTES" && r.statut !== filtreStatut) return false;
      if (!q) return true;

      const idStr = String(r.id ?? "");
      const chambreId = r.chambre_id ?? r.chambreId;
      const clientId = r.client_id ?? r.clientId;
      const chambreObj = chambresMap[chambreId];
      const clientObj = clientsMap[clientId];

      const chambreStr =
        `${chambreId ?? ""} ${chambreObj?.numero ?? ""} ${chambreObj?.type ?? ""}`.toLowerCase();
      const clientStr =
        `${clientId ?? ""} ${clientObj?.name ?? ""} ${clientObj?.email ?? ""}`.toLowerCase();
      const telStr = String(r.telephone ?? "").toLowerCase();

      return (
        idStr.includes(q) ||
        chambreStr.includes(q) ||
        clientStr.includes(q) ||
        telStr.includes(q)
      );
    });
  }, [reservations, filtreStatut, recherche, clientsMap, chambresMap]);

  return (
    <div className="adm-res">
      {/* En-tête */}
      <div className="adm-res__header">
        <div>
          <span className="adm-res__eyebrow">
            Administration • Module Disponibilités
          </span>
          <h1 className="adm-res__title">Gestion des Réservations</h1>
          <p className="adm-res__subtitle">
            Supervisez l&apos;ensemble des réservations clients, vérifiez
            l&apos;occupation des chambres et gérez les annulations.
          </p>
        </div>

        <button
          type="button"
          className="adm-res__refresh-btn"
          onClick={chargerReservations}
          disabled={chargement}
        >
          {chargement ? "Actualisation..." : "↻ Actualiser"}
        </button>
      </div>

      {/* Alertes */}
      {alerte && (
        <div className={`adm-res__alert adm-res__alert--${alerte.type}`}>
          {alerte.text}
        </div>
      )}

      {/* Cartes KPI */}
      <div className="adm-res__kpis">
        <div className="adm-res__kpi">
          <span>Total réservations</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="adm-res__kpi adm-res__kpi--green">
          <span>Confirmées</span>
          <strong>{stats.confirmees}</strong>
        </div>
        <div className="adm-res__kpi adm-res__kpi--red">
          <span>Annulées</span>
          <strong>{stats.annulees}</strong>
        </div>
        <div className="adm-res__kpi adm-res__kpi--gold">
          <span>Nuitées actives</span>
          <strong>{stats.nuiteesActives}</strong>
        </div>
      </div>

      {/* Vérificateur rapide de disponibilité */}
      <div className="adm-res__checker">
        <div className="adm-res__checker-head">
          <h2>Vérifier l&apos;occupation sur une période</h2>
          {/* <span>Endpoint : GET /api/disponibilites</span> */}
        </div>

        <form className="adm-res__checker-form" onSubmit={handleVerifierDispo}>
          <div className="adm-res__field">
            <label>Date d&apos;arrivée</label>
            <input
              type="date"
              value={dateDebutCheck}
              onChange={(e) => setDateDebutCheck(e.target.value)}
              required
            />
          </div>
          <div className="adm-res__field">
            <label>Date de départ</label>
            <input
              type="date"
              value={dateFinCheck}
              min={dateDebutCheck || undefined}
              onChange={(e) => setDateFinCheck(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="adm-res__check-btn"
            disabled={checkLoading}
          >
            {checkLoading ? "Vérification..." : "Vérifier l'occupation"}
          </button>
        </form>

        {dispoResultat && (
          <div
            className={`adm-res__check-res ${
              dispoResultat.ok
                ? "adm-res__check-res--ok"
                : "adm-res__check-res--err"
            }`}
          >
            {dispoResultat.ok ? (
              <>
                <strong>Chambres occupées sur cette période : </strong>
                {dispoResultat.data?.chambres_occupees?.length > 0
                  ? dispoResultat.data.chambres_occupees
                      .map((id) =>
                        chambresMap[id]
                          ? `Chambre N° ${chambresMap[id].numero}`
                          : `Chambre #${id}`
                      )
                      .join(", ")
                  : "Aucune chambre occupée (toutes disponibles)."}
              </>
            ) : (
              dispoResultat.error
            )}
          </div>
        )}
      </div>

      {/* Barre d'outils : filtres + recherche */}
      <div className="adm-res__toolbar">
        <div className="adm-res__tabs">
          <button
            type="button"
            className={`adm-res__tab ${
              filtreStatut === "TOUTES" ? "is-active" : ""
            }`}
            onClick={() => setFiltreStatut("TOUTES")}
          >
            Toutes ({stats.total})
          </button>
          <button
            type="button"
            className={`adm-res__tab ${
              filtreStatut === "CONFIRMEE" ? "is-active" : ""
            }`}
            onClick={() => setFiltreStatut("CONFIRMEE")}
          >
            Confirmées ({stats.confirmees})
          </button>
          <button
            type="button"
            className={`adm-res__tab ${
              filtreStatut === "ANNULEE" ? "is-active" : ""
            }`}
            onClick={() => setFiltreStatut("ANNULEE")}
          >
            Annulées ({stats.annulees})
          </button>
        </div>

        <input
          type="text"
          className="adm-res__search"
          placeholder="Rechercher (Réf, Chambre, Client, Tél)..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
      </div>

      {/* Tableau des réservations */}
      <div className="adm-res__table-wrap">
        {chargement ? (
          <div className="adm-res__empty">Chargement des réservations...</div>
        ) : reservationsFiltrees.length === 0 ? (
          <div className="adm-res__empty">
            Aucune réservation ne correspond aux critères sélectionnés.
          </div>
        ) : (
          <table className="adm-res__table">
            <thead>
              <tr>
                <th>Réf.</th>
                <th>Chambre</th>
                <th>Client &amp; Contact</th>
                <th>Séjour</th>
                <th>Créée le</th>
                <th>Voyageurs</th>
                <th>Statut</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservationsFiltrees.map((r) => {
                const debut = r.date_debut ?? r.dateDebut;
                const fin = r.date_fin ?? r.dateFin;
                const creeLe =
                  r.created_at ??
                  r.createdAt ??
                  r.date_creation ??
                  r.dateCreation;
                const nuits = calculerNuits(debut, fin);
                const chambreId = r.chambre_id ?? r.chambreId;
                const clientId = r.client_id ?? r.clientId;
                const personnes = r.nombre_personnes ?? r.nombrePersonnes;
                const estAnnulee = r.statut === "ANNULEE";

                const chambreInfo = chambresMap[chambreId];
                const clientInfo = clientsMap[clientId];

                return (
                  <tr key={r.id} className={estAnnulee ? "is-cancelled" : ""}>
                    <td className="adm-res__id">#{r.id}</td>
                    <td>
                      <span className="adm-res__room-badge">
                        {chambreInfo
                          ? `Chambre N° ${chambreInfo.numero}${
                              chambreInfo.type ? ` (${chambreInfo.type})` : ""
                            }`
                          : `Chambre #${chambreId}`}
                      </span>
                    </td>
                    <td>
                      <div className="adm-res__client">
                        {clientInfo ? clientInfo.name : `Client #${clientId}`}
                      </div>
                      {clientInfo?.email && (
                        <div className="adm-res__phone">{clientInfo.email}</div>
                      )}
                      {r.telephone && (
                        <div className="adm-res__phone">📞 {r.telephone}</div>
                      )}
                    </td>
                    <td>
                      <div className="adm-res__dates">
                        {formaterDate(debut)} → {formaterDate(fin)}
                      </div>
                      <div className="adm-res__nights">
                        {nuits} nuit{nuits > 1 ? "s" : ""}
                      </div>
                    </td>
                    <td className="adm-res__created">
                      {formaterDateHeure(creeLe)}
                    </td>
                    <td>{personnes != null ? `${personnes} pers.` : "—"}</td>
                    <td>
                      <span
                        className={`adm-res__status ${
                          estAnnulee
                            ? "adm-res__status--annulee"
                            : "adm-res__status--confirmee"
                        }`}
                      >
                        {estAnnulee ? "Annulée" : "Confirmée"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {r.statut === "CONFIRMEE" ? (
                        <button
                          type="button"
                          className="adm-res__cancel-btn"
                          onClick={() => handleAnnuler(r.id)}
                          disabled={annulationId === r.id}
                        >
                          {annulationId === r.id ? "Annulation..." : "Annuler"}
                        </button>
                      ) : (
                        <span className="adm-res__no-action">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}