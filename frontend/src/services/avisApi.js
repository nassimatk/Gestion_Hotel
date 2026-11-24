
/**
 * Service API pour avis-service (Port 8002)
 */

const BASE_URL =
  import.meta.env.VITE_AVIS_API_URL ||
  "http://localhost:8002/api/avis";

/**
 * Récupérer automatiquement le token JWT
 */
function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Traiter les réponses de l'API
 */
async function traiterReponse(response) {
  const texte = await response.text();

  let data = null;

  if (texte) {
    try {
      data = JSON.parse(texte);
    } catch {
      data = { message: texte };
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Erreur serveur (${response.status})`
    );
  }

  return data;
}

/**
 * Consulter les avis d'une chambre (public)
 */
export async function getAvisChambre(chambreId) {
  if (!chambreId) {
    throw new Error("Identifiant de chambre manquant.");
  }

  const params = new URLSearchParams({
    chambre_id: String(chambreId),
  });

  const response = await fetch(`${BASE_URL}?${params}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  return traiterReponse(response);
}

/**
 * Ajouter un avis (JWT requis)
 */
export async function createAvis(data) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return traiterReponse(response);
}

/**
 * Modifier un avis (JWT requis)
 */
export async function updateAvis(id, data) {
  if (!id) {
    throw new Error("Identifiant de l'avis manquant.");
  }

  const response = await fetch(
    `${BASE_URL}/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  return traiterReponse(response);
}

/**
 * Supprimer un avis (JWT requis)
 */
export async function deleteAvis(id) {
  if (!id) {
    throw new Error("Identifiant de l'avis manquant.");
  }

  const response = await fetch(
    `${BASE_URL}/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  return traiterReponse(response);
}

// Compatibilité avec l'ancien nom
export const postAvis = createAvis;

export async function getAllAvis() {
  const response = await fetch(BASE_URL, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return traiterReponse(response);
}