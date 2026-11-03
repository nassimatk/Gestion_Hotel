
import { useCallback, useEffect, useState } from "react";
import {
  Star,
  Send,
  MessageSquare,
  Pencil,
  Trash2,
  X,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import "./clientAvisPage.css";
import { API } from "../../config/api";

// ======================================================
// CONFIGURATION
// ======================================================

const CHAMBRE_ID = 1;
const CHAMBRE_NAME = "Suite Impériale Panorama";

const AVIS_URL = `${API.avis}/avis`;

// ======================================================
// AUTHENTIFICATION JWT
// ======================================================

// Récupérer le token enregistré après connexion
function getAuthToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token")
  );
}

// Extraire le user_id depuis le JWT
// Le backend reste responsable de la vérification du token.
function getCurrentUserId() {
  const token = getAuthToken();

  if (!token) return null;

  try {
    const payload = token.split(".")[1];

    if (!payload) return null;

    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const decoded = JSON.parse(
      decodeURIComponent(
        atob(base64)
          .split("")
          .map((char) =>
            "%" + char.charCodeAt(0).toString(16).padStart(2, "0")
          )
          .join("")
      )
    );

    return Number(decoded.sub) || null;
  } catch (error) {
    console.error("Impossible de lire le JWT :", error);
    return null;
  }
}

// ======================================================
// FONCTION API
// ======================================================

async function apiRequest(url, options = {}, requiresAuth = false) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Ajouter le JWT pour les opérations protégées
  if (requiresAuth) {
    const token = getAuthToken();

    if (!token) {
      throw new Error(
        "Vous devez vous connecter pour effectuer cette action."
      );
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();

  let result = {};

  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    result = { message: text };
  }

  if (!response.ok) {
    const validationErrors = result.errors
      ? Object.values(result.errors).flat().join(" ")
      : "";

    if (response.status === 401) {
      throw new Error(
        result.message ||
        "Session expirée. Veuillez vous reconnecter."
      );
    }

    if (response.status === 403) {
      throw new Error(
        result.message ||
        "Vous n'avez pas l'autorisation d'effectuer cette action."
      );
    }

    throw new Error(
      validationErrors ||
      result.message ||
      `Erreur HTTP ${response.status}`
    );
  }

  return result;
}

// ======================================================
// EXTRACTION DES AVIS
// ======================================================

function extractReviews(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.data?.data)) {
    return result.data.data;
  }

  return [];
}

// ======================================================
// NORMALISATION DES AVIS
// ======================================================

function normalizeReview(review) {
  const userId = review.user_id ?? review.id_user;

  return {
    id: review.id,
    user_id: userId,
    chambre_id: review.chambre_id ?? review.id_chambre,
    roomName: CHAMBRE_NAME,
    author: `Client ${userId ?? ""}`,
    rating: Number(review.note ?? review.rating ?? 0),
    comment: review.commentaire ?? review.comment ?? "",
    date: review.created_at ?? review.updated_at ?? null,
  };
}

// ======================================================
// FORMATAGE DATE
// ======================================================

function formatDate(date) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ======================================================
// COMPOSANT PRINCIPAL
// ======================================================

export default function ReviewForm() {
  const [reviews, setReviews] = useState([]);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Identifiant du client connecté
  const currentUserId = getCurrentUserId();

  // ====================================================
  // CHARGER LES AVIS DEPUIS L'API
  // ====================================================

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Consultation publique : pas de JWT nécessaire
      const result = await apiRequest(AVIS_URL);

      const data = extractReviews(result);

      setReviews(
        data
          .map(normalizeReview)
          .filter(
            (review) =>
              Number(review.chambre_id) === CHAMBRE_ID
          )
          .sort((a, b) => Number(b.id) - Number(a.id))
      );
    } catch (err) {
      console.error("Erreur chargement avis :", err);

      setError(
        `Impossible de charger les avis. ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // ====================================================
  // RÉINITIALISER LE FORMULAIRE
  // ====================================================

  function resetForm() {
    setRating(0);
    setHoverRating(0);
    setComment("");
    setEditingId(null);
  }

  // ====================================================
  // AJOUTER OU MODIFIER UN AVIS
  // ====================================================

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!getAuthToken()) {
      setError("Veuillez vous connecter pour publier un avis.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Veuillez sélectionner une note entre 1 et 5.");
      return;
    }

    if (!comment.trim()) {
      setError("Veuillez écrire un commentaire.");
      return;
    }

    if (submitting) return;

    // IMPORTANT :
    // Ne pas envoyer user_id.
    // Le backend récupère user_id depuis le JWT.
    const payload = {
      chambre_id: CHAMBRE_ID,
      note: Number(rating),
      commentaire: comment.trim(),
    };

    setSubmitting(true);

    try {
      if (editingId !== null) {
        // ----------------------------------------------
        // MODIFICATION D'UN AVIS
        // ----------------------------------------------

        await apiRequest(
          `${AVIS_URL}/${editingId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              note: Number(rating),
              commentaire: comment.trim(),
            }),
          },
          true
        );

        setSuccess("Avis modifié avec succès.");

      } else {
        // ----------------------------------------------
        // CRÉATION D'UN AVIS
        // ----------------------------------------------

        await apiRequest(
          AVIS_URL,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
          true
        );

        setSuccess("Avis ajouté avec succès.");
      }

      resetForm();

      await loadReviews();

    } catch (err) {
      console.error("Erreur lors de l'enregistrement :", err);

      setError(
        `Échec de l'enregistrement : ${err.message}`
      );

    } finally {
      setSubmitting(false);
    }
  }

  // ====================================================
  // PRÉPARER LA MODIFICATION
  // ====================================================

  function handleEdit(review) {
    if (Number(review.user_id) !== currentUserId) {
      setError("Vous ne pouvez modifier que vos propres avis.");
      return;
    }

    setEditingId(review.id);
    setRating(review.rating);
    setComment(review.comment);

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ====================================================
  // SUPPRIMER UN AVIS
  // ====================================================

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cet avis ?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `${AVIS_URL}/${id}`,
        {
          method: "DELETE",
        },
        true
      );

      setSuccess("Avis supprimé avec succès.");

      if (editingId === id) {
        resetForm();
      }

      await loadReviews();

    } catch (err) {
      console.error("Erreur suppression avis :", err);

      setError(
        `Impossible de supprimer l'avis : ${err.message}`
      );
    }
  }

  // ====================================================
  // CALCULER LA NOTE MOYENNE
  // ====================================================

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (total, review) => total + review.rating,
            0
          ) / reviews.length
        ).toFixed(1)
      : "0.0";

  // ====================================================
  // AFFICHAGE
  // ====================================================

  return (
    <main className="review-page">
      <section className="review-container">

        {/* EN-TÊTE */}

        <header className="review-header">
          <div className="review-header-icon">
            <MessageSquare size={28} />
          </div>

          <div>
            <h1>Avis des clients</h1>

            <p>
              Partagez votre expérience de séjour avec les
              autres voyageurs.
            </p>
          </div>
        </header>

        {/* INFORMATIONS DE LA CHAMBRE */}

        <section className="review-room-card">
          <div>
            <span className="review-room-label">
              CHAMBRE
            </span>

            <h2>{CHAMBRE_NAME}</h2>

            <p>
              Votre opinion nous aide à améliorer la qualité
              de nos services.
            </p>
          </div>

          <div className="review-average">
            <strong>{averageRating}</strong>

            <div className="review-average-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={17}
                  fill={
                    star <= Math.round(Number(averageRating))
                      ? "currentColor"
                      : "none"
                  }
                />
              ))}
            </div>

            <span>{reviews.length} avis</span>
          </div>
        </section>

        {/* MESSAGES */}

        {error && (
          <div
            className="review-alert review-alert-error"
            role="alert"
          >
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            className="review-alert review-alert-success"
            role="status"
          >
            <span>{success}</span>
          </div>
        )}

        {/* FORMULAIRE */}

        <section className="review-form-card">
          <div className="review-section-heading">
            <h2>
              {editingId !== null
                ? "Modifier votre avis"
                : "Donner votre avis"}
            </h2>

            <p>
              Évaluez votre expérience et laissez un commentaire.
            </p>
          </div>

          {!getAuthToken() && (
            <p className="review-rating-help">
              Connectez-vous pour publier un avis.
            </p>
          )}

          <form onSubmit={handleSubmit}>

            {/* NOTE */}

            <div className="review-field">
              <label>Votre note *</label>

              <div
                className="review-rating-selector"
                role="group"
                aria-label="Sélectionner une note"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={
                      star <= (hoverRating || rating)
                        ? "review-star active"
                        : "review-star"
                    }
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
                    aria-pressed={rating === star}
                  >
                    <Star
                      size={30}
                      fill={
                        star <= (hoverRating || rating)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                ))}
              </div>

              <span className="review-rating-help">
                {rating === 0
                  ? "Sélectionnez une note sur 5"
                  : `${rating}/5 — ${
                      rating === 5
                        ? "Excellent"
                        : rating === 4
                        ? "Très bien"
                        : rating === 3
                        ? "Bien"
                        : rating === 2
                        ? "Moyen"
                        : "Insuffisant"
                    }`}
              </span>
            </div>

            {/* COMMENTAIRE */}

            <div className="review-field">
              <label htmlFor="review-comment">
                Votre commentaire *
              </label>

              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) =>
                  setComment(event.target.value)
                }
                placeholder="Décrivez votre expérience..."
                rows={5}
                maxLength={2000}
                required
              />

              <span className="review-character-count">
                {comment.length}/2000 caractères
              </span>
            </div>

            {/* ACTIONS */}

            <div className="review-form-actions">
              {editingId !== null && (
                <button
                  type="button"
                  className="review-cancel-button"
                  onClick={resetForm}
                  disabled={submitting}
                >
                  <X size={18} />
                  Annuler
                </button>
              )}

              <button
                type="submit"
                className="review-submit-button"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="review-spinner"
                    />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Send size={18} />

                    {editingId !== null
                      ? "Enregistrer les modifications"
                      : "Publier mon avis"}
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* LISTE DES AVIS */}

        <section className="review-list-section">
          <div className="review-list-heading">
            <div>
              <h2>Commentaires des clients</h2>

              <p>
                Découvrez les expériences partagées.
              </p>
            </div>

            <button
              type="button"
              className="review-refresh-button"
              onClick={loadReviews}
              disabled={loading}
              title="Actualiser les avis"
            >
              <RefreshCw size={18} />
              Actualiser
            </button>
          </div>

          {loading ? (
            <div className="review-loading">
              <LoaderCircle
                size={30}
                className="review-spinner"
              />

              <p>Chargement des avis...</p>
            </div>

          ) : reviews.length === 0 ? (
            <div className="review-empty">
              <MessageSquare size={38} />

              <h3>Aucun avis pour le moment</h3>

              <p>
                Soyez le premier à partager votre expérience.
              </p>
            </div>

          ) : (
            <div className="review-list">
              {reviews.map((review) => (
                <article
                  className="review-item"
                  key={review.id}
                >
                  <div className="review-item-top">
                    <div className="review-avatar">
                      {review.author.charAt(0).toUpperCase() || "C"}
                    </div>

                    <div className="review-author-info">
                      <h3>{review.author}</h3>

                      <span className="review-date">
                        {formatDate(review.date)}
                      </span>
                    </div>

                    <div className="review-item-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={15}
                          fill={
                            star <= review.rating
                              ? "currentColor"
                              : "none"
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <p className="review-comment-text">
                    {review.comment}
                  </p>

                  <div className="review-item-actions">
                    {currentUserId !== null &&
                      Number(review.user_id) === currentUserId && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEdit(review)}
                            className="review-edit-button"
                          >
                            <Pencil size={15} />
                            Modifier
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(review.id)}
                            className="review-delete-button"
                          >
                            <Trash2 size={15} />
                            Supprimer
                          </button>
                        </>
                      )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
