package com.hotel.disponibilites.controller;

import com.hotel.disponibilites.dto.ReservationRequest;
import com.hotel.disponibilites.dto.ReservationResponse;
import com.hotel.disponibilites.service.DisponibiliteService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final DisponibiliteService disponibiliteService;

    public ReservationController(DisponibiliteService disponibiliteService) {
        this.disponibiliteService = disponibiliteService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse creer(@RequestBody ReservationRequest request) {
        return ReservationResponse.from(disponibiliteService.creer(request));
    }
}