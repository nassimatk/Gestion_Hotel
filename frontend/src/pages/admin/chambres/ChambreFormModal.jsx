import { useState, useEffect } from "react";
import { createChambre, updateChambre } from "../../../services/chambresApi";
import "./AdminChambres.css";

export default function ChambreFormModal({ chambre, onClose, onSuccess }) {
  const isEditing = Boolean(chambre);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    numero: "",
    type: "simple",
    capacite: 2,
    prix_nuit: 750,
    etage: 1,
    superficie: 30,
    vue: "Mer",
    statut: "disponible",
    description: "",
    equipementsText: "Wi-Fi, Climatisation, TV, Coffre-fort",
    imageUrl: "",
  });

  // Pré-remplir en mode édition
  useEffect(() => {
    if (chambre) {
      const eqList = Array.isArray(chambre.equipements)
        ? chambre.equipements.join(", ")
        : chambre.equipements || "";
      const imgFirst = Array.isArray(chambre.images) && chambre.images.length > 0
        ? chambre.images[0]
        : "";

      setFormData({
        numero: chambre.numero || "",
        type: chambre.type || "simple",
        capacite: chambre.capacite || 2,
        prix_nuit: chambre.prix_nuit || 750,
        etage: chambre.etage !== undefined && chambre.etage !== null ? chambre.etage : 1,
        superficie: chambre.superficie || 30,
        vue: chambre.vue || "Mer",
        statut: chambre.statut || "disponible",
        description: chambre.description || "",
        equipementsText: eqList,
        imageUrl: imgFirst,
      });
    }
  }, [chambre]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.numero) {
      setError("Le numéro de chambre est obligatoire.");
      return;
    }

    setLoading(true);

    try {
      // Préparation du payload conforme à la base de données de chambres-service
      const payload = {
        numero: String(formData.numero).trim(),
        type: formData.type,
        capacite: Number(formData.capacite),
        prix_nuit: Number(formData.prix_nuit),
        etage: Number(formData.etage),
        superficie: Number(formData.superficie),
        vue: formData.vue,
        statut: formData.statut,
        description: formData.description,
        equipements: formData.equipementsText
          ? formData.equipementsText.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        images: formData.imageUrl ? [formData.imageUrl.trim()] : [],
      };

      if (isEditing) {
        await updateChambre(chambre.id, payload);
      } else {
        await createChambre(payload);
      }

      onSuccess();
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement de la chambre.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* En-tête de la modale */}
        <div className="admin-modal-header">
          <div>
            <h2 className="admin-modal-title">
              {isEditing ? `Modifier la Chambre N° ${chambre.numero}` : "Ajouter une Nouvelle Chambre"}
            </h2>
            <p className="admin-modal-subtitle">
              Renseignez les spécifications techniques et tarifaires (en dirhams MAD).
            </p>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && (
          <div className="admin-modal-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-modal-form">
          {/* Ligne 1 : Numéro & Type */}
          <div className="admin-modal-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Numéro de chambre *</label>
              <input
                type="text"
                name="numero"
                className="admin-form-input"
                placeholder="Ex: 101, 204, 501"
                value={formData.numero}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Type de chambre *</label>
              <select
                name="type"
                className="admin-form-select"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="simple">Simple</option>
                <option value="double">Double</option>
                <option value="suite">Suite</option>
                <option value="presidentielle">Présidentielle</option>
              </select>
            </div>
          </div>

          {/* Ligne 2 : Prix en MAD & Capacité */}
          <div className="admin-modal-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Prix / Nuit (MAD) *</label>
              <input
                type="number"
                name="prix_nuit"
                className="admin-form-input"
                min="0"
                step="10"
                value={formData.prix_nuit}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Capacité (personnes) *</label>
              <input
                type="number"
                name="capacite"
                className="admin-form-input"
                min="1"
                max="10"
                value={formData.capacite}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Ligne 3 : Étage, Superficie & Vue */}
          <div className="admin-modal-row three-cols">
            <div className="admin-form-group">
              <label className="admin-form-label">Étage</label>
              <input
                type="number"
                name="etage"
                className="admin-form-input"
                min="0"
                max="20"
                value={formData.etage}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Superficie (m²)</label>
              <input
                type="number"
                name="superficie"
                className="admin-form-input"
                min="10"
                max="500"
                value={formData.superficie}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Vue</label>
              <input
                type="text"
                name="vue"
                className="admin-form-input"
                placeholder="Mer, Jardin, Piscine..."
                value={formData.vue}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Ligne 4 : Statut */}
          <div className="admin-form-group">
            <label className="admin-form-label">Statut d'occupation *</label>
            <select
              name="statut"
              className="admin-form-select"
              value={formData.statut}
              onChange={handleChange}
            >
              <option value="disponible">Disponible</option>
              <option value="occupee">Occupée</option>
              <option value="maintenance">En Maintenance</option>
            </select>
          </div>

          {/* Ligne 5 : URL de la photo principale */}
          <div className="admin-form-group">
            <label className="admin-form-label">URL de l'image</label>
            <input
              type="url"
              name="imageUrl"
              className="admin-form-input"
              placeholder="https://images.unsplash.com/photo-..."
              value={formData.imageUrl}
              onChange={handleChange}
            />
          </div>

          {/* Ligne 6 : Équipements */}
          <div className="admin-form-group">
            <label className="admin-form-label">Équipements (séparés par des virgules)</label>
            <input
              type="text"
              name="equipementsText"
              className="admin-form-input"
              placeholder="Wi-Fi, Climatisation, Mini-bar, Jacuzzi..."
              value={formData.equipementsText}
              onChange={handleChange}
            />
          </div>

          {/* Ligne 7 : Description */}
          <div className="admin-form-group">
            <label className="admin-form-label">Description détaillée</label>
            <textarea
              name="description"
              className="admin-form-textarea"
              rows="3"
              placeholder="Description raffinée de la chambre pour la clientèle..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Boutons d'action */}
          <div className="admin-modal-actions">
            <button type="button" className="admin-btn-cancel" onClick={onClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="admin-btn-save" disabled={loading}>
              {loading ? "Enregistrement..." : isEditing ? "Mettre à jour" : "Créer la chambre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
