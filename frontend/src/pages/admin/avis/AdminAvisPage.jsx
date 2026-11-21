
import { useCallback, useEffect, useMemo, useState } from "react";

import {
    Search,
    CalendarDays,
    Star,
    Eye,
    Trash2,
    Download,
    X,
    ChevronLeft,
    ChevronRight,
    Check,
    MessageSquare,
    RefreshCw,
    User,
    Mail,
} from "lucide-react";

import { getAllAvis, deleteAvis } from "../../../services/avisApi";

import "./AdminAvisPage.css";

/* =========================================================
   UTILITAIRES
========================================================= */

const obtenirAvatar = (nom = "") =>
    String(nom)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((mot) => mot[0]?.toUpperCase() || "")
        .join("");

const obtenirDate = (date) => {
    if (!date) return "Date inconnue";

    const valeur = new Date(date);

    if (Number.isNaN(valeur.getTime())) {
        return "Date inconnue";
    }

    return valeur.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const extraireListe = (resultat) => {
    if (Array.isArray(resultat)) return resultat;

    if (Array.isArray(resultat?.data)) {
        return resultat.data;
    }

    if (Array.isArray(resultat?.data?.data)) {
        return resultat.data.data;
    }

    if (Array.isArray(resultat?.avis)) {
        return resultat.avis;
    }

    return [];
};

/* =========================================================
   NORMALISATION DES CHAMBRES
   Informations provenant directement de avisApi
========================================================= */

const normaliserChambre = (chambre = {}, chambreId = null) => {
    const numero =
        chambre.numero_chambre ??
        chambre.numero ??
        chambre.num_chambre ??
        chambre.code;

    return {
        id: chambre.id ?? chambreId,

        numero:
            numero !== undefined &&
            numero !== null &&
            numero !== ""
                ? String(numero)
                : `Chambre #${chambre.id || chambreId || "?"}`,

        nom:
            chambre.nom ||
            chambre.nom_chambre ||
            "Nom non disponible",

        description:
            chambre.description ||
            "Aucune description disponible.",

        etage:
            chambre.numero_etage ??
            chambre.etage ??
            null,

        capacite:
            chambre.capacite_max ??
            chambre.capacite ??
            null,

        nombreLits:
            chambre.nombre_lits ??
            null,

        typeLits:
            chambre.type_lits ||
            "Non renseigné",

        surface:
            chambre.superficie ??
            chambre.surface ??
            null,

        prix:
            chambre.prix_nuit ??
            chambre.prix ??
            null,

        devise:
            chambre.devise ||
            "MAD",

        statut:
            chambre.statut ||
            "Non renseigné",

        type:
            chambre.type_chambre ||
            chambre.type ||
            chambre.categorie ||
            null,
    };
};

/* =========================================================
   NORMALISATION DES AVIS
   Aucune autre API n'est utilisée
========================================================= */

const normaliserAvis = (item = {}) => {
    const utilisateur =
        item.user && typeof item.user === "object"
            ? item.user
            : item.client && typeof item.client === "object"
                ? item.client
                : {};

    const chambreBrute =
        item.chambre && typeof item.chambre === "object"
            ? item.chambre
            : {};

    const chambreId =
        item.chambre_id ??
        chambreBrute.id ??
        null;

    const nom =
        utilisateur.name ||
        utilisateur.nom ||
        item.user_name ||
        item.client_name ||
        (typeof item.client === "string" ? item.client : null) ||
        (item.user_id ? `Client #${item.user_id}` : "Client");

    const email =
        utilisateur.email ||
        item.user_email ||
        item.email ||
        "Email non disponible";

    const chambre = normaliserChambre(
        chambreBrute,
        chambreId
    );

    const noteBrute = Number(item.note);

    const note = Number.isFinite(noteBrute)
        ? Math.min(5, Math.max(0, noteBrute))
        : 0;

    const dateOriginale =
        item.created_at ||
        item.date ||
        null;

    return {
        id: item.id,

        userId: item.user_id ?? utilisateur.id ?? null,

        client: String(nom),

        email: String(email),

        chambreId,

        chambre,

        numeroChambre: chambre.numero,

        note,

        commentaire:
            typeof item.commentaire === "string"
                ? item.commentaire
                : "",

        date: obtenirDate(dateOriginale),

        dateOriginale,

        statut: item.statut || "Publié",

        avatar: obtenirAvatar(nom),

        couleur: "gold",
    };
};

/* =========================================================
   COMPOSANT PRINCIPAL
========================================================= */

export default function AdminAvisPage() {
    const [avis, setAvis] = useState([]);

    const [avisSelectionne, setAvisSelectionne] = useState(null);

    const [recherche, setRecherche] = useState("");

    const [filtreNote, setFiltreNote] = useState(
        "Toutes les notes"
    );

    const [page, setPage] = useState(1);

    const [parPage, setParPage] = useState(6);

    const [chargement, setChargement] = useState(true);

    const [suppression, setSuppression] = useState(false);

    const [erreur, setErreur] = useState("");

    const [notification, setNotification] = useState("");

    /* =====================================================
       CHARGEMENT DES AVIS
       Source unique : avisApi
    ===================================================== */

    const chargerAvis = useCallback(async () => {
        setChargement(true);
        setErreur("");

        try {
            const resultat = await getAllAvis();

            const listeAvis = extraireListe(resultat);

            const avisNormalises = listeAvis.map((item) =>
                normaliserAvis(item)
            );

            setAvis(avisNormalises);

        } catch (error) {
            console.error(
                "Erreur chargement des avis :",
                error
            );

            setErreur(
                error?.response?.data?.message ||
                error?.message ||
                "Impossible de charger les avis."
            );

        } finally {
            setChargement(false);
        }
    }, []);

    useEffect(() => {
        chargerAvis();
    }, [chargerAvis]);

    /* =====================================================
       NOTIFICATIONS
    ===================================================== */

    useEffect(() => {
        if (!notification) return undefined;

        const timer = window.setTimeout(() => {
            setNotification("");
        }, 4000);

        return () => window.clearTimeout(timer);
    }, [notification]);

    /* =====================================================
       SYNCHRONISATION DE L'AVIS SELECTIONNE
    ===================================================== */

    useEffect(() => {
        if (!avisSelectionne) return;

        const avisActualise = avis.find(
            (item) =>
                String(item.id) === String(avisSelectionne.id)
        );

        if (avisActualise) {
            setAvisSelectionne(avisActualise);
        } else {
            setAvisSelectionne(null);
        }
    }, [avis, avisSelectionne]);

    /* =====================================================
       STATISTIQUES
    ===================================================== */

    const totalAvis = avis.length;

    const avisPublies = avis.filter(
        (item) => item.statut === "Publié"
    ).length;

    const moyenne = totalAvis
        ? (
            avis.reduce(
                (total, item) => total + item.note,
                0
            ) / totalAvis
        ).toFixed(1)
        : "0.0";

    /* =====================================================
       RECHERCHE ET FILTRE
    ===================================================== */

    const avisFiltres = useMemo(() => {
        const terme = recherche.trim().toLowerCase();

        return avis.filter((item) => {
            const numero = String(
                item.numeroChambre || ""
            ).toLowerCase();

            const rechercheValide =
                !terme ||
                numero.includes(terme) ||
                item.client.toLowerCase().includes(terme) ||
                item.email.toLowerCase().includes(terme);

            const noteValide =
                filtreNote === "Toutes les notes" ||
                Math.floor(item.note) === Number(filtreNote);

            return rechercheValide && noteValide;
        });
    }, [avis, recherche, filtreNote]);

    /* =====================================================
       PAGINATION
    ===================================================== */

    const totalPages = Math.max(
        1,
        Math.ceil(avisFiltres.length / parPage)
    );

    useEffect(() => {
        setPage((anciennePage) =>
            Math.min(anciennePage, totalPages)
        );
    }, [totalPages]);

    const avisAffiches = avisFiltres.slice(
        (page - 1) * parPage,
        page * parPage
    );

    /* =====================================================
       SELECTION D'UN AVIS
    ===================================================== */

    const selectionnerAvis = (item) => {
        setAvisSelectionne(item);
    };

    /* =====================================================
       SUPPRESSION D'UN AVIS
    ===================================================== */

    const supprimerAvis = async (item) => {
        if (!item || suppression) return;

        const confirmation = window.confirm(
            `Voulez-vous vraiment supprimer l'avis de ${item.client} ?\n\nCette action est définitive.`
        );

        if (!confirmation) return;

        setSuppression(true);
        setErreur("");

        try {
            await deleteAvis(item.id);

            setAvis((ancienneListe) =>
                ancienneListe.filter(
                    (avisItem) =>
                        String(avisItem.id) !== String(item.id)
                )
            );

            setAvisSelectionne((selection) =>
                selection &&
                String(selection.id) === String(item.id)
                    ? null
                    : selection
            );

            setNotification(
                "Avis supprimé avec succès."
            );

        } catch (error) {
            console.error(
                "Erreur suppression avis :",
                error
            );

            setNotification(
                error?.response?.data?.message ||
                error?.message ||
                "Impossible de supprimer cet avis."
            );

        } finally {
            setSuppression(false);
        }
    };

    /* =====================================================
       REINITIALISATION DES FILTRES
    ===================================================== */

    const reinitialiserFiltres = () => {
        setRecherche("");
        setFiltreNote("Toutes les notes");
        setPage(1);
    };

    /* =====================================================
       EXPORT CSV
    ===================================================== */

    const exporterAvis = () => {
        const lignes = [
            [
                "ID",
                "Client",
                "Email",
                "Numero chambre",
                "Nom chambre",
                "Type chambre",
                "Etage",
                "Capacite",
                "Nombre de lits",
                "Surface",
                "Prix par nuit",
                "Note",
                "Commentaire",
                "Date",
                "Statut",
            ],

            ...avisFiltres.map((item) => [
                item.id,
                item.client,
                item.email,
                item.numeroChambre,
                item.chambre.nom,
                item.chambre.type || "",
                item.chambre.etage ?? "",
                item.chambre.capacite ?? "",
                item.chambre.nombreLits ?? "",
                item.chambre.surface ?? "",
                item.chambre.prix ?? "",
                item.note,
                item.commentaire,
                item.date,
                item.statut,
            ]),
        ];

        const csv = lignes
            .map((ligne) =>
                ligne
                    .map(
                        (cellule) =>
                            `"${String(cellule ?? "").replace(/"/g, '""')}"`
                    )
                    .join(";")
            )
            .join("\r\n");

        const blob = new Blob(
            ["\uFEFF" + csv],
            {
                type: "text/csv;charset=utf-8;",
            }
        );

        const url = URL.createObjectURL(blob);

        const lien = document.createElement("a");

        lien.href = url;

        lien.download = "hotelhub-gestion-avis.csv";

        document.body.appendChild(lien);

        lien.click();

        lien.remove();

        URL.revokeObjectURL(url);
    };

    /* =====================================================
       AFFICHAGE
    ===================================================== */

    return (
        <div className="admin-avis-page">

            <main className="admin-avis-content">

                {/* EN-TETE */}

                <header className="admin-avis-header">
                    <div>
                        <h1>
                            <Star
                                size={21}
                                fill="#D5A451"
                                color="#D5A451"
                            />
                            Gestion des avis
                        </h1>

                        <p>
                            Consultez et gérez les avis de vos clients.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="admin-reset-btn"
                        onClick={exporterAvis}
                        disabled={avisFiltres.length === 0}
                    >
                        <Download size={16} />
                        Exporter CSV
                    </button>
                </header>

                {/* NOTIFICATION */}

                {notification && (
                    <div
                        className="admin-notification-message"
                        role="status"
                    >
                        <Check size={17} />

                        <span>{notification}</span>

                        <button
                            type="button"
                            onClick={() => setNotification("")}
                            aria-label="Fermer"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* ERREUR */}

                {erreur && (
                    <div
                        className="admin-error-message"
                        role="alert"
                    >
                        <X size={17} />

                        <span>{erreur}</span>

                        <button
                            type="button"
                            onClick={chargerAvis}
                            disabled={chargement}
                        >
                            <RefreshCw size={15} />
                            Réessayer
                        </button>
                    </div>
                )}

                {/* STATISTIQUES */}

                <section className="admin-stats-grid">

                    <article className="admin-stat-card">
                        <div className="admin-stat-icon gold">
                            <MessageSquare size={20} />
                        </div>

                        <div className="admin-stat-info">
                            <span>TOTAL DES AVIS</span>

                            <div className="admin-stat-value">
                                {totalAvis}
                            </div>

                            <small>Nombre total des avis</small>
                        </div>
                    </article>

                    <article className="admin-stat-card">
                        <div className="admin-stat-icon gold">
                            <Star
                                size={20}
                                fill="currentColor"
                            />
                        </div>

                        <div className="admin-stat-info">
                            <span>NOTE MOYENNE</span>

                            <div className="admin-stat-value">
                                {moyenne}
                                <small>/5</small>
                            </div>

                            <small>Sur l'ensemble des avis</small>
                        </div>
                    </article>

                    <article className="admin-stat-card">
                        <div className="admin-stat-icon green">
                            <Check size={20} />
                        </div>

                        <div className="admin-stat-info">
                            <span>AVIS PUBLIÉS</span>

                            <div className="admin-stat-value">
                                {avisPublies}
                            </div>

                            <small>
                                {totalAvis
                                    ? Math.round(
                                        (avisPublies / totalAvis) * 100
                                    )
                                    : 0}
                                % du total
                            </small>
                        </div>
                    </article>

                </section>

                {/* TABLEAU ET DETAILS */}

                <section
                    className={`admin-avis-layout ${
                        avisSelectionne ? "has-details" : ""
                    }`}
                >

                    <div className="admin-table-container">

                        {/* RECHERCHE ET FILTRES */}

                        <div className="admin-filters">

                            <div className="admin-table-search">
                                <Search size={15} />

                                <input
                                    type="text"
                                    placeholder="Rechercher par client ou chambre..."
                                    value={recherche}
                                    onChange={(event) => {
                                        setRecherche(event.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>

                            <select
                                value={filtreNote}
                                onChange={(event) => {
                                    setFiltreNote(event.target.value);
                                    setPage(1);
                                }}
                                aria-label="Filtrer par note"
                            >
                                <option value="Toutes les notes">
                                    Toutes les notes
                                </option>

                                <option value="5">5 étoiles</option>
                                <option value="4">4 étoiles</option>
                                <option value="3">3 étoiles</option>
                                <option value="2">2 étoiles</option>
                                <option value="1">1 étoile</option>
                            </select>

                            <button
                                type="button"
                                className="admin-reset-btn"
                                onClick={reinitialiserFiltres}
                            >
                                <RefreshCw size={14} />
                                Réinitialiser
                            </button>

                            <button
                                type="button"
                                className="admin-reset-btn"
                                onClick={chargerAvis}
                                disabled={chargement}
                            >
                                <RefreshCw
                                    size={14}
                                    className={
                                        chargement ? "admin-spin" : ""
                                    }
                                />
                                Actualiser
                            </button>

                        </div>

                        {/* TABLEAU */}

                        <div className="admin-table-scroll">

                            <table className="admin-avis-table">

                                <thead>
                                    <tr>
                                        <th>CLIENT</th>
                                        <th>N° CHAMBRE</th>
                                        <th>NOTE</th>
                                        <th>COMMENTAIRE</th>
                                        <th>DATE</th>
                                        <th>STATUT</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {chargement ? (
                                        <tr>
                                            <td colSpan="7" className="admin-empty">
                                                <RefreshCw
                                                    size={18}
                                                    className="admin-spin"
                                                />
                                                Chargement des avis...
                                            </td>
                                        </tr>
                                    ) : avisAffiches.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="admin-empty">
                                                <MessageSquare size={23} />

                                                <strong>
                                                    Aucun avis trouvé
                                                </strong>

                                                <span>
                                                    Vérifiez votre recherche
                                                    ou réinitialisez les filtres.
                                                </span>
                                            </td>
                                        </tr>
                                    ) : (
                                        avisAffiches.map((item) => (
                                            <tr
                                                key={item.id}
                                                className={
                                                    String(avisSelectionne?.id) ===
                                                    String(item.id)
                                                        ? "selected-row"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    selectionnerAvis(item)
                                                }
                                            >

                                                <td>
                                                    <div className="admin-client-cell">

                                                        <div
                                                            className={`admin-client-avatar ${item.couleur}`}
                                                        >
                                                            {item.avatar}
                                                        </div>

                                                        <div className="admin-client-identity">
                                                            <strong>
                                                                {item.client}
                                                            </strong>

                                                            <small>
                                                                {item.email}
                                                            </small>
                                                        </div>

                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="admin-room-number">
                                                        <strong>
                                                            {item.numeroChambre}
                                                        </strong>
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="admin-note-cell">
                                                        <span>
                                                            {"★".repeat(
                                                                Math.round(item.note)
                                                            )}
                                                        </span>

                                                        <strong>
                                                            {item.note.toFixed(1)}
                                                        </strong>
                                                    </div>
                                                </td>

                                                <td>
                                                    <div
                                                        className="admin-comment-preview"
                                                        title={item.commentaire}
                                                    >
                                                        {item.commentaire ||
                                                            "Aucun commentaire"}
                                                    </div>
                                                </td>

                                                <td>{item.date}</td>

                                                <td>
                                                    <span className="admin-status published">
                                                        {item.statut}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="admin-row-actions">

                                                        <button
                                                            type="button"
                                                            title="Consulter"
                                                            aria-label="Consulter l'avis"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                selectionnerAvis(item);
                                                            }}
                                                        >
                                                            <Eye size={16} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title="Supprimer"
                                                            aria-label="Supprimer l'avis"
                                                            disabled={suppression}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                supprimerAvis(item);
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>

                                                    </div>
                                                </td>

                                            </tr>
                                        ))
                                    )}

                                </tbody>

                            </table>

                        </div>

                        {/* PAGINATION */}

                        <div className="admin-pagination">

                            <span>
                                Affichage{" "}

                                {avisFiltres.length
                                    ? (page - 1) * parPage + 1
                                    : 0}

                                {" - "}

                                {Math.min(
                                    page * parPage,
                                    avisFiltres.length
                                )}

                                {" sur "}

                                {avisFiltres.length}
                            </span>

                            <div className="admin-pagination-controls">

                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() =>
                                        setPage((p) => Math.max(1, p - 1))
                                    }
                                    aria-label="Page précédente"
                                >
                                    <ChevronLeft size={15} />
                                </button>

                                {Array.from(
                                    { length: totalPages },
                                    (_, index) => index + 1
                                )
                                    .filter(
                                        (numero) =>
                                            numero === 1 ||
                                            numero === totalPages ||
                                            Math.abs(numero - page) <= 1
                                    )
                                    .map((numero, index, liste) => (
                                        <span
                                            className="admin-page-item"
                                            key={numero}
                                        >
                                            {index > 0 &&
                                                liste[index - 1] !== numero - 1 && (
                                                    <span className="admin-page-dots">
                                                        …
                                                    </span>
                                                )}

                                            <button
                                                type="button"
                                                className={
                                                    page === numero
                                                        ? "active"
                                                        : ""
                                                }
                                                onClick={() => setPage(numero)}
                                            >
                                                {numero}
                                            </button>
                                        </span>
                                    ))}

                                <button
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() =>
                                        setPage((p) =>
                                            Math.min(totalPages, p + 1)
                                        )
                                    }
                                    aria-label="Page suivante"
                                >
                                    <ChevronRight size={15} />
                                </button>

                            </div>

                            <select
                                value={parPage}
                                onChange={(event) => {
                                    setParPage(Number(event.target.value));
                                    setPage(1);
                                }}
                                aria-label="Nombre d'avis par page"
                            >
                                <option value="6">6 / page</option>
                                <option value="10">10 / page</option>
                                <option value="20">20 / page</option>
                            </select>

                        </div>

                    </div>

                    {/* PANNEAU DES DETAILS */}

                    {avisSelectionne && (
                        <aside className="admin-avis-details">

                            <div className="admin-details-header">

                                <h3>Détails de l'avis</h3>

                                <button
                                    type="button"
                                    className="admin-close-details"
                                    onClick={() =>
                                        setAvisSelectionne(null)
                                    }
                                    aria-label="Fermer les détails"
                                >
                                    <X size={17} />
                                </button>

                            </div>

                            {/* INFORMATIONS CLIENT */}

                            <div className="admin-details-client">

                                <div
                                    className={`admin-client-avatar large ${avisSelectionne.couleur}`}
                                >
                                    {avisSelectionne.avatar}
                                </div>

                                <div className="admin-details-client-info">

                                    <strong>
                                        {avisSelectionne.client}
                                    </strong>

                                    <span>
                                        {avisSelectionne.email}
                                    </span>

                                    <div className="admin-details-stars">
                                        {"★".repeat(
                                            Math.round(avisSelectionne.note)
                                        )}

                                        {"☆".repeat(
                                            5 - Math.round(avisSelectionne.note)
                                        )}

                                        <b>
                                            {avisSelectionne.note.toFixed(1)}/5
                                        </b>
                                    </div>

                                </div>

                                <span className="admin-status published">
                                    {avisSelectionne.statut}
                                </span>

                            </div>

                            {/* CLIENT */}

                            <div className="admin-details-section">

                                <h4>
                                    <User size={15} />
                                    Informations du client
                                </h4>

                                <div className="admin-details-info">

                                    <div>
                                        <User size={15} />

                                        <span>Nom du client</span>

                                        <strong>
                                            {avisSelectionne.client}
                                        </strong>
                                    </div>

                                    <div>
                                        <Mail size={15} />

                                        <span>Email</span>

                                        <strong>
                                            {avisSelectionne.email}
                                        </strong>
                                    </div>

                                </div>

                            </div>

                            {/* CHAMBRE */}

                            <div className="admin-details-section">

                                <h4>
                                    Informations de la chambre
                                </h4>

                                <div className="admin-room-highlight">
                                    <strong>
                                        {avisSelectionne.numeroChambre}
                                    </strong>
                                </div>

                                <div className="admin-details-info admin-room-details-info">

                                    <div>
                                        <span>Nom de la chambre</span>

                                        <strong>
                                            {avisSelectionne.chambre.nom}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Étage</span>

                                        <strong>
                                            {avisSelectionne.chambre.etage ??
                                                "Non renseigné"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Type de chambre</span>

                                        <strong>
                                            {avisSelectionne.chambre.type ||
                                                "Non renseigné"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Capacité maximale</span>

                                        <strong>
                                            {avisSelectionne.chambre.capacite !== null
                                                ? `${avisSelectionne.chambre.capacite} voyageurs`
                                                : "Non renseignée"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Nombre de lits</span>

                                        <strong>
                                            {avisSelectionne.chambre.nombreLits ??
                                                "Non renseigné"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Type de lits</span>

                                        <strong>
                                            {avisSelectionne.chambre.typeLits}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Surface</span>

                                        <strong>
                                            {avisSelectionne.chambre.surface !== null
                                                ? `${avisSelectionne.chambre.surface} m²`
                                                : "Non renseignée"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Prix par nuit</span>

                                        <strong>
                                            {avisSelectionne.chambre.prix !== null
                                                ? `${avisSelectionne.chambre.prix} ${avisSelectionne.chambre.devise}`
                                                : "Non renseigné"}
                                        </strong>
                                    </div>

                                </div>

                            </div>

                            {/* AVIS */}

                            <div className="admin-details-section">

                                <h4>
                                    <MessageSquare size={15} />
                                    Informations de l'avis
                                </h4>

                                <div className="admin-details-info admin-room-details-info">

                                    <div>
                                        <Star size={15} />

                                        <span>Note attribuée</span>

                                        <strong>
                                            {avisSelectionne.note}/5
                                        </strong>
                                    </div>

                                    <div>
                                        <CalendarDays size={15} />

                                        <span>Date de publication</span>

                                        <strong>
                                            {avisSelectionne.date}
                                        </strong>
                                    </div>

                                </div>

                                <div className="admin-details-subsection">

                                    <h4>Commentaire du client</h4>

                                    <div className="admin-details-comment">
                                        {avisSelectionne.commentaire ||
                                            "Aucun commentaire."}
                                    </div>

                                </div>

                            </div>

                            {/* SUPPRESSION */}

                            <div className="admin-details-actions">

                                <button
                                    type="button"
                                    className="admin-delete-btn"
                                    disabled={suppression}
                                    onClick={() =>
                                        supprimerAvis(avisSelectionne)
                                    }
                                >
                                    <Trash2 size={15} />

                                    {suppression
                                        ? "Suppression..."
                                        : "Supprimer l'avis"}
                                </button>

                            </div>

                        </aside>
                    )}

                </section>

            </main>

        </div>
    );
}
