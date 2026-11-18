package com.hotel.disponibilites.dto;

import com.hotel.disponibilites.model.Reservation;
import com.hotel.disponibilites.model.StatutReservation;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ReservationResponse(Long id, Long chambreId, Long clientId,
                                  LocalDate dateDebut, LocalDate dateFin,
                                  Integer nombrePersonnes, String telephone,
                                  StatutReservation statut, LocalDateTime createdAt) {

    public ReservationResponse(Long id, Long chambreId, Long clientId,
                               LocalDate dateDebut, LocalDate dateFin,
                               StatutReservation statut, LocalDateTime createdAt) {
        this(id, chambreId, clientId, dateDebut, dateFin, null, null, statut, createdAt);
    }

    public static ReservationResponse from(Reservation r) {
        return new ReservationResponse(
                r.getId(),
                r.getChambreId(),
                r.getClientId(),
                r.getDateDebut(),
                r.getDateFin(),
                r.getNombrePersonnes(),
                r.getTelephone(),
                r.getStatut(),
                r.getCreatedAt()
        );
    }
}