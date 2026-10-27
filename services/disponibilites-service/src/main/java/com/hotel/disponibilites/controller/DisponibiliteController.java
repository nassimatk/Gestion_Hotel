package com.hotel.disponibilites.controller;

import com.hotel.disponibilites.dto.ChambresOccupeesResponse;
import com.hotel.disponibilites.dto.DisponibiliteResponse;
import com.hotel.disponibilites.service.DisponibiliteService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/disponibilites")
public class DisponibiliteController {

    private final DisponibiliteService disponibiliteService;

    public DisponibiliteController(DisponibiliteService disponibiliteService) {
        this.disponibiliteService = disponibiliteService;
    }

    @GetMapping("/chambres/{id}")
    public DisponibiliteResponse verifier(
            @PathVariable Long id,
            @RequestParam("date_debut") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam("date_fin") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {

        boolean libre = disponibiliteService.estLibre(id, dateDebut, dateFin);
        return new DisponibiliteResponse(id, libre, dateDebut, dateFin);
    }
    @GetMapping
    public ChambresOccupeesResponse occupees(
            @RequestParam("date_debut") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam("date_fin") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {
        return new ChambresOccupeesResponse(dateDebut, dateFin,
                disponibiliteService.chambresOccupees(dateDebut, dateFin));
    }
}