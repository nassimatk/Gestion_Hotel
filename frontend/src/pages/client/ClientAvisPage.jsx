
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getAvisChambre,
  createAvis,
  updateAvis,
  deleteAvis,
} from "../../services/avisApi";

import "./ClientAvisPage.css";

const extraireListe = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.avis)) return response.avis;
  if (Array.isArray(response?.reviews)) return response.reviews;
  return [];
};

const getUserId = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const payload = JSON.parse(
      atob(
        token.split(".")[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );

    return String(
      payload.sub ?? payload.user_id ?? payload.id ?? ""
    );
  } catch {
    return null;
  }
};

const getNomClient = (item) =>
  item.user?.name ||
  item.utilisateur?.name ||
  item.client?.name ||
  `Client ${item.user_id ?? ""}`;

const getInitiales = (nom) => {
  return nom
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0].toUpperCase())
    .join("");
};

function ClientAvisPage() {
  const { id } = useParams();

  const [avis, setAvis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState("");

  const [avisEdition, setAvisEdition] = useState(null);
  const [formVisible, setFormVisible] = useState(false);

  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [filtre, setFiltre] = useState("tous");

  const utilisateurId = getUserId();

  // Chargement des avis
  const chargerAvis = async () => {
    try {
      setLoading(true);
      setErreur("");

      const response = await getAvisChambre(id);
      setAvis(extraireListe(response));
    } catch (error) {
      console.error("Erreur chargement avis :", error);
      setErreur("Impossible de charger les avis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerAvis();
  }, [id]);

  // Calcul de la moyenne
  const moyenne = useMemo(() => {
    if (!avis.length) return "0.00";

    const total = avis.reduce(
      (somme, item) => somme + Number(item.note || 0),
      0
    );

    return (total / avis.length).toFixed(2);
  }, [avis]);

  // Répartition des notes
  const distribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map((n) => {
      const nombre = avis.filter(
        (item) => Number(item.note) === n
      ).length;

      return {
        note: n,
        nombre,
        pourcentage: avis.length
          ? (nombre / avis.length) * 100
          : 0,
      };
    });
  }, [avis]);

  // Vérifier si l'avis appartient au client connecté
  const estProprietaire = (item) => {
    if (!utilisateurId) return false;

    const proprietaire =
      item.user_id ??
      item.utilisateur_id ??
      item.user?.id ??
      item.utilisateur?.id ??
      item.client?.id;

    return (
      proprietaire != null &&
      String(proprietaire) === utilisateurId
    );
  };

  // Filtrage des avis
  const avisFiltres = useMemo(() => {
    if (filtre === "tous") return avis;

    const noteFiltre = Number(filtre);

    return avis.filter(
      (item) => Number(item.note) === noteFiltre
    );
  }, [avis, filtre]);

  // Réinitialiser le formulaire
  const reinitialiserFormulaire = () => {
    setNote(5);
    setCommentaire("");
    setAvisEdition(null);
    setFormVisible(false);
    setMessage("");
  };

  // Ajouter ou modifier un avis
  const soumettreAvis = async (e) => {
    e.preventDefault();

    if (!localStorage.getItem("token")) {
      setMessage("Veuillez vous connecter pour publier un avis.");
      return;
    }

    if (!commentaire.trim()) {
      setMessage("Veuillez saisir un commentaire.");
      return;
    }

    const payload = {
      chambre_id: Number(id),
      note: Number(note),
      commentaire: commentaire.trim(),
    };

    try {
      setEnvoi(true);
      setMessage("");

      if (avisEdition) {
        await updateAvis(avisEdition.id, payload);
        setMessage("Votre avis a été modifié avec succès.");
      } else {
        await createAvis(payload);
        setMessage("Votre avis a été publié avec succès.");
      }

      await chargerAvis();
      reinitialiserFormulaire();
    } catch (error) {
      console.error("Erreur enregistrement avis :", error);
      setMessage(error.message || "Une erreur est survenue.");
    } finally {
      setEnvoi(false);
    }
  };

  // Modifier un avis
  const modifierAvis = (item) => {
    setAvisEdition(item);
    setNote(Number(item.note));
    setCommentaire(item.commentaire || "");
    setMessage("");
    setFormVisible(true);

    setTimeout(() => {
      document
        .getElementById("formulaire-avis")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  // Supprimer un avis
  const supprimerAvis = async (item) => {
    const confirmation = window.confirm(
      "Voulez-vous vraiment supprimer cet avis ?"
    );

    if (!confirmation) return;

    try {
      await deleteAvis(item.id);

      setMessage("Votre avis a été supprimé avec succès.");

      if (avisEdition?.id === item.id) {
        reinitialiserFormulaire();
      }

      await chargerAvis();
    } catch (error) {
      console.error("Erreur suppression avis :", error);
      setMessage(error.message || "Impossible de supprimer cet avis.");
    }
  };

  return (
    <section className="client-avis-page">
      <div className="avis-container">

        {/* EN-TÊTE */}
        <header className="avis-header">
          <div>
            <span className="avis-eyebrow">
              EXPÉRIENCES VÉCUES
            </span>

            <h1>Avis & impressions des hôtes</h1>

            <p>
              Découvrez les expériences et les impressions
              de nos voyageurs.
            </p>
          </div>

          <div className="avis-filtres">
            {[
              { value: "tous", label: `Tous les avis (${avis.length})` },
              { value: "5", label: "5 ★" },
              { value: "4", label: "4 ★" },
              { value: "3", label: "3 ★" },
              { value: "2", label: "2 ★" },
              { value: "1", label: "1 ★" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                className={`avis-filtre-btn ${
                  filtre === item.value ? "active" : ""
                }`}
                onClick={() => setFiltre(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        {/* STATISTIQUES */}
        <div className="avis-resume">

          <div className="avis-score-global">
            <div className="avis-score-valeur">
              <h2>{moyenne}</h2>
              <span className="avis-score-sur">/ 5</span>
            </div>

            <div className="avis-etoiles">
              {"★".repeat(Math.round(Number(moyenne)))}
              {"☆".repeat(5 - Math.round(Number(moyenne)))}
            </div>

            <span className="avis-score-meta">
              NOTE MOYENNE DES VOYAGEURS
            </span>

            <p>
              Basée sur {avis.length} avis publiés
              par nos clients.
            </p>
          </div>

          <div className="avis-distribution">
            {distribution.map((item) => (
              <div className="avis-distribution-item" key={item.note}>
                <span>{item.note} étoiles</span>

                <div className="avis-barre-fond">
                  <div
                    className="avis-barre-remplissage"
                    style={{
                      width: `${item.pourcentage}%`,
                    }}
                  />
                </div>

                <strong>{item.nombre}</strong>
              </div>
            ))}
          </div>

        </div>
  {/* BOUTON AJOUTER */}
        {!formVisible && (
          <div className="avis-ajouter-zone">
            <button
              type="button"
              className="avis-ajouter-btn"
              onClick={() => {
                setAvisEdition(null);
                setNote(5);
                setCommentaire("");
                setMessage("");
                setFormVisible(true);
              }}
            >
              + Partager votre expérience
            </button>
          </div>
        )}
        {/* MESSAGE */}
        {message && (
          <p className="avis-message" role="status">
            {message}
          </p>
        )}

        {/* LISTE DES AVIS */}
        <div className="avis-section-titre">
          <h2>Les expériences de nos voyageurs</h2>
          <span>{avisFiltres.length} avis affichés</span>
        </div>

        {loading ? (
          <p className="avis-info">Chargement des avis...</p>
        ) : erreur ? (
          <p className="avis-erreur">{erreur}</p>
        ) : avisFiltres.length === 0 ? (
          <div className="avis-vide">
            <span>☆</span>
            <h3>Aucun avis disponible</h3>
            <p>
              {avis.length === 0
                ? "Soyez le premier à partager votre expérience !"
                : "Aucun avis ne correspond à ce filtre."}
            </p>
          </div>
        ) : (
          <div className="avis-liste">
            {avisFiltres.map((item) => {
              const nom = getNomClient(item);

              const noteItem = Math.min(
                5,
                Math.max(0, Number(item.note) || 0)
              );

              const date = item.created_at
                ? new Date(item.created_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "";

              return (
                <article className="avis-card" key={item.id}>

                  {/* INFORMATIONS CLIENT */}
                  <div className="avis-card-header">

                    <div className="avis-auteur-bloc">
                      <div className="avis-avatar">
                        {getInitiales(nom)}
                      </div>

                      <div>
                        <h3>{nom}</h3>
                        <p>Voyageur</p>
                      </div>
                    </div>

                    <div className="avis-note-badge">
                      <div className="avis-etoiles">
                        {"★".repeat(noteItem)}
                        {"☆".repeat(5 - noteItem)}
                      </div>
                    </div>

                  </div>

                  {/* COMMENTAIRE */}
                  <p className="avis-commentaire-texte">
                    {item.commentaire || "Aucun commentaire."}
                  </p>

                  {/* PIED DE CARTE */}
                  <div className="avis-card-footer">
                    <span>Publié le : {date}</span>

                    {estProprietaire(item) && (
                      <span className="avis-proprietaire">
                        Mon avis
                      </span>
                    )}
                  </div>

                  {/* ACTIONS */}
                  {estProprietaire(item) && (
                    <div className="avis-actions">

                      <button
                        type="button"
                        onClick={() => modifierAvis(item)}
                      >
                        Modifier mon avis
                      </button>

                      <button
                        type="button"
                        className="avis-delete"
                        onClick={() => supprimerAvis(item)}
                      >
                        Supprimer
                      </button>

                    </div>
                  )}

                </article>
              );
            })}
          </div>
        )}

      

        {/* FORMULAIRE AJOUT / MODIFICATION */}
        {formVisible && (
          <div className="avis-formulaire" id="formulaire-avis">

            <span className="avis-eyebrow">
              VOTRE EXPÉRIENCE
            </span>

            <h2>
              {avisEdition
                ? "Modifier mon avis"
                : "Partager votre expérience"}
            </h2>

            <p>
              Votre opinion nous aide à améliorer
              l'expérience de nos voyageurs.
            </p>

            <form onSubmit={soumettreAvis}>

              <label>Votre note</label>

              <div className="avis-choix-notes">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={n <= note ? "selected" : ""}
                    onClick={() => setNote(n)}
                    aria-label={`${n} étoiles`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <label htmlFor="commentaire-avis">
                Votre commentaire
              </label>

              <textarea
                id="commentaire-avis"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Partagez votre expérience..."
                rows={5}
                maxLength={1000}
                required
              />

              <span className="avis-compteur">
                {commentaire.length}/1000 caractères
              </span>

              {message && (
                <p className="avis-message">{message}</p>
              )}

              <div className="avis-form-actions">

                <button type="submit" disabled={envoi}>
                  {envoi
                    ? "Enregistrement..."
                    : avisEdition
                    ? "Enregistrer les modifications"
                    : "Publier mon avis"}
                </button>

                <button
                  type="button"
                  className="avis-cancel"
                  onClick={reinitialiserFormulaire}
                >
                  Annuler
                </button>

              </div>

            </form>
          </div>
        )}

      </div>
    </section>
  );
}

export default ClientAvisPage;
