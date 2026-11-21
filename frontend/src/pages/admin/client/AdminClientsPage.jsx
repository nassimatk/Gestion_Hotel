
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Users,
  UserCheck,
  ShieldCheck,
  UserPlus,
  Search,
  RefreshCw,
  Mail,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Ban,
} from "lucide-react";

import { getAllUsers } from "../../../services/authApi";
import { toutesReservations } from "../../../services/disponibilitesApi";

import "./AdminClientsPage.css";

/* ============================================================
   CONFIGURATION
============================================================ */

const SEUIL_VIP = 3;
const ELEMENTS_PAR_PAGE = 8;

/* ============================================================
   UTILITAIRES
============================================================ */

const extraireListe = (response) => {
  const body = response?.data ?? response;

  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.data)) return body.data.data;
  if (Array.isArray(body?.users)) return body.users;
  if (Array.isArray(body?.clients)) return body.clients;

  return [];
};

const extraireReservations = (response) => {
  const body = response?.data ?? response;

  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.value)) return body.value;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.value)) return body.data.value;
  if (Array.isArray(body?.data?.data)) return body.data.data;
  if (Array.isArray(body?.reservations)) return body.reservations;

  return [];
};

const normaliserTexte = (value) =>
  String(value ?? "").toLowerCase().trim();

const formaterDate = (date) => {
  if (!date) return "Non renseignée";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Non renseignée";
  }

  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const obtenirRole = (user) => {
  const role =
    user?.role?.name ??
    user?.role?.nom ??
    user?.role_name ??
    user?.type ??
    user?.role ??
    "client";

  return String(
    typeof role === "object" ? "client" : role
  ).toLowerCase().trim();
};

const estAujourdHui = (date) => {
  if (!date) return false;

  const d = new Date(date);
  const aujourdHui = new Date();

  return (
    !Number.isNaN(d.getTime()) &&
    d.getDate() === aujourdHui.getDate() &&
    d.getMonth() === aujourdHui.getMonth() &&
    d.getFullYear() === aujourdHui.getFullYear()
  );
};

/* ============================================================
   NORMALISATION DES CLIENTS
   VIP À PARTIR DE 3 RÉSERVATIONS
============================================================ */

const normaliserClient = (user, reservations = []) => {
  const role = obtenirRole(user);

  const dateInscription =
    user?.created_at ??
    user?.date_inscription ??
    user?.createdAt ??
    null;

  const reservationsClient = reservations.filter((reservation) => {
    const clientId =
      reservation?.client_id ??
      reservation?.user_id ??
      reservation?.client?.id ??
      reservation?.user?.id;

    return (
      clientId != null &&
      String(clientId) === String(user.id)
    );
  });

  const vip =
    role !== "admin" &&
    reservationsClient.length >= SEUIL_VIP;

  const derniereReservation = [...reservationsClient].sort(
    (a, b) =>
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime()
  )[0];

  return {
    id: user.id,

    nom:
      user?.name ??
      user?.nom ??
      user?.username ??
      "Sans nom",

    email: user?.email ?? "Non renseigné",

    telephone:
      user?.telephone ??
      user?.phone ??
      user?.numero_telephone ??
      derniereReservation?.telephone ??
      "Non renseigné",

    ville:
      user?.ville ??
      user?.city ??
      "Non renseignée",

    role,

    dateInscription,

    statut: vip ? "VIP" : "Régulier",

    raw: user,
  };
};

/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */

export default function AdminClientsPage() {
  const [clients, setClients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [recherche, setRecherche] = useState("");
  const [filtreRole, setFiltreRole] = useState("tous");
  const [page, setPage] = useState(1);

  /* ============================================================
     CHARGEMENT CLIENTS ET RÉSERVATIONS
  ============================================================ */

  const chargerClients = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [usersResult, reservationsResult] =
        await Promise.allSettled([
          getAllUsers(),
          toutesReservations(),
        ]);

      if (usersResult.status === "rejected") {
        throw usersResult.reason;
      }

      const utilisateurs = extraireListe(usersResult.value);

      let reservations = [];

      if (reservationsResult.status === "fulfilled") {
        reservations = extraireReservations(
          reservationsResult.value
        );
      } else {
        console.error(
          "Erreur chargement réservations :",
          reservationsResult.reason
        );

        setError(
          "Les utilisateurs sont chargés, mais impossible de récupérer les réservations. Les statuts VIP ne peuvent pas être actualisés."
        );
      }

      const liste = utilisateurs
        .filter((user) => user && user.id != null)
        .map((user) =>
          normaliserClient(user, reservations)
        );

      setClients(liste);
      setPage(1);

    } catch (err) {
      console.error("Erreur chargement clients :", err);

      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Impossible de charger les utilisateurs."
      );

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    chargerClients();
  }, [chargerClients]);

  /* ============================================================
     STATISTIQUES
  ============================================================ */

  const statistiques = useMemo(() => {
    const clientsReels = clients.filter(
      (c) => c.role !== "admin"
    );

    const administrateurs = clients.filter(
      (c) => c.role === "admin"
    );

    const nouveaux = clientsReels.filter(
      (c) => estAujourdHui(c.dateInscription)
    );

    const vip = clientsReels.filter(
      (c) => c.statut === "VIP"
    );

    return {
      total: clients.length,
      clients: clientsReels.length,
      administrateurs: administrateurs.length,
      nouveaux: nouveaux.length,
      vip: vip.length,
    };
  }, [clients]);

  /* ============================================================
     INSCRIPTIONS DES 6 DERNIERS MOIS
  ============================================================ */

  const inscriptionsMensuelles = useMemo(() => {
    const mois = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();

      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      date.setMonth(date.getMonth() - i);

      const annee = date.getFullYear();
      const numeroMois = date.getMonth();

      const total = clients.filter((client) => {
        if (!client.dateInscription) return false;

        const d = new Date(client.dateInscription);

        return (
          !Number.isNaN(d.getTime()) &&
          d.getMonth() === numeroMois &&
          d.getFullYear() === annee &&
          client.role !== "admin"
        );
      }).length;

      mois.push({
        label: date.toLocaleDateString("fr-FR", {
          month: "short",
        }),
        total,
      });
    }

    return mois;
  }, [clients]);

  /* ============================================================
     DERNIERS CLIENTS
  ============================================================ */

  const derniersClients = useMemo(() => {
    return clients
      .filter((c) => c.role !== "admin")
      .sort((a, b) => {
        const dateA = new Date(
          a.dateInscription || 0
        ).getTime();

        const dateB = new Date(
          b.dateInscription || 0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [clients]);

  /* ============================================================
     RECHERCHE ET FILTRES
  ============================================================ */

  const utilisateursFiltres = useMemo(() => {
    return clients.filter((client) => {
      const terme = normaliserTexte(recherche);

      const rechercheOK =
        !terme ||
        normaliserTexte(client.nom).includes(terme) ||
        normaliserTexte(client.email).includes(terme) ||
        String(client.id).includes(terme);

      const roleOK =
        filtreRole === "tous" ||
        client.role === filtreRole;

      return rechercheOK && roleOK;
    });
  }, [clients, recherche, filtreRole]);

  /* ============================================================
     PAGINATION
  ============================================================ */

  const totalPages = Math.max(
    1,
    Math.ceil(
      utilisateursFiltres.length / ELEMENTS_PAR_PAGE
    )
  );

  const utilisateursAffiches = utilisateursFiltres.slice(
    (page - 1) * ELEMENTS_PAR_PAGE,
    page * ELEMENTS_PAR_PAGE
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  /* ============================================================
     RENDU
  ============================================================ */

  return (
    <div className="admin-clients-page">

      {/* HEADER */}

      <header className="clients-dashboard-header">
        <div>
          <span className="clients-eyebrow">
            HOTELHUB / ADMINISTRATION
          </span>

          <h1>Gestion des clients</h1>

          <p>
            Gérez les comptes et suivez les inscriptions
            de votre établissement.
          </p>
        </div>

        <div className="clients-header-actions">
          <button
            className="clients-btn clients-btn-secondary"
            onClick={chargerClients}
            disabled={loading}
            type="button"
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>
      </header>

      {/* ERREUR */}

      {error && (
        <div className="clients-error">
          <AlertCircle size={19} />

          <span>{error}</span>

          <button onClick={chargerClients} type="button">
            Réessayer
          </button>
        </div>
      )}

      {/* STATISTIQUES */}

      <section className="clients-dashboard-stats">

        <div className="clients-dashboard-stat">
          <div className="clients-dashboard-stat-top">
            <div className="clients-dashboard-icon">
              <Users size={21} />
            </div>

            <span className="clients-stat-label">
              UTILISATEURS
            </span>
          </div>

          <strong>
            {loading ? "—" : statistiques.total}
          </strong>

          <small>Comptes enregistrés</small>
        </div>

        <div className="clients-dashboard-stat">
          <div className="clients-dashboard-stat-top">
            <div className="clients-dashboard-icon">
              <UserCheck size={21} />
            </div>

            <span className="clients-stat-label">
              CLIENTS
            </span>
          </div>

          <strong>
            {loading ? "—" : statistiques.clients}
          </strong>

          <small>Hors administrateurs</small>
        </div>

        <div className="clients-dashboard-stat">
          <div className="clients-dashboard-stat-top">
            <div className="clients-dashboard-icon">
              <UserPlus size={21} />
            </div>

            <span className="clients-stat-label">
              NOUVEAUX AUJOURD'HUI
            </span>
          </div>

          <strong>
            {loading ? "—" : statistiques.nouveaux}
          </strong>

          <small>Inscriptions du jour</small>
        </div>

        <div className="clients-dashboard-stat">
          <div className="clients-dashboard-stat-top">
            <div className="clients-dashboard-icon">
              <ShieldCheck size={21} />
            </div>

            <span className="clients-stat-label">
              CLIENTS VIP
            </span>
          </div>

          <strong>
            {loading ? "—" : statistiques.vip}
          </strong>

          <small>Selon les réservations</small>
        </div>

      </section>

      {/* TABLEAU DES UTILISATEURS */}

      <section className="clients-panel clients-list-panel">

        <div className="clients-panel-header clients-list-header">
          <div>
            <span className="clients-section-label">
              BASE CLIENTS
            </span>

            <h2>Tous les utilisateurs</h2>

            <p>
              Consultez les comptes clients et administrateurs.
            </p>
          </div>

          <span className="clients-count">
            {utilisateursFiltres.length} résultat(s)
          </span>
        </div>

        {/* FILTRES */}

        <div className="clients-toolbar">

          <div className="clients-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Rechercher un nom, email ou ID..."
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            value={filtreRole}
            onChange={(e) => {
              setFiltreRole(e.target.value);
              setPage(1);
            }}
          >
            <option value="tous">Tous les rôles</option>
            <option value="client">Clients</option>
            <option value="admin">Administrateurs</option>
          </select>
        </div>

        {/* TABLEAU */}

        <div className="clients-table-wrapper">
          <table className="clients-table">

            <thead>
              <tr>
                <th>CLIENT</th>
                <th>COORDONNÉES</th>
                <th>RÔLE</th>
                <th>STATUT</th>
                <th>INSCRIPTION</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan={6} className="clients-empty">
                    Chargement des utilisateurs...
                  </td>
                </tr>
              ) : utilisateursAffiches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="clients-empty">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                utilisateursAffiches.map((client) => (
                  <tr key={client.id}>

                    <td>
                      <div className="clients-user-cell">
                        <div className="clients-avatar">
                          {client.nom.charAt(0).toUpperCase()}
                        </div>

                        <strong>{client.nom}</strong>
                      </div>
                    </td>

                    <td>
                      <div className="clients-contact">
                        <span>
                          <Mail size={13} />
                          {client.email}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`clients-badge ${
                          client.role === "admin"
                            ? "admin"
                            : "regular"
                        }`}
                      >
                        {client.role === "admin"
                          ? "Administrateur"
                          : client.role}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`clients-badge ${
                          client.statut === "VIP"
                            ? "vip"
                            : "regular"
                        }`}
                      >
                        {client.statut}
                      </span>
                    </td>

                    <td>
                      {formaterDate(client.dateInscription)}
                    </td>

                    {/* ACTIONS SANS ICÔNE ŒIL */}

                    <td>
                      <div className="clients-actions-group">

                        {client.role !== "admin" ? (
                          <button
                            className="clients-disable-btn"
                            title="Désactiver le compte"
                            type="button"
                            onClick={() =>
                              console.log(
                                "Désactivation à implémenter :",
                                client.id
                              )
                            }
                          >
                            <Ban size={15} />
                            Désactiver
                          </button>
                        ) : (
                          <span className="clients-no-action">
                            —
                          </span>
                        )}

                      </div>
                    </td>

                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        {!loading && utilisateursFiltres.length > 0 && (
          <div className="clients-pagination">

            <span>
              Affichage de{" "}
              {(page - 1) * ELEMENTS_PAR_PAGE + 1}
              {" à "}
              {Math.min(
                page * ELEMENTS_PAR_PAGE,
                utilisateursFiltres.length
              )}
              {" sur "}
              {utilisateursFiltres.length}
            </span>

            <div>
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                type="button"
              >
                <ChevronLeft size={18} />
              </button>

              <span>
                Page {page} / {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                type="button"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

      </section>

    </div>
  );
}
