import { client } from "./http";

// Client Axios du microservice Tarifs
const http = client("tarifs");

// Extraction des données de l'API
const unwrap = (res) => res.data?.data ?? res.data;

export const tarifsApi = {
  // Récupération des ressources
  list: (resource, params) =>
    http.get(`/${resource}`, { params }).then(unwrap),

  // Création
  create: (resource, body) =>
    http.post(`/${resource}`, body).then((res) => res.data),

  // Modification
  update: (resource, id, body) =>
    http.put(`/${resource}/${id}`, body).then((res) => res.data),

  // Suppression
  remove: (resource, id) =>
    http.delete(`/${resource}/${id}`).then((res) => res.data),

  // Calcul du prix d'un séjour
  calculer: (params) =>
    http.get("/tarifs/calcul", { params }).then(unwrap),

  // Raccourcis
  getAllTarifs: () =>
    http.get("/tarifs").then(unwrap),

  getAllSaisons: () =>
    http.get("/saisons").then(unwrap),

  getAllPromotions: () =>
    http.get("/promotions").then(unwrap),
};

// Compatibilité avec ReservationPage
export const getTarifs = (params = {}) =>
  tarifsApi.calculer({
    chambre_id: params.chambre_id,
    arrivee: params.arrivee ?? params.date_debut,
    depart: params.depart ?? params.date_fin,
  });

// Gestion des erreurs
export function messageErreur(err) {
  return (
    err?.response?.data?.error ||
    (err?.response
      ? `Erreur ${err.response.status}`
      : "Le service Tarifs est injoignable (port 8004).")
  );
}