import { useState, useEffect } from "react";
import { getChambres, deleteChambre } from "../../../services/chambresApi";
import ChambreFormModal from "./ChambreFormModal";
import "./AdminChambres.css";

export default function AdminChambresPage() {
  const [chambres, setChambres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChambre, setEditingChambre] = useState(null);

  const fetchChambres = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getChambres();
      setChambres(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Impossible de charger les chambres. Vérifiez que chambres-service (port 8001) est démarré.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChambres();
  }, []);

  const handleOpenCreate = () => {
    setEditingChambre(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (chambre) => {
    setEditingChambre(chambre);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette chambre ? (Suppression logique Soft Delete)")) {
      return;
    }
    try {
      await deleteChambre(id);
      fetchChambres();
    } catch (err) {
      alert("Erreur lors de la suppression : " + err.message);
    }
  };

  const handleSaved = () => {
    setIsModalOpen(false);
    fetchChambres();
  };

  return (
    <div className="admin-chambres">
      <div className="admin-chambres__header">
        <div>
          <h2 className="admin-chambres__title">Gestion des Chambres & Suites</h2>
          <p className="admin-chambres__subtitle">
            Consultez, ajoutez, modifiez ou supprimez les chambres de l'hôtel (chambres-service :8001).
          </p>
        </div>
        <button className="admin-chambres__btn-add" onClick={handleOpenCreate}>
          + Ajouter une chambre
        </button>
      </div>

      {error && (
        <div className="admin-chambres__alert admin-chambres__alert--error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {loading ? (
        <div className="admin-chambres__loading">Chargement des chambres en cours...</div>
      ) : chambres.length === 0 ? (
        <div className="admin-chambres__empty">
          <p>Aucune chambre enregistrée pour le moment.</p>
          <button className="admin-chambres__btn-secondary" onClick={handleOpenCreate}>
            Créer la première chambre
          </button>
        </div>
      ) : (
        <div className="admin-chambres__table-container">
          <table className="admin-chambres__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom de la chambre</th>
                <th>Étage</th>
                <th>Capacité</th>
                <th>Lits</th>
                <th>Surface</th>
                <th>Prix / Nuit</th>
                <th>Statut</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {chambres.map((c) => (
                <tr key={c.id}>
                  <td><strong>#{c.id}</strong></td>
                  <td>
                    <span className="admin-chambres__room-name">{c.nom}</span>
                  </td>
                  <td>Étage {c.numero_etage}</td>
                  <td>{c.capacite_max} pers.</td>
                  <td>{c.nombre_lits} ({c.type_lits})</td>
                  <td>{c.surface} m²</td>
                  <td>
                    <span className="admin-chambres__price">
                      {c.prix_nuit} {c.devise || "MAD"}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-chambres__badge admin-chambres__badge--${c.statut || "active"}`}>
                      {c.statut || "active"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="admin-chambres__btn-action"
                      onClick={() => handleOpenEdit(c)}
                      title="Modifier"
                    >
                      Modifier
                    </button>
                    <button
                      className="admin-chambres__btn-action admin-chambres__btn-action--danger"
                      onClick={() => handleDelete(c.id)}
                      title="Supprimer"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <ChambreFormModal
          chambre={editingChambre}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSaved}
        />
      )}
    </div>
  );
}
