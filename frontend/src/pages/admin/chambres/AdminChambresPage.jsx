
import { useState } from "react";
import ChambreFormModal from "./ChambreFormModal";
import "./AdminChambres.css";

export default function AdminChambresPage() {
  // Données locales de démonstration
  const [chambres, setChambres] = useState([
    {
      id: 1,
      nom: "Suite Royale Atlas",
      numero_chambre: "201",
      numero_etage: 2,
      description: "Une suite élégante avec une vue exceptionnelle et un confort luxueux.",
      capacite_max: 4,
      nombre_lits: 2,
      type_lits: "King Size",
      surface: 45,
      prix_nuit: 1500,
      devise: "MAD",
      statut: "active",
      image_url: "",
    },
    {
      id: 2,
      nom: "Chambre Deluxe",
      numero_chambre: "102",
      numero_etage: 1,
      description: "Une chambre moderne et confortable idéale pour un séjour agréable.",
      capacite_max: 2,
      nombre_lits: 1,
      type_lits: "Queen Size",
      surface: 30,
      prix_nuit: 850,
      devise: "MAD",
      statut: "active",
      image_url: "",
    },
    {
      id: 3,
      nom: "Suite Prestige",
      numero_chambre: "301",
      numero_etage: 3,
      description: "Un espace raffiné offrant une expérience unique et prestigieuse.",
      capacite_max: 3,
      nombre_lits: 2,
      type_lits: "King Size",
      surface: 55,
      prix_nuit: 2000,
      devise: "MAD",
      statut: "occupée",
      image_url: "",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChambre, setEditingChambre] = useState(null);

  // Filtre actif
  const [activeFilter, setActiveFilter] = useState("all");



  // Modifier une chambre
  const handleOpenEdit = (chambre) => {
    setEditingChambre(chambre);
    setIsModalOpen(true);
  };

  // Supprimer une chambre
  const handleDelete = (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette chambre ?")) {
      setChambres((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Enregistrer une chambre
  const handleSaved = (formData) => {
    if (editingChambre) {
      setChambres((prev) =>
        prev.map((c) =>
          c.id === editingChambre.id
            ? { ...formData, id: editingChambre.id }
            : c
        )
      );
    } else {
      const nouvelleChambre = {
        ...formData,
        id: chambres.length
          ? Math.max(...chambres.map((c) => c.id)) + 1
          : 1,
      };

      setChambres((prev) => [...prev, nouvelleChambre]);
    }

    setIsModalOpen(false);
    setEditingChambre(null);
  };

  // Formatage du prix
  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-FR").format(Number(price || 0));
  };

  // Déterminer si une chambre est occupée
  const isOccupied = (statut) => {
    const value = String(statut || "").toLowerCase();

    return [
      "occupée",
      "occupee",
      "occupied",
      "réservée",
      "reservee",
      "reserved",
    ].includes(value);
  };

  // Filtrage des chambres
  const filteredChambres = chambres.filter((c) => {
    if (activeFilter === "available") {
      return !isOccupied(c.statut);
    }

    if (activeFilter === "occupied") {
      return isOccupied(c.statut);
    }

    return true;
  });

  return (
    <div className="admin-chambres">

      {/* En-tête */}
      <div className="admin-chambres__header">
        <div>
          <span className="admin-chambres__eyebrow">
            HOTELHUB PRESTIGE
          </span>

          <h1 className="admin-chambres__title">
            Gestion des chambres
          </h1>

          <p className="admin-chambres__subtitle">
            Découvrez et gérez les chambres et suites de votre hôtel.
          </p>
        </div>

 
      </div>

      {/* Statistiques interactives */}
      <div className="admin-chambres__stats">

        <div
          className={`admin-chambres__stat ${
            activeFilter === "all" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("all")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setActiveFilter("all");
            }
          }}
          style={{ cursor: "pointer" }}
        >
          <span>Total des chambres</span>
          <strong>{chambres.length}</strong>
        </div>

        <div
          className={`admin-chambres__stat ${
            activeFilter === "available" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("available")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setActiveFilter("available");
            }
          }}
          style={{ cursor: "pointer" }}
        >
          <span>Disponibles</span>
          <strong>
            {chambres.filter((c) => !isOccupied(c.statut)).length}
          </strong>
        </div>

        <div
          className={`admin-chambres__stat ${
            activeFilter === "occupied" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("occupied")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setActiveFilter("occupied");
            }
          }}
          style={{ cursor: "pointer" }}
        >
          <span>Occupées</span>
          <strong>
            {chambres.filter((c) => isOccupied(c.statut)).length}
          </strong>
        </div>

      </div>

      {/* Titre de la liste */}
      <h2 className="admin-chambres__title">
        {activeFilter === "available"
          ? "Chambres disponibles"
          : activeFilter === "occupied"
          ? "Chambres occupées"
          : "Toutes les chambres"}
      </h2>

      {/* Liste des chambres */}
      {filteredChambres.length === 0 ? (

        <div className="admin-chambres__empty">
          <span>▦</span>

          <h3>
            {activeFilter === "available"
              ? "Aucune chambre disponible"
              : activeFilter === "occupied"
              ? "Aucune chambre occupée"
              : "Aucune chambre enregistrée"}
          </h3>

          <p>
            {activeFilter === "all"
              ? "Commencez par ajouter votre première chambre."
              : "Aucune chambre ne correspond à ce filtre."}
          </p>

          {activeFilter === "all" && (
            <button
              className="admin-chambres__btn-add"
              onClick={handleOpenCreate}
            >
              + Ajouter une chambre
            </button>
          )}

        </div>

      ) : (

        <div className="admin-chambres__grid">

          {filteredChambres.map((c) => {
            const occupied = isOccupied(c.statut);

            const image =
              c.image_url ||
              c.photo_url ||
              c.image ||
              c.photo ||
              "";

            return (
              <article className="room-card" key={c.id}>

                {/* Image */}
                <div className="room-card__image">

                  <div className="room-card__image-placeholder">
                    <span>♕</span>
                    <small>HOTELHUB PRESTIGE</small>
                  </div>

                  {image && (
                    <img
                      src={image}
                      alt={c.nom}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}

                  {/* Statut */}
                  <span
                    className={`room-card__status ${
                      occupied
                        ? "room-card__status--occupied"
                        : "room-card__status--available"
                    }`}
                  >
                    <span className="room-card__status-dot"></span>
                    {occupied ? "OCCUPÉE" : "DISPONIBLE"}
                  </span>

                  {/* Numéro */}
                  <span className="room-card__number">
                    N° {c.numero_chambre || c.numero || c.id}
                    {" · "}
                    Étage {c.numero_etage ?? "-"}
                  </span>

                </div>

                {/* Informations */}
                <div className="room-card__body">

                  <h2 className="room-card__title">
                    {c.nom || "Chambre sans nom"}
                  </h2>

                  <p className="room-card__description">
                    {c.description ||
                      "Découvrez le confort et l'élégance de notre établissement."}
                  </p>

                  {/* Caractéristiques */}
                  <div className="room-card__features">

                    <div className="room-card__feature">
                      <span>◇</span>
                      Étage {c.numero_etage ?? "-"}
                    </div>

                    <div className="room-card__feature">
                      <span>♙</span>
                      {c.capacite_max || 0} adultes
                    </div>

                    <div className="room-card__feature">
                      <span>▤</span>
                      {c.nombre_lits || 0} {c.type_lits || "Lits"}
                    </div>

                    <div className="room-card__feature">
                      <span>▧</span>
                      {c.surface || 0} m²
                    </div>

                  </div>

                  {/* Prix */}
                  <div className="room-card__price-section">

                    <div>
                      <span className="room-card__price-label">
                        TARIF STANDARD
                      </span>

                      <div className="room-card__price">
                        {formatPrice(c.prix_nuit)}

                        <small>
                          {c.devise || "MAD"} / nuit
                        </small>
                      </div>
                    </div>

                    <span className="room-card__price-note">
                      Prix par nuit
                    </span>

                  </div>

                </div>

                {/* Actions */}
                <div className="room-card__actions">

                  <button
                    className="room-card__edit"
                    onClick={() => handleOpenEdit(c)}
                  >
                    <span>✎</span>
                    Modifier
                  </button>

                  <button
                    className="room-card__delete"
                    onClick={() => handleDelete(c.id)}
                    title="Supprimer la chambre"
                  >
                    <span>▤</span>
                  </button>

                </div>

              </article>
            );
          })}

        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <ChambreFormModal
          chambre={editingChambre}
          onClose={() => {
            setIsModalOpen(false);
            setEditingChambre(null);
          }}
          onSuccess={handleSaved}
        />
      )}

    </div>
  );
}
