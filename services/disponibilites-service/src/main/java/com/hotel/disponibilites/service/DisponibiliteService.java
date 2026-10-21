package com.hotel.disponibilites.service;

import com.hotel.disponibilites.client.ChambreClient;
import com.hotel.disponibilites.dto.ReservationRequest;
import com.hotel.disponibilites.model.Reservation;
import com.hotel.disponibilites.model.StatutReservation;
import com.hotel.disponibilites.repository.ReservationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
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
        verifierPeriodeEtChambre(chambreId, dateDebut, dateFin);
        return compterChevauchements(chambreId, dateDebut, dateFin) == 0;
    }

    @Transactional
    public Reservation creer(ReservationRequest req, Long clientId) {
        if (req.chambreId() == null || req.dateDebut() == null || req.dateFin() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "chambre_id, date_debut et date_fin sont obligatoires");
        }

        verifierPeriodeEtChambre(req.chambreId(), req.dateDebut(), req.dateFin());

        if (compterChevauchements(req.chambreId(), req.dateDebut(), req.dateFin()) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Chambre deja reservee sur cette periode");
        }

        Reservation reservation = new Reservation();
        reservation.setChambreId(req.chambreId());
        reservation.setClientId(clientId);
        reservation.setDateDebut(req.dateDebut());
        reservation.setDateFin(req.dateFin());
        return reservationRepository.save(reservation);
    }

    public List<Reservation> listerMesReservations(Long clientId) {
        return reservationRepository.findByClientIdOrderByDateDebutDesc(clientId);
    }

    public List<Reservation> listerToutes() {
        return reservationRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public void annuler(Long id, Long clientId, boolean admin) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Reservation introuvable"));

        if (!admin && !reservation.getClientId().equals(clientId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acces refuse");
        }
        reservation.setStatut(StatutReservation.ANNULEE);
        reservationRepository.save(reservation);
    }

    private void verifierPeriodeEtChambre(Long chambreId, LocalDate dateDebut, LocalDate dateFin) {
        if (!dateFin.isAfter(dateDebut)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "date_fin doit etre apres date_debut");
        }
        if (!chambreClient.existe(chambreId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chambre introuvable");
        }
    }

    private long compterChevauchements(Long chambreId, LocalDate dateDebut, LocalDate dateFin) {
        return reservationRepository.compterChevauchements(
                chambreId, StatutReservation.CONFIRMEE, dateDebut, dateFin);
    }
}