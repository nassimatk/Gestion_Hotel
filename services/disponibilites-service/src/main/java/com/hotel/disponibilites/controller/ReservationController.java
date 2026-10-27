package com.hotel.disponibilites.controller;

import com.hotel.disponibilites.dto.ReservationRequest;
import com.hotel.disponibilites.dto.ReservationResponse;
import com.hotel.disponibilites.service.DisponibiliteService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final DisponibiliteService disponibiliteService;

    public ReservationController(DisponibiliteService disponibiliteService) {
        this.disponibiliteService = disponibiliteService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse creer(@RequestBody ReservationRequest request,
                                     @AuthenticationPrincipal Jwt jwt) {
        return ReservationResponse.from(disponibiliteService.creer(request, idUtilisateur(jwt)));
    }

    @GetMapping("/mes")
    public List<ReservationResponse> mesReservations(@AuthenticationPrincipal Jwt jwt) {
        return disponibiliteService.listerMesReservations(idUtilisateur(jwt))
                .stream().map(ReservationResponse::from).toList();
    }

    @GetMapping
    public List<ReservationResponse> toutes() {
        return disponibiliteService.listerToutes()
                .stream().map(ReservationResponse::from).toList();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void annuler(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        boolean admin = "admin".equals(jwt.getClaimAsString("role"));
        disponibiliteService.annuler(id, idUtilisateur(jwt), admin);
    }

    private Long idUtilisateur(Jwt jwt) {
        try {
            return Long.parseLong(jwt.getSubject());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalide");
        }
    }
}