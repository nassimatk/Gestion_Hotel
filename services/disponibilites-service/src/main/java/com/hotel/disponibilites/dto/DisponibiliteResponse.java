package com.hotel.disponibilites.dto;

import java.time.LocalDate;

public record DisponibiliteResponse(Long chambreId, boolean disponible, LocalDate dateDebut, LocalDate dateFin) {
}