package com.hotel.disponibilites.service;

import com.hotel.disponibilites.client.ChambreClient;
import com.hotel.disponibilites.model.StatutReservation;
import com.hotel.disponibilites.repository.ReservationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

@Service
public class DisponibiliteService {

    private final ReservationRepository reservationRepository;
    private final ChambreClient chambreClient;

    public DisponibiliteService(ReservationRepository reservationRepository,
                                ChambreClient chambreClient) {
        this.reservationRepository = reservationRepository;
        this.chambreClient = chambreClient;
    }

    public boolean estLibre(Long chambreId, LocalDate dateDebut, LocalDate dateFin) {
        if (!dateFin.isAfter(dateDebut)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "date_fin doit etre apres date_debut");
        }
        if (!chambreClient.existe(chambreId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chambre introuvable");
        }
        long chevauchements = reservationRepository.compterChevauchements(
                chambreId, StatutReservation.CONFIRMEE, dateDebut, dateFin);
        return chevauchements == 0;
    }
}