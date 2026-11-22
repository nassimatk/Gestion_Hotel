import { client } from "./http";

// Client axios du service Tarifs (le token JWT stocké après connexion est ajouté automatiquement)
const http = client("tarifs");

// L'API renvoie { success, data } : on récupère directement "data"
const unwrap = (res) => res.data?.data ?? res.data;

export const tarifsApi = {
  // Lecture publique : resource = "tarifs" | "saisons" | "promotions"
  list: (resource, params) => http.get(`/${resource}`, { params }).then(unwrap),

  // Écriture réservée à l'administrateur
  create: (resource, body) => http.post(`/${resource}`, body).then((res) => res.data),
  update: (resource, id, body) => http.put(`/${resource}/${id}`, body).then((res) => res.data),
  remove: (resource, id) => http.delete(`/${resource}/${id}`).then((res) => res.data),

  // Calcul du prix d'un séjour (public)
  calculer: (params) => http.get("/tarifs/calcul", { params }).then(unwrap),

  // Raccourcis conservés pour compatibilité
  getAllTarifs: () => http.get("/tarifs").then(unwrap),
  getAllSaisons: () => http.get("/saisons").then(unwrap),
  getAllPromotions: () => http.get("/promotions").then(unwrap),
};

<<<<<<< HEAD
// Compatibilité avec ReservationPage : accepte date_debut / date_fin
// et les traduit vers arrivee / depart attendus par l'API de calcul.
export const getTarifs = (params = {}) =>
  tarifsApi.calculer({
    chambre_id: params.chambre_id,
    arrivee: params.arrivee ?? params.date_debut,
    depart: params.depart ?? params.date_fin,
  });

// Alias nommé pour la compatibilité avec ReservationPage (import { getTarifs })
export const getTarifs = (params) => tarifsApi.calculer(params);


// Message d'erreur lisible, au format de l'API { error, code }
export function messageErreur(err) {
  return (
    err?.response?.data?.error ||
    (err?.response ? `Erreur ${err.response.status}` : "Le service Tarifs est injoignable (port 8004).")
  );
}