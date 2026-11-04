import { client } from "./http";
const http = client("disponibilites");

export const getDisponibilites = (params) => http.get("/disponibilites", { params });
export const verifierChambre = (id, params) => http.get(`/disponibilites/chambres/${id}`, { params });
export const creerReservation = (data) => http.post("/reservations", data);
export const mesReservations = () => http.get("/reservations/mes");
export const toutesReservations = () => http.get("/reservations");
export const annulerReservation = (id) => http.delete(`/reservations/${id}`);

/*export const creerReservation = (reservationData) => {
    const token = localStorage.getItem('token'); 
    
    return http.post("/reservations", reservationData, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
};*/