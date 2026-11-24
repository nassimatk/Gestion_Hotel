package com.hotel.disponibilites.service;

import com.hotel.disponibilites.client.AuthClient;
import com.hotel.disponibilites.client.ChambreClient;
import com.hotel.disponibilites.dto.ReservationRequest;
import com.hotel.disponibilites.model.Reservation;
import com.hotel.disponibilites.model.StatutReservation;
import com.hotel.disponibilites.repository.ReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DisponibiliteServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ChambreClient chambreClient;

    @Mock
    private AuthClient authClient;

    private DisponibiliteService service;

    @BeforeEach
    void setUp() {
        service = new DisponibiliteService(reservationRepository, chambreClient, authClient);
    }

    @Test
    void estLibre_quandChambreLibre_retourneTrue() {
        LocalDate debut = LocalDate.of(2026, 12, 1);
        LocalDate fin = LocalDate.of(2026, 12, 4);

        when(chambreClient.existe(3L)).thenReturn(true);
        when(reservationRepository.compterChevauchements(3L, StatutReservation.CONFIRMEE, debut, fin))
                .thenReturn(0L);

        assertTrue(service.estLibre(3L, debut, fin));
    }

    @Test
    void estLibre_quandChambreOccupee_retourneFalse() {
        LocalDate debut = LocalDate.of(2026, 12, 1);
        LocalDate fin = LocalDate.of(2026, 12, 4);

        when(chambreClient.existe(3L)).thenReturn(true);
        when(reservationRepository.compterChevauchements(3L, StatutReservation.CONFIRMEE, debut, fin))
                .thenReturn(1L);

        assertFalse(service.estLibre(3L, debut, fin));
    }

    @Test
    void estLibre_quandDatesInvalides_lanceBadRequest() {
        LocalDate debut = LocalDate.of(2026, 12, 5);
        LocalDate fin = LocalDate.of(2026, 12, 2);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.estLibre(3L, debut, fin)
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void creer_quandDonneesValides_enregistreReservation() {
        LocalDate debut = LocalDate.of(2026, 12, 10);
        LocalDate fin = LocalDate.of(2026, 12, 12);

        ReservationRequest req = mock(ReservationRequest.class);
        when(req.chambreId()).thenReturn(3L);
        when(req.dateDebut()).thenReturn(debut);
        when(req.dateFin()).thenReturn(fin);
        when(req.nombrePersonnes()).thenReturn(2);
        when(req.telephone()).thenReturn("0612345678");

        when(chambreClient.getCapacite(3L)).thenReturn(Optional.of(2));
        when(reservationRepository.compterChevauchements(3L, StatutReservation.CONFIRMEE, debut, fin))
                .thenReturn(0L);
        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Reservation resultat = service.creer(req, 15L);

        assertNotNull(resultat);
        assertEquals(3L, resultat.getChambreId());
        assertEquals(15L, resultat.getClientId());
        assertEquals("0612345678", resultat.getTelephone());
        verify(reservationRepository).save(any(Reservation.class));
    }

    @Test
    void creer_quandConflitDates_lanceConflict() {
        LocalDate debut = LocalDate.of(2026, 12, 10);
        LocalDate fin = LocalDate.of(2026, 12, 12);

        ReservationRequest req = mock(ReservationRequest.class);
        when(req.chambreId()).thenReturn(3L);
        when(req.dateDebut()).thenReturn(debut);
        when(req.dateFin()).thenReturn(fin);
        when(req.nombrePersonnes()).thenReturn(2);
        when(req.telephone()).thenReturn("0612345678");

        when(chambreClient.getCapacite(3L)).thenReturn(Optional.of(2));
        when(reservationRepository.compterChevauchements(3L, StatutReservation.CONFIRMEE, debut, fin))
                .thenReturn(1L);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.creer(req, 15L)
        );
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    void creer_quandCapaciteDepassee_lanceBadRequest() {
        LocalDate debut = LocalDate.of(2026, 12, 10);
        LocalDate fin = LocalDate.of(2026, 12, 12);

        ReservationRequest req = mock(ReservationRequest.class);
        when(req.chambreId()).thenReturn(3L);
        when(req.dateDebut()).thenReturn(debut);
        when(req.dateFin()).thenReturn(fin);
        when(req.nombrePersonnes()).thenReturn(5);
        when(req.telephone()).thenReturn("0612345678");

        when(chambreClient.getCapacite(3L)).thenReturn(Optional.of(2));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.creer(req, 15L)
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void annuler_parProprietaire_passeStatutAnnulee() {
        Reservation reservation = new Reservation();
        reservation.setClientId(15L);
        reservation.setStatut(StatutReservation.CONFIRMEE);

        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        service.annuler(1L, 15L, false);

        assertEquals(StatutReservation.ANNULEE, reservation.getStatut());
        verify(reservationRepository).save(reservation);
    }

    @Test
    void annuler_parAutreClientNonAdmin_lanceForbidden() {
        Reservation reservation = new Reservation();
        reservation.setClientId(15L);
        reservation.setStatut(StatutReservation.CONFIRMEE);

        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.annuler(1L, 99L, false)
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}