package com.hotel.disponibilites.dto;

import com.hotel.disponibilites.client.AuthClient.UserInfo;
import com.hotel.disponibilites.client.ChambreClient.ChambreInfo;
import com.hotel.disponibilites.model.Reservation;
import com.hotel.disponibilites.model.StatutReservation;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ReservationResponse(
        Long id,
        Long chambreId,
        String chambreNom,
        String chambreNumero,
        Long clientId,
        String clientNom,
        String clientEmail,
        LocalDate dateDebut,
        LocalDate dateFin,
        Integer nombrePersonnes,
        String telephone,
        Double montant,
        StatutReservation statut,
        LocalDateTime createdAt
) {

    public static ReservationResponse from(Reservation r) {
        return from(r, null, null);
    }

    public static ReservationResponse from(Reservation r, ChambreInfo chambre, UserInfo user) {
        String chambreNom = null;
        String chambreNumero = null;
        if (chambre != null) {
            chambreNumero = chambre.numero();
            if (chambre.nom() != null && !chambre.nom().isBlank()) {
                chambreNom = chambre.nom();
            } else if (chambre.numero() != null) {
                chambreNom = "Chambre N° " + chambre.numero();
            }
        }

        String clientNom = user != null ? user.name() : null;
        String clientEmail = user != null ? user.email() : null;

        return new ReservationResponse(
                r.getId(),
                r.getChambreId(),
                chambreNom,
                chambreNumero,
                r.getClientId(),
                clientNom,
                clientEmail,
                r.getDateDebut(),
                r.getDateFin(),
                r.getNombrePersonnes(),
                r.getTelephone(),
                r.getMontant(),
                r.getStatut(),
                r.getCreatedAt()
        );
    }
}