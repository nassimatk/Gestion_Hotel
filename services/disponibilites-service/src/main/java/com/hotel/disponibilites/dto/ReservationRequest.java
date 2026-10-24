package com.hotel.disponibilites.dto;

import java.time.LocalDate;

public record ReservationRequest(Long chambreId, LocalDate dateDebut, LocalDate dateFin) {
}