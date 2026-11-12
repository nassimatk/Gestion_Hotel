package com.hotel.disponibilites.service;

import com.hotel.disponibilites.client.ChambreClient;
import com.hotel.disponibilites.dto.ReservationRequest;
import com.hotel.disponibilites.model.Reservation;
import com.hotel.disponibilites.model.StatutReservation;
import com.hotel.disponibilites.repository.ReservationRepository;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires des regles metier de DisponibiliteService.
 * Le repository et le client Chambres sont simules : aucune base de donnees,
 * aucun Docker et aucun autre service ne sont necessaires.
 *
 * Limite : la regle de chevauchement elle-meme est ecrite dans la requete JPQL du
 * repository. Ici on verifie que le service l'appelle avec les bons arguments
 * (chambre, statut CONFIRMEE, dates) ; la requete se teste avec un test d'integration.
 */
@ExtendWith(MockitoExtension.class)
class DisponibiliteServiceTest {

    private static final LocalDate DEBUT = LocalDate.of(2027, 1, 10);
    private static final LocalDate FIN = LocalDate.of(2027, 1, 12);

    @Mock
    private ReservationRepository repository;

    @Mock
    private ChambreClient chambreClient;

    @InjectMocks
    private DisponibiliteService service;

    // ---------- outils ----------

    private static void assertErreur(ThrowingCallable appel, int codeAttendu) {
        assertThatThrownBy(appel).isInstanceOfSatisfying(ResponseStatusException.class,
                e -> assertThat(e.getStatusCode().value()).isEqualTo(codeAttendu));
    }

    private static Reservation reservation(Long clientId) {
        Reservation r = new Reservation();
        r.setChambreId(1L);
        r.setClientId(clientId);
        r.setDateDebut(DEBUT);
        r.setDateFin(FIN);
        return r;
    }

    // ---------- estLibre ----------

    @Test
    @DisplayName("estLibre : date de depart avant l'arrivee -> 400 et aucun appel externe")
    void estLibre_datesInversees() {
        assertErreur(() -> service.estLibre(1L, FIN, DEBUT), 400);
        verifyNoInteractions(repository, chambreClient);
    }

    @Test
    @DisplayName("estLibre : arrivee et depart le meme jour -> 400")
    void estLibre_memeJour() {
        assertErreur(() -> service.estLibre(1L, DEBUT, DEBUT), 400);
        verifyNoInteractions(repository, chambreClient);
    }

    @Test
    @DisplayName("estLibre : chambre inconnue -> 404 sans interroger les reservations")
    void estLibre_chambreInconnue() {
        when(chambreClient.existe(99L)).thenReturn(false);

        assertErreur(() -> service.estLibre(99L, DEBUT, FIN), 404);
        verifyNoInteractions(repository);
    }

    @Test
    @DisplayName("estLibre : aucun chevauchement -> chambre libre")
    void estLibre_libre() {
        when(chambreClient.existe(1L)).thenReturn(true);
        when(repository.compterChevauchements(1L, StatutReservation.CONFIRMEE, DEBUT, FIN))
                .thenReturn(0L);

        assertThat(service.estLibre(1L, DEBUT, FIN)).isTrue();
    }

    @Test
    @DisplayName("estLibre : un chevauchement CONFIRMEE -> chambre occupee")
    void estLibre_occupee() {
        when(chambreClient.existe(1L)).thenReturn(true);
        // Les arguments exacts (statut CONFIRMEE + dates) font partie du test :
        // si le service passait un autre statut, le mock renverrait 0 et le test echouerait.
        when(repository.compterChevauchements(1L, StatutReservation.CONFIRMEE, DEBUT, FIN))
                .thenReturn(1L);

        assertThat(service.estLibre(1L, DEBUT, FIN)).isFalse();
    }

    // ---------- creer ----------

    @Test
    @DisplayName("creer : chambre_id manquant -> 400 sans aucun appel")
    void creer_champManquant() {
        ReservationRequest requete = new ReservationRequest(null, DEBUT, FIN);

        assertErreur(() -> service.creer(requete, 7L), 400);
        verifyNoInteractions(repository, chambreClient);
    }

    @Test
    @DisplayName("creer : dates inversees -> 400 et rien n'est enregistre")
    void creer_datesInversees() {
        ReservationRequest requete = new ReservationRequest(1L, FIN, DEBUT);

        assertErreur(() -> service.creer(requete, 7L), 400);
        verifyNoInteractions(repository, chambreClient);
    }

    @Test
    @DisplayName("creer : chambre inconnue -> 404 et rien n'est enregistre")
    void creer_chambreInconnue() {
        when(chambreClient.existe(99L)).thenReturn(false);

        assertErreur(() -> service.creer(new ReservationRequest(99L, DEBUT, FIN), 7L), 404);
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("creer : chevauchement -> 409 et rien n'est enregistre")
    void creer_chevauchement() {
        when(chambreClient.existe(1L)).thenReturn(true);
        when(repository.compterChevauchements(1L, StatutReservation.CONFIRMEE, DEBUT, FIN))
                .thenReturn(1L);

        assertErreur(() -> service.creer(new ReservationRequest(1L, DEBUT, FIN), 7L), 409);
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("creer : succes -> reservation CONFIRMEE avec le client_id fourni par le jeton")
    void creer_succes() {
        when(chambreClient.existe(1L)).thenReturn(true);
        when(repository.compterChevauchements(1L, StatutReservation.CONFIRMEE, DEBUT, FIN))
                .thenReturn(0L);
        when(repository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        Reservation resultat = service.creer(new ReservationRequest(1L, DEBUT, FIN), 7L);

        ArgumentCaptor<Reservation> captor = ArgumentCaptor.forClass(Reservation.class);
        verify(repository).save(captor.capture());
        Reservation enregistree = captor.getValue();
        assertThat(enregistree.getChambreId()).isEqualTo(1L);
        assertThat(enregistree.getClientId()).isEqualTo(7L);
        assertThat(enregistree.getDateDebut()).isEqualTo(DEBUT);
        assertThat(enregistree.getDateFin()).isEqualTo(FIN);
        assertThat(enregistree.getStatut()).isEqualTo(StatutReservation.CONFIRMEE);
        assertThat(resultat).isSameAs(enregistree);
    }

    // ---------- annuler ----------

    @Test
    @DisplayName("annuler : reservation inexistante -> 404")
    void annuler_introuvable() {
        when(repository.findById(10L)).thenReturn(Optional.empty());

        assertErreur(() -> service.annuler(10L, 7L, false), 404);
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("annuler : un client ne peut pas annuler la reservation d'un autre -> 403")
    void annuler_pasProprietaire() {
        Reservation r = reservation(7L);
        when(repository.findById(10L)).thenReturn(Optional.of(r));

        assertErreur(() -> service.annuler(10L, 8L, false), 403);
        assertThat(r.getStatut()).isEqualTo(StatutReservation.CONFIRMEE);
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("annuler : le proprietaire passe sa reservation a ANNULEE (sans suppression)")
    void annuler_proprietaire() {
        Reservation r = reservation(7L);
        when(repository.findById(10L)).thenReturn(Optional.of(r));

        service.annuler(10L, 7L, false);

        assertThat(r.getStatut()).isEqualTo(StatutReservation.ANNULEE);
        verify(repository).save(r);
    }

    @Test
    @DisplayName("annuler : un admin peut annuler la reservation de n'importe quel client")
    void annuler_admin() {
        Reservation r = reservation(7L);
        when(repository.findById(10L)).thenReturn(Optional.of(r));

        service.annuler(10L, 99L, true);

        assertThat(r.getStatut()).isEqualTo(StatutReservation.ANNULEE);
        verify(repository).save(r);
    }

    // ---------- listes ----------

    @Test
    @DisplayName("listerMesReservations : renvoie les reservations du client demande")
    void listerMesReservations() {
        List<Reservation> attendues = List.of(reservation(7L));
        when(repository.findByClientIdOrderByDateDebutDesc(7L)).thenReturn(attendues);

        assertThat(service.listerMesReservations(7L)).isSameAs(attendues);
    }

    @Test
    @DisplayName("listerToutes : renvoie toutes les reservations")
    void listerToutes() {
        List<Reservation> attendues = List.of(reservation(7L), reservation(8L));
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(attendues);

        assertThat(service.listerToutes()).isSameAs(attendues);
    }

    // ---------- chambres occupees ----------

    @Test
    @DisplayName("chambresOccupees : dates inversees -> 400 sans requete")
    void chambresOccupees_datesInversees() {
        assertErreur(() -> service.chambresOccupees(FIN, DEBUT), 400);
        verifyNoInteractions(repository);
    }

    @Test
    @DisplayName("chambresOccupees : ne considere que les reservations CONFIRMEE")
    void chambresOccupees_succes() {
        when(repository.chercherChambresOccupees(StatutReservation.CONFIRMEE, DEBUT, FIN))
                .thenReturn(List.of(1L, 4L));

        assertThat(service.chambresOccupees(DEBUT, FIN)).containsExactly(1L, 4L);
    }
}
