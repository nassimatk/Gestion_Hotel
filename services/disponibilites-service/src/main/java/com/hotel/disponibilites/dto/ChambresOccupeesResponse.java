package com.hotel.disponibilites.dto;

import java.time.LocalDate;
import java.util.List;

public record ChambresOccupeesResponse(LocalDate dateDebut, LocalDate dateFin,
                                       List<Long> chambresOccupees) {
}