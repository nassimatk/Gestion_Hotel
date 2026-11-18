/**
 * Service API pour chambres-service (Port 8001)
 */

const BASE_URL = import.meta.env.VITE_CHAMBRES_API_URL || "http://localhost:8001/api/chambres";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Récupère la liste de toutes les chambres actives (public)
 */
export async function getChambres(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${BASE_URL}?${query}` : BASE_URL;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${res.status}: Impossible de récupérer les chambres`);
  }
  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

/**
 * Récupère le détail d'une chambre par son ID (public)
 */
export async function getChambre(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${res.status}: Chambre introuvable`);
  }
  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

/**
 * Ajoute une nouvelle chambre (Admin requis)
 */
export async function createChambre(chambreData) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(chambreData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error || (errorData.errors ? Object.values(errorData.errors).flat().join(" ") : `Échec de création (code ${res.status})`);
    throw new Error(message);
  }
  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

/**
 * Modifie une chambre existante (Admin requis)
 */
export async function updateChambre(id, chambreData) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(chambreData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error || (errorData.errors ? Object.values(errorData.errors).flat().join(" ") : `Échec de modification (code ${res.status})`);
    throw new Error(message);
  }
  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

/**
 * Supprime une chambre (Soft Delete, Admin requis)
 */
export async function deleteChambre(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Erreur ${res.status}: Échec de suppression`);
  }
  return true;
}
