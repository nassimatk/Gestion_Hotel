
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  UserCheck,
  ShieldCheck,
  UserPlus,
  Search,
  RefreshCw,
  Eye,
  X,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  ChevronLeft,
  ChevronRight,
  UserRound,
  AlertCircle,
  Ban,
} from "lucide-react";

import { getAllUsers } from "../../../services/authApi";
import "./AdminClientsPage.css";

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

const normaliserClient = (user) => {
  const role = obtenirRole(user);

  const dateInscription =
    user?.created_at ??
    user?.date_inscription ??
    user?.createdAt ??
    null;

  const vip =
    user?.is_vip === true ||
    user?.vip === true ||
    user?.client_vip === true ||
    normaliserTexte(user?.statut) === "vip" ||
    normaliserTexte(user?.status) === "vip" ||
    normaliserTexte(user?.status) === "premium";

  return {
    id: user.id,
    nom: user.name ?? user.nom ?? user.username ?? "Sans nom",
    email: user.email ?? "Non renseigné",
    ville: user.ville ?? user.city ?? "Non renseignée",
    role,
    dateInscription,
    statut: vip ? "VIP" : "Régulier",
    raw: user,
  };
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
   COMPOSANT PRINCIPAL
============================================================ */

export default function AdminClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [recherche, setRecherche] = useState("");
  const [filtreRole, setFiltreRole] = useState("tous");
  const [page, setPage] = useState(1);

  const [selection, setSelection] = useState(null);

  const elementsParPage = 8;

  /* ============================================================
     CHARGEMENT
  ============================================================ */

  const chargerClients = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAllUsers();

      const liste = extraireListe(response)
        .filter((user) => user && user.id != null)
        .map(normaliserClient);

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
      utilisateursFiltres.length / elementsParPage
    )
  );

  const utilisateursAffiches = utilisateursFiltres.slice(
    (page - 1) * elementsParPage,
    page * elementsParPage
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  /* ============================================================
     EXPORT CSV
  ============================================================ */

  const exporterCSV = () => {
    if (!utilisateursFiltres.length) return;

    const entetes = [
      "ID",
      "Nom",
      "Email",
      "Téléphone",
      "Ville",
      "Rôle",
      "Statut",
      "Date inscription",
    ];

    const lignes = utilisateursFiltres.map((c) => [
      c.id,
      c.nom,
      c.email,
      c.ville,
      c.role,
      c.statut,
      c.dateInscription ?? "",
    ]);

    const contenu = [entetes, ...lignes]
      .map((ligne) =>
        ligne
          .map((v) =>
            `"${String(v ?? "").replace(/"/g, '""')}"`
          )
          .join(";")
      )
      .join("\n");

    const blob = new Blob(
      ["\uFEFF" + contenu],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");

    lien.href = url;
    lien.download = "hotelhub-clients.csv";
    lien.click();

    URL.revokeObjectURL(url);
  };

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

          <button onClick={chargerClients}>
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

          <small>Selon le statut enregistré</small>
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

        {/* TABLE */}

        <div className="clients-table-wrapper">
          <table className="clients-table">

            <thead>
              <tr>
                <th>CLIENT</th>
                <th>COORDONNÉES</th>
                <th>VILLE</th>
                <th>RÔLE</th>
                <th>STATUT</th>
                <th>INSCRIPTION</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan={8} className="clients-empty">
                    Chargement des utilisateurs...
                  </td>
                </tr>
              ) : utilisateursAffiches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="clients-empty">
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

                    <td>{client.ville}</td>

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

                    {/* ACTIONS */}

                    <td>
                      <div className="clients-actions-group">

                        <button
                          className="clients-action-btn"
                          title="Voir les détails"
                          type="button"
                          onClick={() => setSelection(client)}
                        >
                          <Eye size={17} />
                        </button>

                        {client.role !== "admin" && (
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
                            <Ban size={16} />
                            Désactiver
                          </button>
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
              {(page - 1) * elementsParPage + 1}
              {" à "}
              {Math.min(
                page * elementsParPage,
                utilisateursFiltres.length
              )}
              {" sur "}
              {utilisateursFiltres.length}
            </span>

            <div>
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={18} />
              </button>

              <span>
                Page {page} / {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

      </section>

      {/* MODALE PROFIL */}

      {selection && (
        <div
          className="clients-modal-overlay"
          onClick={() => setSelection(null)}
        >
          <div
            className="clients-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="clients-modal-header">
              <div>
                <span>DOSSIER CLIENT</span>
                <h2>Profil utilisateur</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelection(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="clients-modal-profile">

              <div className="clients-modal-avatar">
                {selection.nom.charAt(0).toUpperCase()}
              </div>

              <h3>{selection.nom}</h3>


              <span
                className={`clients-badge ${
                  selection.role === "admin"
                    ? "admin"
                    : "regular"
                }`}
              >
                {selection.role === "admin"
                  ? "Administrateur"
                  : selection.role}
              </span>
            </div>

            <div className="clients-details-list">

              <div>
                <UserRound size={18} />
                <span>Nom complet</span>
                <strong>{selection.nom}</strong>
              </div>

              <div>
                <Mail size={18} />
                <span>Adresse email</span>
                <strong>{selection.email}</strong>
              </div>

             

              <div>
                <MapPin size={18} />
                <span>Ville</span>
                <strong>{selection.ville}</strong>
              </div>

              <div>
                <ShieldCheck size={18} />
                <span>Statut</span>
                <strong>{selection.statut}</strong>
              </div>

              <div>
                <CalendarDays size={18} />
                <span>Date d'inscription</span>
                <strong>
                  {formaterDate(selection.dateInscription)}
                </strong>
              </div>

            </div>

            <button
              className="clients-btn clients-btn-primary clients-modal-close"
              type="button"
              onClick={() => setSelection(null)}
            >
              Fermer
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
