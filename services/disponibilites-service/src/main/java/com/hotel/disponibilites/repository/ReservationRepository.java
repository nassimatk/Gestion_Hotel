package com.hotel.disponibilites.repository;

import com.hotel.disponibilites.model.Reservation;
import com.hotel.disponibilites.model.StatutReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    @Query("""
            select count(r) from Reservation r
            where r.chambreId = :chambreId
              and r.statut = :statut
              and r.dateDebut < :dateFin
              and r.dateFin > :dateDebut
            """)
    long compterChevauchements(@Param("chambreId") Long chambreId,
                               @Param("statut") StatutReservation statut,
                               @Param("dateDebut") LocalDate dateDebut,
                               @Param("dateFin") LocalDate dateFin);
    List<Reservation> findByClientIdOrderByDateDebutDesc(Long clientId);

    List<Reservation> findAllByOrderByCreatedAtDesc();
}