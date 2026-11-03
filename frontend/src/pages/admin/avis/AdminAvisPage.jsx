
import React, { useState, useEffect } from "react";
import {
  Search,
  CalendarDays,
  ChevronDown,
  Eye,
  Trash2,
  X,
  Check,
  Clock,
  Star,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

import "./AdminAvisPage.css";

const API_URL = "http://localhost:8002/api/avis";

// Normalisation des données retournées par Laravel
function normalizeReview(item) {
  const dateValue =
    item.created_at ||
    item.date ||
    item.createdAt ||
    null;

  const date = dateValue ? new Date(dateValue) : null;

  const note = Number(item.note ?? item.rating ?? 0);

  const statusValue = String(
    item.status ?? item.statut ?? "publie"
  ).toLowerCase();

  return {
    id: item.id,
    user_id: item.user_id,
    chambre_id: item.chambre_id,

    name:
      item.user?.name ||
      item.client?.name ||
      item.name ||
      item.nom ||
      `Client #${item.user_id ?? "?"}`,

    email:
      item.user?.email ||
      item.client?.email ||
      item.email ||
      "",

    room:
      item.chambre?.nom ||
      item.chambre?.name ||
      item.room?.name ||
      item.room ||
      `Chambre #${item.chambre_id ?? "?"}`,

    roomNumber:
      item.chambre?.numero
        ? `#${item.chambre.numero}`
        : "",

    note,

    comment:
      item.commentaire ||
      item.comment ||
      item.description ||
      "",

    date:
      date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString("fr-FR")
        : "Date inconnue",

    time:
      date && !Number.isNaN(date.getTime())
        ? date.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",

    status:
      ["attente", "pending", "en attente"].includes(statusValue)
        ? "attente"
        : "publie",

    reply: item.reply || item.reponse || "",
  };
}

// Étoiles
function Stars({ note }) {
  return (
    <span className="review-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={
            star <= note
              ? "review-star filled"
              : "review-star"
          }
        >
          ★
        </span>
      ))}
    </span>
  );
}

// Statut
function Status({ status }) {
  return status === "publie" ? (
    <span className="badge badge--publie">Publié</span>
  ) : (
    <span className="badge badge--attente">En attente</span>
  );
}

export default function AdminAvisPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [noteFilter, setNoteFilter] = useState("toutes");

  const [selectedId, setSelectedId] = useState(null);
  const [notice, setNotice] = useState("");

  // Récupérer les avis depuis le microservice Laravel
  async function fetchReviews() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(
          `Erreur API : ${response.status}`
        );
      }

      const result = await response.json();

      const data = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.avis)
            ? result.avis
            : [];

      const formattedReviews = data.map(normalizeReview);

      setReviews(formattedReviews);

      setSelectedId((currentId) => {
        if (
          currentId !== null &&
          formattedReviews.some((review) => review.id === currentId)
        ) {
          return currentId;
        }

        return formattedReviews[0]?.id ?? null;
      });

    } catch (err) {
      console.error("Erreur chargement avis :", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
  }, []);

  // Recherche et filtres
  const filteredReviews = reviews.filter((review) => {
    const text = search.toLowerCase();

    const searchMatch =
      review.name.toLowerCase().includes(text) ||
      review.email.toLowerCase().includes(text) ||
      review.room.toLowerCase().includes(text) ||
      review.comment.toLowerCase().includes(text);

    const statusMatch =
      statusFilter === "tous" ||
      review.status === statusFilter;

    const noteMatch =
      noteFilter === "toutes" ||
      Math.floor(review.note) === Number(noteFilter);

    return searchMatch && statusMatch && noteMatch;
  });

  // Statistiques
  const total = reviews.length;

  const published = reviews.filter(
    (review) => review.status === "publie"
  ).length;

  const pending = reviews.filter(
    (review) => review.status === "attente"
  ).length;

  const average =
    total > 0
      ? (
          reviews.reduce(
            (sum, review) => sum + review.note,
            0
          ) / total
        ).toFixed(1)
      : "0.0";

  const selected = reviews.find(
    (review) => review.id === selectedId
  );

  // Réinitialiser les filtres
  function resetFilters() {
    setSearch("");
    setStatusFilter("tous");
    setNoteFilter("toutes");
  }

  // Modifier le statut dans Laravel
  async function changeStatus(id) {
    const review = reviews.find(
      (item) => item.id === id
    );

    if (!review) return;

    const newStatus =
      review.status === "publie"
        ? "attente"
        : "publie";

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Modification impossible : ${response.status}`
        );
      }

      await fetchReviews();

      setNotice(
        "Statut modifié. Vérifie que le backend a bien enregistré la modification."
      );

    } catch (err) {
      console.error(err);
      setNotice(err.message);
    }
  }

  // Supprimer un avis dans Laravel
  async function deleteReview(id) {
    const review = reviews.find(
      (item) => item.id === id
    );

    if (!review) return;

    const confirmed = window.confirm(
      `Voulez-vous supprimer l'avis de ${review.name} ?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Suppression impossible : ${response.status}`
        );
      }

      setReviews((previous) =>
        previous.filter((item) => item.id !== id)
      );

      if (selectedId === id) {
        const remaining = reviews.filter(
          (item) => item.id !== id
        );

        setSelectedId(remaining[0]?.id ?? null);
      }

      setNotice("Avis supprimé avec succès.");

    } catch (err) {
      console.error(err);
      setNotice(err.message);
    }
  }

  // Export CSV
  function exportReviews() {
    const headers = [
      "Client",
      "Email",
      "Chambre",
      "Note",
      "Commentaire",
      "Date",
      "Statut",
    ];

    const rows = filteredReviews.map((review) => [
      review.name,
      review.email,
      review.room + " " + review.roomNumber,
      review.note,
      review.comment,
      review.date + " " + review.time,
      review.status === "publie"
        ? "Publié"
        : "En attente",
    ]);

    function escapeCsv(value) {
      return (
        '"' +
        String(value ?? "").replace(/"/g, '""') +
        '"'
      );
    }

    const csv = [headers, ...rows]
      .map((row) =>
        row.map(escapeCsv).join(";")
      )
      .join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "hotelhub-avis.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-avis">
      <main className="avis-content">

        {/* En-tête */}
        <div className="avis-pagehead">
          <div className="avis-pagehead__titles">
            <div className="avis-pagehead__row">
              <span className="avis-pagehead__star">
                <Star size={23} />
              </span>

              <h1>Gestion des avis</h1>
            </div>

            <p>
              Modérez et gérez les avis des clients de votre hôtel.
            </p>
          </div>

          <div className="avis-daterange">
            <CalendarDays size={18} />
            <span>Tous les avis</span>
          </div>
        </div>

        {/* Notifications */}
        {notice && (
          <div className="avis-notice" role="status">
            <span>{notice}</span>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Erreur API */}
        {error && (
          <div className="avis-notice" role="alert">
            <span>{error}</span>

            <button
              type="button"
              onClick={fetchReviews}
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Statistiques */}
        <div className="avis-stats">

          <article className="avis-stat">
            <span className="avis-stat__icon">
              <MessageSquare size={22} />
            </span>

            <div className="avis-stat__body">
              <h3>Total des avis</h3>
              <div className="avis-stat__value">{total}</div>
              <small>Tous les avis enregistrés</small>
            </div>
          </article>

          <article className="avis-stat">
            <span className="avis-stat__icon">
              <Star size={22} />
            </span>

            <div className="avis-stat__body">
              <h3>Note moyenne</h3>
              <div className="avis-stat__value">
                {average} / 5
              </div>
              <small>Moyenne des notes</small>
            </div>
          </article>

          <article className="avis-stat">
            <span className="avis-stat__icon">
              <Check size={22} />
            </span>

            <div className="avis-stat__body">
              <h3>Avis publiés</h3>
              <div className="avis-stat__value">
                {published}
              </div>
              <small>Avis visibles par les clients</small>
            </div>
          </article>

          <article className="avis-stat">
            <span className="avis-stat__icon avis-stat__icon--alert">
              <Clock size={22} />
            </span>

            <div className="avis-stat__body">
              <h3>En attente</h3>
              <div className="avis-stat__value">
                {pending}
              </div>
              <small>Avis à modérer</small>
            </div>
          </article>
        </div>

        {/* Tableau */}
        <div className="avis-layout">
          <section className="avis-panel">

            {/* Filtres */}
            <div className="avis-filters">

              <div className="avis-search avis-search--small">
                <Search size={17} />

                <input
                  type="search"
                  placeholder="Rechercher un avis..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />
              </div>

              <div className="avis-select">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                  aria-label="Filtrer par statut"
                >
                  <option value="tous">
                    Tous les statuts
                  </option>
                  <option value="publie">Publié</option>
                  <option value="attente">En attente</option>
                </select>

                <ChevronDown size={15} />
              </div>

              <div className="avis-select">
                <select
                  value={noteFilter}
                  onChange={(e) =>
                    setNoteFilter(e.target.value)
                  }
                  aria-label="Filtrer par note"
                >
                  <option value="toutes">
                    Toutes les notes
                  </option>
                  <option value="5">5 étoiles</option>
                  <option value="4">4 étoiles</option>
                  <option value="3">3 étoiles</option>
                  <option value="2">2 étoiles</option>
                  <option value="1">1 étoile</option>
                </select>

                <ChevronDown size={15} />
              </div>

              <button
                className="avis-reset"
                type="button"
                onClick={resetFilters}
              >
                Réinitialiser
              </button>

              <button
                className="avis-reset"
                type="button"
                onClick={fetchReviews}
                disabled={loading}
                title="Actualiser les avis"
              >
                <RefreshCw size={15} />
              </button>

              <button
                className="avis-reset"
                type="button"
                onClick={exportReviews}
              >
                Exporter CSV
              </button>
            </div>

            {/* Chargement */}
            {loading ? (
              <div className="avis-empty">
                Chargement des avis depuis la base de données...
              </div>
            ) : (
              <div className="avis-tablewrap">
                <table className="avis-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Chambre</th>
                      <th>Note</th>
                      <th className="col-comment">
                        Commentaire
                      </th>
                      <th>Date</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredReviews.map((review) => (
                      <tr
                        key={review.id}
                        className={
                          review.id === selectedId
                            ? "is-selected"
                            : ""
                        }
                        onClick={() =>
                          setSelectedId(review.id)
                        }
                      >
                        <td>
                          <div className="client-cell">
                            <div className="avis-avatar">
                              {review.name
                                .split(" ")
                                .map((part) => part[0])
                                .join("")
                                .slice(0, 2)}
                            </div>

                            <div>
                              <strong>{review.name}</strong>
                              <small>{review.email}</small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="room-cell">
                            {review.room}
                            <small>
                              {review.roomNumber}
                            </small>
                          </div>
                        </td>

                        <td>
                          <div className="note-cell">
                            <Stars note={review.note} />
                            <span>
                              {review.note.toFixed(1)}
                            </span>
                          </div>
                        </td>

                        <td className="col-comment">
                          <p className="comment-text">
                            {review.comment}
                          </p>
                        </td>

                        <td>
                          <div className="date-cell">
                            {review.date}
                            <small>{review.time}</small>
                          </div>
                        </td>

                        <td>
                          <Status status={review.status} />
                        </td>

                        <td>
                          <div className="action-cell">

                            <button
                              className="action-btn"
                              type="button"
                              title="Voir"
                              aria-label="Voir l'avis"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(review.id);
                              }}
                            >
                              <Eye size={17} />
                            </button>

                            <button
                              className="action-btn"
                              type="button"
                              title="Changer le statut"
                              aria-label="Changer le statut"
                              onClick={(e) => {
                                e.stopPropagation();
                                changeStatus(review.id);
                              }}
                            >
                              {review.status === "publie" ? (
                                <Clock size={16} />
                              ) : (
                                <Check size={16} />
                              )}
                            </button>

                            <button
                              className="action-btn action-btn--danger"
                              type="button"
                              title="Supprimer"
                              aria-label="Supprimer l'avis"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteReview(review.id);
                              }}
                            >
                              <Trash2 size={16} />
                            </button>

                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredReviews.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="avis-empty"
                        >
                          {error
                            ? "Impossible de charger les avis."
                            : "Aucun avis trouvé."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="avis-pagination">
              <span>
                {filteredReviews.length} avis affichés
              </span>
            </div>

          </section>
        </div>

        

      </main>
    </div>
  );
}
