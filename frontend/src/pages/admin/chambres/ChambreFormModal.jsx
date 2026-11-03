
import { useState, useEffect } from "react";
import "./AdminChambres.css";

export default function ChambreFormModal({
  chambre,
  onClose,
  onSuccess
}) {
  const isEditing = Boolean(chambre);

  const [photo, setPhoto] = useState("");

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

  // Préremplir les champs en mode modification
  useEffect(() => {
    if (chambre) {
      setFormData({
        numero_etage: chambre.numero_etage ?? 1,
        nom: chambre.nom ?? "",
        description: chambre.description ?? "",
        capacite_max: chambre.capacite_max ?? 2,
        nombre_lits: chambre.nombre_lits ?? 1,
        type_lits: chambre.type_lits ?? "King Size",
        surface: chambre.surface ?? 35,
        prix_nuit: chambre.prix_nuit ?? 1200,
        devise: chambre.devise ?? "MAD",
        statut: chambre.statut ?? "active",
      });
    }
  }, [chambre]);

  // Modifier les valeurs
  const handleChange = (event) => {
    const { name, value, type } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  // Sélectionner une photo
  const handlePhoto = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La taille de l'image ne doit pas dépasser 5 Mo.");
      event.target.value = "";
      return;
    }

    if (photo) {
      URL.revokeObjectURL(photo);
    }

    setPhoto(URL.createObjectURL(file));
  };

  // Enregistrer
  const handleSubmit = (event) => {
    event.preventDefault();
    onSuccess(formData);
  };

  return (
    <div
      className="admin-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="chamber-modal-container"
        onClick={(event) => event.stopPropagation()}
      >

        <main className="chamber-page">
          <div className="chamber-container">

            {/* HEADER */}
            <nav className="chamber-breadcrumb">
              <span>Gestion des chambres</span>
              <span className="breadcrumb-separator">/</span>
              <strong>
                {isEditing ? "Modifier une chambre" : "Ajouter une chambre"}
              </strong>
            </nav>

            <header className="chamber-header">
              <div>
                <div className="chamber-title-line">
                  <h1>
                    {isEditing
                      ? `Modifier la chambre #${chambre.id}`
                      : "Ajouter une chambre"}
                  </h1>
                </div>

                <p>
                  {isEditing
                    ? "Modifiez les informations de cette chambre."
                    : "Remplissez les informations pour ajouter une nouvelle chambre."}
                </p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
              >
                ✕
              </button>
            </header>

            <form
              className="chamber-form"
              onSubmit={handleSubmit}
            >

              {/* COLONNE PHOTO */}
              <aside className="photo-column">

                <div className="section-heading">
                  <h2>Photographie principale</h2>
                  <span>Recommandé</span>
                </div>

                <div className="photo-preview">
                  {photo ? (
                    <img src={photo} alt="Aperçu de la chambre" />
                  ) : (
                    <div className="photo-placeholder">
                      <span className="placeholder-icon">▧</span>
                      <span>Votre photo apparaîtra ici</span>
                    </div>
                  )}

                  <div className="photo-caption">
                    <span>
                      {photo
                        ? "Nouvelle image sélectionnée"
                        : "Aucune image sélectionnée"}
                    </span>
                    <span>1 / 8</span>
                  </div>
                </div>

                <label className="upload-zone">
                  <span className="upload-icon">♧</span>

                  <strong>
                    Glissez-déposez une nouvelle image ici
                  </strong>

                  <small>ou parcourez vos fichiers locaux</small>

                  <span className="choose-file">
                    ▣ &nbsp; Choisir une image
                  </span>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhoto}
                  />
                </label>

                <div className="photo-guidelines">
                  <p>
                    <span className="guideline-icon">ⓘ</span>
                    Formats acceptés : JPG, PNG, WEBP (Max 5 Mo).
                    Résolution recommandée : 1920×1080 px.
                  </p>

                  <p className="guideline-success">
                    <span>✓</span>
                    Une image nette et lumineuse valorise votre chambre.
                  </p>
                </div>

              </aside>

              {/* COLONNE INFORMATIONS */}
              <section className="details-column">

                <div className="section-heading">
                  <div>
                    <h2>Informations générales</h2>
                    <p>Présentez les caractéristiques de votre chambre.</p>
                  </div>
                </div>

                <div className="field-block">
                  <label htmlFor="room-name">
                    Nom de la chambre <span>*</span>
                  </label>

                  <input
                    id="room-name"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    placeholder="Ex. Suite Royale Atlas"
                    required
                  />
                </div>

                <div className="field-block">
                  <label htmlFor="room-description">
                    Description
                  </label>

                  <textarea
                    id="room-description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Description de la chambre..."
                  />

                  <small>
                    Décrivez les équipements et les particularités
                    de la chambre.
                  </small>
                </div>

                <div className="form-divider" />

                <div className="section-heading subsection-heading">
                  <h2>Caractéristiques de la chambre</h2>
                </div>

                <div className="fields-grid">

                  <div className="field-block">
                    <label htmlFor="room-floor">Étage *</label>

                    <input
                      id="room-floor"
                      name="numero_etage"
                      type="number"
                      min="0"
                      value={formData.numero_etage}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="field-block">
                    <label htmlFor="room-capacity">
                      Capacité max *
                    </label>

                    <input
                      id="room-capacity"
                      name="capacite_max"
                      type="number"
                      min="1"
                      value={formData.capacite_max}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="field-block">
                    <label htmlFor="room-beds">Nombre de lits *</label>

                    <input
                      id="room-beds"
                      name="nombre_lits"
                      type="number"
                      min="1"
                      value={formData.nombre_lits}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="field-block">
                    <label htmlFor="room-area">Surface (m²) *</label>

                    <input
                      id="room-area"
                      name="surface"
                      type="number"
                      min="1"
                      step="0.1"
                      value={formData.surface}
                      onChange={handleChange}
                      required
                    />
                  </div>

                </div>

                <div className="field-block">
                  <label htmlFor="room-bed-type">Type de lit *</label>

                  <select
                    id="room-bed-type"
                    name="type_lits"
                    value={formData.type_lits}
                    onChange={handleChange}
                    required
                  >
                    <option value="King Size">Lit King Size</option>
                    <option value="Queen Size">Lit Queen Size</option>
                    <option value="2 Lits Simples">2 Lits Simples</option>
                    <option value="Lit Double">Lit Double</option>
                  </select>
                </div>

                <div className="form-divider" />

                <div className="section-heading subsection-heading">
                  <h2>Tarification et disponibilité</h2>
                </div>

                <div className="fields-grid price-grid">

                  <div className="field-block">
                    <label htmlFor="room-price">
                      Prix par nuit *
                    </label>

                    <input
                      id="room-price"
                      name="prix_nuit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.prix_nuit}
                      onChange={handleChange}
                      required
                    />

                    <small>
                      Prix : {formData.prix_nuit} {formData.devise} / nuit
                    </small>
                  </div>

                  <div className="field-block">
                    <label htmlFor="room-currency">Devise</label>

                    <input
                      id="room-currency"
                      name="devise"
                      value={formData.devise}
                      readOnly
                    />
                  </div>

                </div>

                <div className="field-block">
                  <label htmlFor="room-status">Statut</label>

                  <select
                    id="room-status"
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                  >
                    <option value="active">Disponible</option>
                    <option value="inactive">Indisponible</option>
                    <option value="maintenance">En maintenance</option>
                  </select>
                </div>

                {/* ACTIONS */}
                <div className="form-actions">

                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={onClose}
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="btn-submit"
                  >
                    <span>{isEditing ? "✓" : "＋"}</span>

                    {isEditing
                      ? "Enregistrer les modifications"
                      : "Créer la chambre"}
                  </button>

                </div>

              </section>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
