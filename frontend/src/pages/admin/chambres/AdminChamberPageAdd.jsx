import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createChambre } from "../../../services/chambresApi";
import "./AdminChamberPageAdd.css";

export default function AdminChamberPageAdd() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // État du formulaire initialisé avec les valeurs représentatives du design
  const [form, setForm] = useState({
    nom: "Suite Majestueuse Palmeraie",
    numero: "201",
    type: "suite",
    description:
      "Baignée d'une lumière d'or tamisée, cette suite d'exception offre une terrasse privée suspendue sur la palmeraie, des boiseries d'ébène et une salle de bain en marbre italien avec baignoire îlot.",
    etage: 2,
    capacite: 3,
    nombreLits: 1,
    typeLits: "Lit King Size (180x200 cm)",
    superficie: 65,
    prixNuit: 4200,
    devise: "MAD (Dirham)",
    statut: "disponible",
    vue: "Palmeraie",
    equipementsText: "Terrasse privée, Baignoire îlot, Marbre italien, Boiseries d'ébène, Wi-Fi VIP",
    photoUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    photoName: "suite-palmeraie-vue-est.webp",
    photoSize: "2.4 Mo",
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  // Simuler le choix d'image par l'utilisateur
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La taille de l'image ne doit pas dépasser 5 Mo.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const sizeInMo = (file.size / (1024 * 1024)).toFixed(1) + " Mo";

    setForm((prev) => ({
      ...prev,
      photoUrl: previewUrl,
      photoName: file.name,
      photoSize: sizeInMo,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.nom || !form.numero || !form.prixNuit) {
      setError("Veuillez renseigner tous les champs obligatoires (*).");
      return;
    }

    setLoading(true);

    try {
      // Préparation du payload conforme aux exigences du microservice Chambres (Port 8001)
      const payload = {
        nom: form.nom ? form.nom.trim() : "",
        numero: String(form.numero).trim(),
        type: form.type,
        capacite: Number(form.capacite),
        prix_nuit: Number(form.prixNuit),
        description: form.description,
        superficie: Number(form.superficie),
        etage: Number(form.etage),
        vue: form.vue,
        statut: form.statut,
        equipements: form.equipementsText
          ? form.equipementsText.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        images: form.photoUrl ? [form.photoUrl] : [],
      };

      await createChambre(payload);
      navigate("/admin/chambres");
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement de la chambre.");
    } finally {
      setLoading(false);
    }
  };

  // Formatage du tarif en MAD
  const formattedPrice = new Intl.NumberFormat("fr-FR").format(Number(form.prixNuit || 0));

  return (
    <div className="chamber-page">
      <div className="chamber-container">
        {/* Fil d'Ariane */}
        <nav className="chamber-breadcrumb">
          <span>◫</span>
          <Link to="/admin/chambres">Gestion des chambres</Link>
          <span className="breadcrumb-separator">›</span>
          <strong>Ajouter une nouvelle chambre</strong>
        </nav>

        {/* En-tête principal */}
        <header className="chamber-header">
          <div>
            <div className="chamber-title-line">
              <h1>Ajouter une chambre</h1>
              <span className="new-room-badge">Nouveau standard</span>
            </div>
            <p>Remplissez les informations ci-dessous pour publier une nouvelle chambre au catalogue.</p>
          </div>

          <div className="chamber-status">
            <span className="status-dot"></span>
            <span>Statut initial : <strong>Brouillon privé</strong></span>
          </div>
        </header>

        {/* Message d'erreur éventuel */}
        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "12px 18px",
            borderRadius: "10px",
            marginBottom: "20px",
            fontSize: "13.5px"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Formulaire complet en 2 colonnes */}
        <form onSubmit={handleSubmit} className="chamber-form-card">
          {/* ================= COLONNE GAUCHE (PHOTOGRAPHIE) ================= */}
          <div className="photo-column">
            <div className="section-heading">
              <h2>Photographie principale</h2>
              <span>Recommandé</span>
            </div>

            {/* Aperçu de l'image actuelle */}
            <div className="photo-preview-wrapper">
              <div className="photo-preview-tag">
                <span>✓</span>
                <span>Aperçu actuel</span>
              </div>
              <img
                src={form.photoUrl}
                alt="Aperçu de la chambre"
                className="photo-preview-img"
              />
              <div className="photo-preview-caption">
                <span>{form.photoName}</span>
                <span>{form.photoSize}</span>
              </div>
            </div>

            {/* Zone Drag & Drop */}
            <label className="upload-dropzone">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: "none" }}
              />
              <div className="upload-dropzone-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                  <path d="M12 12v9" />
                  <path d="m16 16-4-4-4 4" />
                </svg>
              </div>
              <strong>Glissez-déposez une nouvelle image ici</strong>
              <small>ou parcourez vos dossiers locaux</small>
              <span className="upload-btn-choose">
                <span>📁</span>
                <span>Choisir une image</span>
              </span>
            </label>

            {/* Consignes techniques */}
            <div className="photo-guidelines-box">
              <div className="photo-guideline-item">
                <span>ⓘ</span>
                <span>Formats acceptés : <strong>JPG, PNG, WEBP</strong> (Max 5 Mo).</span>
              </div>
              <div className="photo-guideline-item">
                <span>Résolution recommandée : <strong>1920x1080px</strong>.</span>
              </div>
              <div className="photo-guideline-item success">
                <span>🛡</span>
                <span>Optimisation automatique WebP pour chargement ultra-rapide</span>
              </div>
            </div>
          </div>

          {/* ================= COLONNE DROITE (DÉTAILS & ARCHITECTURE) ================= */}
          <div className="details-column">
            {/* Nom de la chambre */}
            <div className="form-group-block">
              <div className="form-label-row">
                <label>Nom de la chambre *</label>
                <span className="label-tag">Obligatoire</span>
              </div>
              <div className="form-input-with-icon">
                <input
                  type="text"
                  name="nom"
                  className="form-input-field has-suffix"
                  value={form.nom}
                  onChange={handleChange}
                  required
                />
                <span className="input-suffix-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#059669" stroke="#ffffff" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" fill="#059669" />
                    <polyline points="9 12 11 14 15 10" stroke="#ffffff" fill="none" />
                  </svg>
                </span>
              </div>
              <span className="form-helper-text">
                ✓ Nom distinctif conforme à la charte de dénomination du catalogue.
              </span>
            </div>

            {/* Numéro de chambre & Type de suite */}
            <div className="grid-2-cols-equal">
              <div className="form-group-block">
                <div className="form-label-row">
                  <label>Numéro de porte / chambre *</label>
                </div>
                <input
                  type="text"
                  name="numero"
                  className="form-input-field"
                  placeholder="Ex: 201, 305"
                  value={form.numero}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group-block">
                <div className="form-label-row">
                  <label>Catégorie de suite *</label>
                </div>
                <select
                  name="type"
                  className="form-input-field"
                  value={form.type}
                  onChange={handleChange}
                  required
                >
                  <option value="simple">Chambre Simple</option>
                  <option value="double">Chambre Double</option>
                  <option value="suite">Suite Prestige</option>
                  <option value="presidentielle">Suite Présidentielle</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="form-group-block">
              <div className="form-label-row">
                <label>Description de la chambre</label>
                <span className="label-tag">{form.description.length} / 600 caractères</span>
              </div>
              <textarea
                name="description"
                rows="4"
                className="form-textarea-field"
                value={form.description}
                onChange={handleChange}
                maxLength="600"
              />
              <span className="form-helper-muted">
                Une description soignée augmente le taux de réservation directe de 34%.
              </span>
            </div>

            {/* Sous-titre : Caractéristiques architecturales & tarifs */}
            <div className="section-heading" style={{ marginTop: "14px", marginBottom: "16px" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🎚</span>
                <span>Caractéristiques architecturales &amp; tarifs</span>
              </h2>
            </div>

            {/* Ligne 1 : Étage, Capacité, Nombre de lits */}
            <div className="grid-3-cols">
              <div className="form-group-block">
                <div className="form-label-row">
                  <label>Numéro d'étage</label>
                </div>
                <div className="form-input-with-icon">
                  <span className="input-prefix-icon">◲</span>
                  <input
                    type="number"
                    name="etage"
                    className="form-input-field has-prefix"
                    value={form.etage}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group-block">
                <div className="form-label-row">
                  <label>Capacité maximale</label>
                </div>
                <div className="form-input-with-icon">
                  <span className="input-prefix-icon">👥</span>
                  <input
                    type="number"
                    name="capacite"
                    className="form-input-field has-prefix has-suffix"
                    value={form.capacite}
                    onChange={handleChange}
                    min="1"
                    max="10"
                  />
                  <span className="input-suffix-unit">pers.</span>
                </div>
              </div>

              <div className="form-group-block">
                <div className="form-label-row">
                  <label>Nombre de lits</label>
                </div>
                <div className="form-input-with-icon">
                  <span className="input-prefix-icon">🛏</span>
                  <input
                    type="number"
                    name="nombreLits"
                    className="form-input-field has-prefix"
                    value={form.nombreLits}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Ligne 2 : Type de lits, Surface en m² */}
            <div className="grid-2-cols">
              <div className="form-group-block">
                <div className="form-label-row">
                  <label>Type de lits</label>
                </div>
                <div className="form-input-with-icon">
                  <span className="input-prefix-icon">🛏</span>
                  <select
                    name="typeLits"
                    className="form-input-field has-prefix has-suffix"
                    value={form.typeLits}
                    onChange={handleChange}
                  >
                    <option value="Lit King Size (180x200 cm)">Lit King Size (180x200 cm)</option>
                    <option value="2 Lits Queen Size (160x200 cm)">2 Lits Queen Size (160x200 cm)</option>
                    <option value="1 Lit Double Classique">1 Lit Double Classique</option>
                  </select>
                  <span className="input-suffix-icon" style={{ color: "#4b5563" }}>✓</span>
                </div>
              </div>

              <div className="form-group-block">
                <div className="form-label-row">
                  <label>Surface en m²</label>
                </div>
                <div className="form-input-with-icon">
                  <span className="input-prefix-icon">📐</span>
                  <input
                    type="number"
                    name="superficie"
                    className="form-input-field has-prefix has-suffix"
                    value={form.superficie}
                    onChange={handleChange}
                  />
                  <span className="input-suffix-unit">m²</span>
                </div>
              </div>
            </div>

            {/* Ligne 3 : Prix par nuit & Devise */}
            <div className="grid-2-cols">
              <div className="form-group-block">
                <div className="form-label-row">
                  <label>Prix par nuit *</label>
                  <span className="label-tag">Hors taxe de séjour</span>
                </div>
                <div className="form-input-with-icon">
                  <span className="input-prefix-icon">🪙</span>
                  <input
                    type="number"
                    name="prixNuit"
                    className="form-input-field has-prefix"
                    value={form.prixNuit}
                    onChange={handleChange}
                    min="0"
                    step="50"
                    required
                  />
                </div>
              </div>

              <div className="form-group-block">
                <div className="form-label-row">
                  <label>Devise</label>
                </div>
                <div className="form-input-with-icon">
                  <select
                    name="devise"
                    className="form-input-field has-suffix"
                    value={form.devise}
                    onChange={handleChange}
                  >
                    <option value="MAD (Dirham)">MAD (Dirham)</option>
                    <option value="EUR (€)">EUR (€)</option>
                  </select>
                  <span className="input-suffix-icon" style={{ color: "#4b5563" }}>✓</span>
                </div>
              </div>
            </div>

            {/* Bloc récapitulatif tarifaire calculé */}
            <div className="pricing-recap-box">
              <div className="pricing-recap-info">
                <span className="pricing-recap-icon">§</span>
                <div>
                  <div className="pricing-recap-title">Tarification calculée pour 1 nuitée</div>
                  <div className="pricing-recap-sub">
                    Incluant le petit-déjeuner Signature et l'accès au Spa Impérial
                  </div>
                </div>
              </div>
              <div className="pricing-recap-total">
                <span className="pricing-recap-number">{formattedPrice}</span>
                <span className="pricing-recap-devise">MAD</span>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="chamber-form-actions">
              <Link to="/admin/chambres" className="btn-form-cancel">
                Annuler
              </Link>
              <button type="submit" className="btn-form-submit" disabled={loading}>
                {loading ? "Enregistrement en cours..." : "Publier la chambre au catalogue →"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
