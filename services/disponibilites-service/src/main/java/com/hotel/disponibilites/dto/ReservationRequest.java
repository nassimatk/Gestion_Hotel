package com.hotel.disponibilites.dto;

import java.time.LocalDate;

// client_id moa9atan : sera remplace par le JWT a l'etape 11
public record ReservationRequest(Long chambreId, Long clientId,
                                 LocalDate dateDebut, LocalDate dateFin) {
}