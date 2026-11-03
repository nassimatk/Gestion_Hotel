import React, { useState } from "react";
import "./AdminChamberPageAdd.css";

export default function AdminChamberPageAdd() {
    const [photo, setPhoto] = useState("");

    const [form, setForm] = useState({
        name: "",
        description: "",
        floor: "",
        capacity: "",
        beds: "",
        bedType: "",
        area: "",
        price: "",
        currency: "MAD",
        status: "Disponible",
    });

    const update = (event) => {
        const { name, value } = event.target;

        setForm({
            ...form,
            [name]: value,
        });
    };

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

    const handleSubmit = (event) => {
        event.preventDefault();

        console.log("Informations de la chambre :", form);
        console.log("Photo :", photo);

        alert("Les informations sont prêtes à être enregistrées.");
    };

    return (
        <main className="chamber-page">
            <div className="chamber-container">

                <nav className="chamber-breadcrumb" aria-label="Fil d’Ariane">
                    <span>Gestion des chambres</span>
                    <span className="breadcrumb-separator">/</span>
                    <strong>Ajouter une nouvelle chambre</strong>
                </nav>

                <header className="chamber-header">
                    <div>
                        <div className="chamber-title-line">
                            <h1>Ajouter une chambre</h1>
                        </div>

                        <p>
                            Remplissez les informations ci-dessous pour ajouter
                            une nouvelle chambre au catalogue.
                        </p>
                    </div>
                </header>

                <form className="chamber-form" onSubmit={handleSubmit}>

                    {/* COLONNE PHOTO */}
                    <aside className="photo-column">

                        <div className="section-heading photo-heading">
                            <h2>Photographie principale</h2>
                            <span>Recommandé</span>
                        </div>

                        <div className="photo-preview">
                            {photo ? (
                                <img
                                    src={photo}
                                    alt="Aperçu de la chambre"
                                />
                            ) : (
                                <div className="photo-placeholder">
                                    <span className="placeholder-icon">▧</span>
                                    <span>
                                        Votre photo principale apparaîtra ici
                                    </span>
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

                            <small>
                                ou parcourez vos fichiers locaux
                            </small>

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
                                Une image nette et lumineuse aide à mieux
                                présenter votre hébergement.
                            </p>
                        </div>

                    </aside>

                    {/* COLONNE INFORMATIONS */}
                    <section className="details-column">

                        <div className="section-heading details-heading">
                            <div>
                                <h2>Informations générales</h2>
                                <p>
                                    Présentez les caractéristiques de votre chambre.
                                </p>
                            </div>
                        </div>

                        <div className="field-block">
                            <label htmlFor="name">
                                Nom de la chambre <span>*</span>
                            </label>

                            <input
                                id="name"
                                name="name"
                                value={form.name}
                                onChange={update}
                                required
                            />
                        </div>

                        <div className="field-block">
                            <label htmlFor="description">
                                Description <span>*</span>
                            </label>

                            <textarea
                                id="description"
                                name="description"
                                value={form.description}
                                onChange={update}
                                rows="4"
                                required
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
                                <label htmlFor="floor">Étage</label>

                                <input
                                    id="floor"
                                    name="floor"
                                    type="number"
                                    min="0"
                                    value={form.floor}
                                    onChange={update}
                                />
                            </div>

                            <div className="field-block">
                                <label htmlFor="capacity">
                                    Capacité (personnes) <span>*</span>
                                </label>

                                <input
                                    id="capacity"
                                    name="capacity"
                                    type="number"
                                    min="1"
                                    value={form.capacity}
                                    onChange={update}
                                    required
                                />
                            </div>

                            <div className="field-block">
                                <label htmlFor="beds">Nombre de lits</label>

                                <input
                                    id="beds"
                                    name="beds"
                                    type="number"
                                    min="1"
                                    value={form.beds}
                                    onChange={update}
                                />
                            </div>

                            <div className="field-block">
                                <label htmlFor="area">Surface (m²)</label>

                                <input
                                    id="area"
                                    name="area"
                                    type="number"
                                    min="1"
                                    value={form.area}
                                    onChange={update}
                                />
                            </div>

                        </div>

                        <div className="field-block">
                            <label htmlFor="bedType">Type de lit</label>

                            <select
                                id="bedType"
                                name="bedType"
                                value={form.bedType}
                                onChange={update}
                            >
                                <option value="">Sélectionner un type de lit</option>
                                <option>Lit King Size (180×200 cm)</option>
                                <option>Lit Queen Size (160×200 cm)</option>
                                <option>Lit double (140×190 cm)</option>
                                <option>Lits simples</option>
                                <option>Lits jumeaux</option>
                                <option>Lit superposé</option>
                            </select>
                        </div>

                        <div className="form-divider" />

                        <div className="section-heading subsection-heading">
                            <h2>Tarification et disponibilité</h2>
                        </div>

                        <div className="fields-grid price-grid">

                            <div className="field-block">
                                <label htmlFor="price">
                                    Prix par nuit <span>*</span>
                                </label>

                                <input
                                    id="price"
                                    name="price"
                                    type="number"
                                    min="0"
                                    value={form.price}
                                    onChange={update}
                                    required
                                />

                                <small>
                                    Prix : {form.price || "0"} {form.currency} / nuit
                                </small>
                            </div>

                            <div className="field-block">
                                <label htmlFor="currency">Devise</label>

                                <select
                                    id="currency"
                                    name="currency"
                                    value={form.currency}
                                    onChange={update}
                                >
                                    <option value="MAD">MAD (Dirham)</option>
                                    <option value="EUR">EUR (Euro)</option>
                                    <option value="USD">USD (Dollar)</option>
                                </select>
                            </div>

                        </div>

                        <div className="field-block">
                            <label htmlFor="status">Statut</label>

                            <select
                                id="status"
                                name="status"
                                value={form.status}
                                onChange={update}
                            >
                                <option value="Disponible">Disponible</option>
                                <option value="Indisponible">Indisponible</option>
                                <option value="Maintenance">En maintenance</option>
                            </select>
                        </div>

                        <div className="form-actions">

                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => window.history.back()}
                            >
                                Annuler
                            </button>

                            <button type="submit" className="btn-submit">
                                <span>＋</span>
                                Ajouter la chambre
                            </button>

                        </div>

                    </section>
                </form>
            </div>
        </main>
    );
}