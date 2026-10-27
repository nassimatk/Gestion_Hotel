import { useState, useEffect } from "react";
import { createChambre, updateChambre } from "../../../services/chambresApi";

export default function ChambreFormModal({ chambre, onClose, onSuccess }) {
  const isEditing = Boolean(chambre);

  const [formData, setFormData] = useState({
    numero_etage: 1,
    nom: "",
    description: "",
    capacite_max: 2,
    nombre_lits: 1,
    type_lits: "King Size",
    surface: 35,
    prix_nuit: 1200,
    devise: "MAD",
    statut: "active",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (chambre) {
      setFormData({
        numero_etage: chambre.numero_etage || 1,
        nom: chambre.nom || "",
        description: chambre.description || "",
        capacite_max: chambre.capacite_max || 2,
        nombre_lits: chambre.nombre_lits || 1,
        type_lits: chambre.type_lits || "King Size",
        surface: chambre.surface || 35,
        prix_nuit: chambre.prix_nuit || 1200,
        devise: chambre.devise || "MAD",
        statut: chambre.statut || "active",
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
    setSubmitting(true);
    setErrorMsg("");

    try {
      if (isEditing) {
        await updateChambre(chambre.id, formData);
      } else {
        await createChambre(formData);
      }
      onSuccess();
    } catch (err) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement de la chambre.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">
            {isEditing ? `Modifier la Chambre #${chambre.id}` : "Ajouter une Nouvelle Chambre"}
          </h3>
          <button className="admin-modal-close" onClick={onClose}>✕</button>
        </div>

        {errorMsg && (
          <div className="admin-chambres__alert admin-chambres__alert--error" style={{ margin: "16px 24px 0" }}>
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-modal-form">
          <div className="admin-modal-row">
            <div className="admin-modal-field">
              <label>Nom de la chambre *</label>
              <input
                type="text"
                name="nom"
                required
                value={formData.nom}
                onChange={handleChange}
                placeholder="Ex. Suite Royale Atlas"
              />
            </div>
            <div className="admin-modal-field" style={{ maxWidth: "120px" }}>
              <label>Étage *</label>
              <input
                type="number"
                name="numero_etage"
                min="0"
                required
                value={formData.numero_etage}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="admin-modal-field">
            <label>Description</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Description de la vue, des équipements de luxe, etc."
            />
          </div>

          <div className="admin-modal-grid3">
            <div className="admin-modal-field">
              <label>Capacité max (pers.) *</label>
              <input
                type="number"
                name="capacite_max"
                min="1"
                required
                value={formData.capacite_max}
                onChange={handleChange}
              />
            </div>
            <div className="admin-modal-field">
              <label>Nb. de lits *</label>
              <input
                type="number"
                name="nombre_lits"
                min="1"
                required
                value={formData.nombre_lits}
                onChange={handleChange}
              />
            </div>
            <div className="admin-modal-field">
              <label>Type de lits *</label>
              <select name="type_lits" value={formData.type_lits} onChange={handleChange}>
                <option value="King Size">King Size</option>
                <option value="Queen Size">Queen Size</option>
                <option value="2 Lits Simples">2 Lits Simples</option>
                <option value="Lit Double">Lit Double</option>
              </select>
            </div>
          </div>

          <div className="admin-modal-grid3">
            <div className="admin-modal-field">
              <label>Surface (m²) *</label>
              <input
                type="number"
                step="0.1"
                min="1"
                name="surface"
                required
                value={formData.surface}
                onChange={handleChange}
              />
            </div>
            <div className="admin-modal-field">
              <label>Prix par nuit *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="prix_nuit"
                required
                value={formData.prix_nuit}
                onChange={handleChange}
              />
            </div>
            <div className="admin-modal-field">
              <label>Devise</label>
              <input
                type="text"
                name="devise"
                readOnly
                value={formData.devise}
                style={{ backgroundColor: "#f1f5f9" }}
              />
            </div>
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="admin-chambres__btn-secondary" onClick={onClose} disabled={submitting}>
              Annuler
            </button>
            <button type="submit" className="admin-chambres__btn-add" disabled={submitting}>
              {submitting ? "Enregistrement..." : isEditing ? "Enregistrer les modifications" : "Créer la chambre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
