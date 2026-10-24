package com.hotel.disponibilites.dto;

import com.hotel.disponibilites.model.Reservation;
import com.hotel.disponibilites.model.StatutReservation;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ReservationResponse(Long id, Long chambreId, Long clientId,
                                  LocalDate dateDebut, LocalDate dateFin,
                                  StatutReservation statut, LocalDateTime createdAt) {

    public static ReservationResponse from(Reservation r) {
        return new ReservationResponse(r.getId(), r.getChambreId(), r.getClientId(),
                r.getDateDebut(), r.getDateFin(), r.getStatut(), r.getCreatedAt());
    }
}