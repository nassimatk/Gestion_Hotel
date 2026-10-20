package com.hotel.disponibilites.service;

import com.hotel.disponibilites.model.StatutReservation;
import com.hotel.disponibilites.repository.ReservationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

@Service
public class DisponibiliteService {

    private final ReservationRepository reservationRepository;

    public DisponibiliteService(ReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
    }

    public boolean estLibre(Long chambreId, LocalDate dateDebut, LocalDate dateFin) {
        if (!dateFin.isAfter(dateDebut)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "date_fin doit etre apres date_debut");
        }
        long chevauchements = reservationRepository.compterChevauchements(
                chambreId, StatutReservation.CONFIRMEE, dateDebut, dateFin);
        return chevauchements == 0;
    }
}