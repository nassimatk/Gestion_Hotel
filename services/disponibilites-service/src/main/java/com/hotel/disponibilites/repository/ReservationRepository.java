package com.hotel.disponibilites.repository;

import com.hotel.disponibilites.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
}