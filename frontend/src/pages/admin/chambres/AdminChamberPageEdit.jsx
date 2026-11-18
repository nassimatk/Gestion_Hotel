import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getChambre, updateChambre } from "../../../services/chambresApi";
import "./AdminChamberPageEdit.css";

// Compression et redimensionnement HD côté client pour optimiser les performances
function compressImage(file, maxWidth = 1600, quality = 0.82) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

export default function AdminChamberPageEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  // Gestion multi-photos
  const [photos, setPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

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
            }));

            // Charger toutes les photos existantes
            if (Array.isArray(data.images) && data.images.length > 0) {
              setPhotos(
                data.images.map((img, idx) => ({
                  id: `img-${idx}-${Date.now()}`,
                  url: img,
                  name: idx === 0 ? "Photo principale" : `Vue secondaire ${idx + 1}`,
                  size: "Standard",
                }))
              );
            } else {
              setPhotos([
                {
                  id: "default-0",
                  url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80",
                  name: "Photo par défaut",
                  size: "2.4 Mo",
                },
              ]);
            }
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

  // Upload multi-photos avec compression HD
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        alert(`L'image ${file.name} dépasse la limite de 20 Mo.`);
        continue;
      }

      const compressedUrl = await compressImage(file, 1600, 0.82);
      const approxSizeInMo = ((compressedUrl.length * 0.75) / (1024 * 1024)).toFixed(1) + " Mo";

      setPhotos((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random().toString(36).substring(2, 9),
          url: compressedUrl,
          name: file.name,
          size: approxSizeInMo,
        },
      ]);
    }

    e.target.value = "";
  };

  // Définir comme photo principale
  const handleSetMainPhoto = (index) => {
    setPhotos((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
    setSelectedPhotoIndex(0);
  };

  // Supprimer une photo individuelle
  const handlePhotoDelete = (index) => {
    if (window.confirm("Voulez-vous supprimer cette image de la chambre ?")) {
      setPhotos((prev) => prev.filter((_, i) => i !== index));
      if (selectedPhotoIndex >= index && selectedPhotoIndex > 0) {
        setSelectedPhotoIndex((prev) => prev - 1);
      }
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
        images: photos && photos.length > 0 ? photos.map((p) => p.url) : [],
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
          {/* ================= BLOC 1 : PHOTOGRAPHIES & GALERIE ================= */}
          <div className="edit-card-block">
            <div className="edit-card-header">
              <h3 className="edit-card-title">
                <span className="edit-card-title-icon">🖼</span>
                <span>Photographies de la chambre ({photos.length})</span>
              </h3>
              <span className="edit-card-meta">
                La photo en 1ère position (★) est l&apos;image principale affichée sur le catalogue
              </span>
            </div>

            <div className="photo-management-grid">
              <div className="photo-preview-large">
                <img
                  src={
                    photos[selectedPhotoIndex]?.url ||
                    photos[0]?.url ||
                    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80"
                  }
                  alt={form.nom}
                />
                <div className="photo-preview-overlay-tag">
                  <div>
                    <span className="photo-tag-badge">
                      {selectedPhotoIndex === 0
                        ? "★ Photo principale (Catalogue & Accueil)"
                        : `Photo ${selectedPhotoIndex + 1} de la galerie`}
                    </span>
                    <div style={{ marginTop: "4px", fontWeight: "600" }}>
                      {photos[selectedPhotoIndex]?.name || form.nom}
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", opacity: 0.85 }}>
                    {selectedPhotoIndex + 1} / {Math.max(photos.length, 1)}
                  </span>
                </div>
              </div>

              <div className="photo-actions-panel">
                <h4>Gestion des photos</h4>
                <p>
                  Vous pouvez ajouter plusieurs photos. La première image est l&apos;image vitrine de la chambre.
                </p>

                {selectedPhotoIndex !== 0 && photos.length > 1 && (
                  <button
                    type="button"
                    className="photo-btn-primary-action"
                    onClick={() => handleSetMainPhoto(selectedPhotoIndex)}
                  >
                    <span>★</span>
                    <span>Définir comme photo principale</span>
                  </button>
                )}

                <label className="photo-btn-replace">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: "none" }}
                  />
                  <span>＋</span>
                  <span>Ajouter des photos</span>
                </label>

                {photos.length > 0 && (
                  <button
                    type="button"
                    className="photo-btn-delete"
                    onClick={() => handlePhotoDelete(selectedPhotoIndex)}
                  >
                    <span>🗑</span>
                    <span>Supprimer cette photo</span>
                  </button>
                )}

                <div className="photo-spec-note">
                  ⓘ Formats JPG, WebP ou PNG (Max 8 Mo par image).
                </div>
              </div>
            </div>

            {/* Miniatures cliquables */}
            {photos.length > 1 && (
              <div className="edit-photos-strip">
                <div className="edit-photos-strip-title">
                  Galerie complète ({photos.length} photos) — cliquez sur une miniature pour la prévisualiser ou la définir en principale :
                </div>
                <div className="edit-photos-grid">
                  {photos.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className={`edit-photo-thumb ${idx === selectedPhotoIndex ? "active" : ""} ${
                        idx === 0 ? "is-main" : ""
                      }`}
                      onClick={() => setSelectedPhotoIndex(idx)}
                    >
                      <img src={p.url} alt={`Photo ${idx + 1}`} />
                      {idx === 0 && <span className="edit-photo-badge">★ Principale</span>}
                      <button
                        type="button"
                        className="edit-photo-thumb-del"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePhotoDelete(idx);
                        }}
                        title="Supprimer cette photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
