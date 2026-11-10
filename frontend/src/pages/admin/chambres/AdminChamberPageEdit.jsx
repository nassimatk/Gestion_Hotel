import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getChambre, updateChambre } from "../../../services/chambresApi";
import "./AdminChamberPageEdit.css";

export default function AdminChamberPageEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  const [form, setForm] = useState({
    nom: "Suite Impériale Panorama",
    numero: "204",
    type: "suite",
    description:
      "Vaste suite avec terrasse privative panoramique, literie King-size haute couture, salon privatif et salle de bain en marbre d'Italie.",
    etage: 4,
    capacite: 2,
    nombreLits: 1,
    typeLits: "Lit King Size",
    superficie: 85,
    prixNuit: 5400,
    devise: "MAD • Dirham Marocain",
    statut: "disponible",
    vue: "Vue Mer",
    photoUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80",
    photoCaption: "Terrasse Panorama & Suite Impériale",
    photoResolution: "1920 × 1280 px",
  });

  // Charger la chambre existante depuis l'API
  useEffect(() => {
    if (id) {
      setLoading(true);
      getChambre(id)
        .then((data) => {
          if (data) {
            setForm((prev) => ({
              ...prev,
              nom: data.nom || `Chambre ${data.type?.toUpperCase() || ""} N° ${data.numero}`,
              numero: String(data.numero || prev.numero),
              type: data.type || prev.type,
              description: data.description || prev.description,
              etage: data.etage !== undefined ? data.etage : prev.etage,
              capacite: data.capacite || prev.capacite,
              superficie: data.superficie || prev.superficie,
              prixNuit: data.prix_nuit || prev.prixNuit,
              statut: data.statut || prev.statut,
              vue: data.vue || prev.vue,
              photoUrl:
                Array.isArray(data.images) && data.images.length > 0
                  ? data.images[0]
                  : prev.photoUrl,
            }));
          }
        })
        .catch((err) => {
          console.warn("Utilisation des données par défaut :", err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handlePhotoReplace = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("La taille de l'image ne doit pas dépasser 15 Mo.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({
      ...prev,
      photoUrl: previewUrl,
      photoCaption: file.name,
    }));
  };

  const handlePhotoDelete = () => {
    if (window.confirm("Voulez-vous supprimer l'image de cette chambre ?")) {
      setForm((prev) => ({
        ...prev,
        photoUrl: "",
        photoCaption: "Aucune image sélectionnée",
      }));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSaving(true);

    try {
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
        images: form.photoUrl ? [form.photoUrl] : [],
      };

      if (id) {
        await updateChambre(id, payload);
      }
      setSuccessNotice("Modifications enregistrées avec succès et synchronisées.");
      setTimeout(() => {
        navigate("/admin/chambres");
      }, 1500);
    } catch (err) {
      setError(err.message || "Erreur lors de la mise à jour de la chambre.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-chamber-page">
      <div className="edit-chamber-container">
        {/* Fil d'Ariane */}
        <nav className="edit-chamber-nav">
          <Link to="/admin/chambres">← Gestion des chambres</Link>
          <span className="separator">/</span>
          <strong>Modifier la chambre #{form.numero ? `CH-${form.numero}` : "CH-204"}</strong>
        </nav>

        {/* En-tête principal */}
        <header className="edit-chamber-header">
          <div>
            <div className="edit-chamber-title-row">
              <h1>Modifier la chambre</h1>
              <label className={`edit-status-pill ${form.statut}`} style={{ cursor: "pointer" }} title="Cliquer pour changer le statut">
                <span className="edit-status-pill-dot"></span>
                <select
                  name="statut"
                  value={form.statut}
                  onChange={handleChange}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "inherit",
                    fontWeight: "inherit",
                    fontSize: "inherit",
                    fontFamily: "inherit",
                    cursor: "pointer",
                    outline: "none"
                  }}
                >
                  <option value="disponible">Disponible</option>
                  <option value="occupee">Occupée</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </label>
            </div>
            <p className="edit-chamber-sub">
              Mise à jour des informations pour la <strong>{form.nom}</strong>
            </p>
          </div>

          <div className="edit-chamber-meta-box">
            <span># ID: <strong>CH-{form.numero}</strong></span>
            <span className="meta-divider">|</span>
            <span>Dernière synchro: il y a 12 min</span>
          </div>
        </header>

        {/* Bannière Synchronisation en temps réel */}
        <div className="sync-banner">
          <div className="sync-banner-content">
            <div className="sync-banner-icon">
              <span>☑</span>
            </div>
            <div>
              <div className="sync-banner-title">Synchronisation en temps réel</div>
              <div className="sync-banner-sub">
                Toutes les modifications apportées seront immédiatement synchronisées sur les plateformes de réservation partenaires.
              </div>
            </div>
          </div>
          <span className="sync-badge-pill">GDS &amp; OTA Actifs</span>
        </div>

        {/* Messages Alertes */}
        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "14px 18px",
            borderRadius: "10px",
            marginBottom: "20px"
          }}>
            ⚠️ {error}
          </div>
        )}

        {successNotice && (
          <div style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#065f46",
            padding: "14px 18px",
            borderRadius: "10px",
            marginBottom: "20px",
            fontWeight: "600"
          }}>
            ✓ {successNotice}
          </div>
        )}

        <form id="edit-chamber-form" onSubmit={handleSubmit}>
          {/* ================= BLOC 1 : PHOTOGRAPHIE PRINCIPALE ================= */}
          <div className="edit-card-block">
            <div className="edit-card-header">
              <h3 className="edit-card-title">
                <span className="edit-card-title-icon">🖼</span>
                <span>Photographie principale de la chambre</span>
              </h3>
              <span className="edit-card-meta">Format 16:10 recommandé • Haute résolution</span>
            </div>

            <div className="photo-management-grid">
              <div className="photo-preview-large">
                <img src={form.photoUrl || "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80"} alt={form.nom} />
                <div className="photo-preview-overlay-tag">
                  <div>
                    <span className="photo-tag-badge">Actuelle • {form.vue || "Vue Mer"}</span>
                    <div style={{ marginTop: "4px", fontWeight: "600" }}>{form.photoCaption}</div>
                  </div>
                  <span style={{ fontSize: "11px", opacity: 0.85 }}>{form.photoResolution}</span>
                </div>
              </div>

              <div className="photo-actions-panel">
                <h4>Actions sur le visuel</h4>
                <p>
                  Cette image est mise en avant lors des recherches des clients VIP et sur le moteur de réservation direct.
                </p>

                <label className="photo-btn-replace">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoReplace}
                    style={{ display: "none" }}
                  />
                  <span>✎</span>
                  <span>Remplacer l'image</span>
                </label>

                <button
                  type="button"
                  className="photo-btn-delete"
                  onClick={handlePhotoDelete}
                >
                  <span>🗑</span>
                  <span>Supprimer l'image</span>
                </button>

                <div className="photo-spec-note">
                  ⓘ JPG, WebP ou PNG jusqu'à 15 Mo.
                </div>
              </div>
            </div>
          </div>

          {/* ================= BLOC 2 : IDENTITÉ ÉDITORIALE ================= */}
          <div className="edit-card-block">
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
              <div className="edit-form-field">
                <div className="edit-form-label-row">
                  <label>Nom éditorial de la chambre *</label>
                </div>
                <div className="edit-input-wrapper">
                  <input
                    type="text"
                    name="nom"
                    className="edit-input-control"
                    value={form.nom}
                    onChange={handleChange}
                    required
                  />
                  <span className="edit-input-success-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#059669" stroke="#ffffff" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" fill="#059669" />
                      <polyline points="9 12 11 14 15 10" stroke="#ffffff" fill="none" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="edit-form-field">
                <div className="edit-form-label-row">
                  <label>Catégorie / Type de chambre *</label>
                </div>
                <select
                  name="type"
                  className="edit-input-control"
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

            <div className="edit-form-field" style={{ marginBottom: "6px", marginTop: "12px" }}>
              <div className="edit-form-label-row">
                <label>Description éditoriale détaillée *</label>
                <span className="field-count">{form.description.length} caractères</span>
              </div>
              <textarea
                name="description"
                rows="4"
                className="edit-textarea-control"
                value={form.description}
                onChange={handleChange}
              />
              <div className="edit-field-subtext">
                Mettez en avant le standing, l'atmosphère sonore et les commodités de prestige.
              </div>
            </div>
          </div>

          {/* ================= BLOC 3 : AGENCEMENT & CONFIGURATION DES LITS ================= */}
          <div className="edit-card-block">
            <div className="edit-card-header">
              <h3 className="edit-card-title">
                <span className="edit-card-title-icon">🛏</span>
                <span>Agencement et configuration des lits</span>
              </h3>
            </div>

            <div className="edit-grid-4-cols">
              {/* Numéro d'étage */}
              <div className="edit-form-field">
                <div className="edit-form-label-row">
                  <label>Numéro d'étage</label>
                </div>
                <div className="edit-input-wrapper">
                  <span className="edit-input-icon">◲</span>
                  <input
                    type="number"
                    name="etage"
                    className="edit-input-control has-icon"
                    value={form.etage}
                    onChange={handleChange}
                  />
                </div>
                <div className="edit-field-subtext">Étage exécutif penthouse</div>
              </div>

              {/* Capacité maximale */}
              <div className="edit-form-field">
                <div className="edit-form-label-row">
                  <label>Capacité maximale</label>
                </div>
                <div className="edit-input-wrapper">
                  <span className="edit-input-icon">👥</span>
                  <input
                    type="number"
                    name="capacite"
                    className="edit-input-control has-icon"
                    value={form.capacite}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
                <div className="edit-field-subtext">2 Adultes max.</div>
              </div>

              {/* Nombre de lits */}
              <div className="edit-form-field">
                <div className="edit-form-label-row">
                  <label>Nombre de lits</label>
                </div>
                <div className="edit-input-wrapper">
                  <span className="edit-input-icon">🛏</span>
                  <input
                    type="number"
                    name="nombreLits"
                    className="edit-input-control has-icon"
                    value={form.nombreLits}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
                <div className="edit-field-subtext">Unité principale</div>
              </div>

              {/* Type de lits */}
              <div className="edit-form-field">
                <div className="edit-form-label-row">
                  <label>Type de lits</label>
                </div>
                <select
                  name="typeLits"
                  className="edit-input-control"
                  value={form.typeLits}
                  onChange={handleChange}
                >
                  <option value="Lit King Size">Lit King Size</option>
                  <option value="2 Lits Queen Size">2 Lits Queen Size</option>
                  <option value="1 Lit Double">1 Lit Double</option>
                </select>
                <div className="edit-field-subtext">Literie sur mesure</div>
              </div>
            </div>
          </div>

          {/* ================= BLOC 4 : SURFACE & TARIFICATION ================= */}
          <div className="edit-card-block">
            <div className="edit-card-header">
              <h3 className="edit-card-title">
                <span className="edit-card-title-icon">🪙</span>
                <span>Surface et tarification par nuitée</span>
              </h3>
            </div>

            <div className="edit-grid-3-cols">
              {/* Surface */}
              <div className="edit-form-field">
                <div className="edit-form-label-row">
                  <label>Surface habitable (m²)</label>
                </div>
                <div className="edit-input-wrapper">
                  <input
                    type="number"
                    name="superficie"
                    className="edit-input-control"
                    value={form.superficie}
                    onChange={handleChange}
                  />
                  <span className="edit-input-unit">m²</span>
                </div>
                <div className="edit-field-subtext">Terrasse extérieure incluse (25 m²)</div>
              </div>

              {/* Tarif */}
              <div className="edit-form-field">
                <div className="edit-form-label-row">
                  <label>Tarif par nuitée *</label>
                </div>
                <div className="edit-input-wrapper">
                  <input
                    type="number"
                    name="prixNuit"
                    className="edit-input-control price-bold"
                    value={form.prixNuit}
                    onChange={handleChange}
                    step="50"
                    required
                  />
                  <span className="edit-input-unit">MAD</span>
                </div>
                <div className="edit-field-subtext">Hors taxes de séjour locales</div>
              </div>

              {/* Devise */}
              <div className="edit-form-field">
                <div className="edit-form-label-row">
                  <label>Devise de référence</label>
                </div>
                <select
                  name="devise"
                  className="edit-input-control"
                  value={form.devise}
                  onChange={handleChange}
                >
                  <option value="MAD • Dirham Marocain">MAD • Dirham Marocain</option>
                  <option value="EUR • Euro (€)">EUR • Euro (€)</option>
                </select>
                <div className="edit-field-subtext">Converti dynamiquement pour les clients étrangers</div>
              </div>
            </div>
          </div>

          {/* ================= BARRE D'ACTION FLOTTANTE EN BAS ================= */}
          <div className="floating-action-bar">
            <Link to="/admin/chambres" className="floating-btn-cancel">
              ✕ Annuler
            </Link>

            <button
              type="button"
              className="floating-btn-preview"
              onClick={() => alert("Prévisualisation de la fiche publique")}
            >
              <span>👁</span>
              <span>Voir la fiche publique</span>
            </button>

            <button
              type="submit"
              form="edit-chamber-form"
              className="floating-btn-save"
              disabled={saving}
            >
              <span className="save-dot-status"></span>
              <span>{saving ? "Enregistrement..." : "Enregistrer les modifications"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
