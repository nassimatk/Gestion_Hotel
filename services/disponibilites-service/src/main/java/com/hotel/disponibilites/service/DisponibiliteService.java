package com.hotel.disponibilites.service;

import com.hotel.disponibilites.client.AuthClient;
import com.hotel.disponibilites.client.AuthClient.UserInfo;
import com.hotel.disponibilites.client.ChambreClient;
import com.hotel.disponibilites.client.ChambreClient.ChambreInfo;
import com.hotel.disponibilites.dto.ReservationRequest;
import com.hotel.disponibilites.dto.ReservationResponse;
import com.hotel.disponibilites.model.Reservation;
import com.hotel.disponibilites.model.StatutReservation;
import com.hotel.disponibilites.repository.ReservationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DisponibiliteService {

    private final ReservationRepository reservationRepository;
    private final ChambreClient chambreClient;
    private final AuthClient authClient;

    public DisponibiliteService(ReservationRepository reservationRepository,
                                ChambreClient chambreClient,
                                AuthClient authClient) {
        this.reservationRepository = reservationRepository;
        this.chambreClient = chambreClient;
        this.authClient = authClient;
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
        if (req.nombrePersonnes() == null || req.nombrePersonnes() < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "nombre_personnes doit etre au moins 1");
        }
        if (req.telephone() == null || req.telephone().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le telephone est obligatoire");
        }
        if (!req.dateFin().isAfter(req.dateDebut())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "date_fin doit etre apres date_debut");
        }

        Integer capaciteMax = chambreClient.getCapacite(req.chambreId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chambre introuvable"));

        if (req.nombrePersonnes() > capaciteMax) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le nombre de personnes depasse la capacite de la chambre (" + capaciteMax + ")");
        }

        if (compterChevauchements(req.chambreId(), req.dateDebut(), req.dateFin()) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Chambre deja reservee sur cette periode");
        }

        Reservation reservation = new Reservation();
        reservation.setChambreId(req.chambreId());
        reservation.setClientId(clientId);
        reservation.setDateDebut(req.dateDebut());
        reservation.setDateFin(req.dateFin());
        reservation.setNombrePersonnes(req.nombrePersonnes());
        reservation.setTelephone(req.telephone().trim());
        return reservationRepository.save(reservation);
    }

    public List<Reservation> listerMesReservations(Long clientId) {
        return reservationRepository.findByClientIdOrderByDateDebutDesc(clientId);
    }

    public List<Reservation> listerToutes() {
        return reservationRepository.findAllByOrderByCreatedAtDesc();
    }

    public ReservationResponse enrichir(Reservation r) {
        ChambreInfo chambre = securiserGetChambre(r.getChambreId());
        UserInfo user = authClient.getUser(r.getClientId()).orElse(null);
        return ReservationResponse.from(r, chambre, user);
    }

    public List<ReservationResponse> enrichirListe(List<Reservation> reservations) {
        Map<Long, ChambreInfo> chambresCache = new HashMap<>();
        Map<Long, UserInfo> usersCache = new HashMap<>();

        return reservations.stream().map(r -> {
            ChambreInfo chambre = chambresCache.computeIfAbsent(
                    r.getChambreId(), this::securiserGetChambre);
            UserInfo user = usersCache.computeIfAbsent(
                    r.getClientId(), id -> authClient.getUser(id).orElse(null));
            return ReservationResponse.from(r, chambre, user);
        }).toList();
    }

    private ChambreInfo securiserGetChambre(Long chambreId) {
        try {
            return chambreClient.getChambre(chambreId).orElse(null);
        } catch (Exception e) {
            return null;
        }
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

    public List<Long> chambresOccupees(LocalDate dateDebut, LocalDate dateFin) {
        if (!dateFin.isAfter(dateDebut)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "date_fin doit etre apres date_debut");
        }
        return reservationRepository.chercherChambresOccupees(
                StatutReservation.CONFIRMEE, dateDebut, dateFin);
    }
}