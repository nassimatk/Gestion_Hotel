/**
 * Service API pour avis-service (Port 8002)
 * Modèle préparé pour l'équipe responsable des Avis
 */

const BASE_URL = import.meta.env.VITE_AVIS_API_URL || "http://localhost:8002/api/avis";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Récupère les avis d'une chambre (public)
 */
export async function getAvisChambre(chambreId) {
  const res = await fetch(`${BASE_URL}/chambre/${chambreId}`);
  if (!res.ok) throw new Error("Impossible de charger les avis");
  return res.json();
}

/**
 * Publie un nouvel avis (authentification requise)
 */
export async function postAvis(data) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erreur lors de la publication de l'avis");
  return res.json();
}
