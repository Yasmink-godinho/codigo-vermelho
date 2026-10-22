package com.codigovermelho.repositories;

import com.codigovermelho.models.Transferencia;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransferenciaRepository extends JpaRepository<Transferencia, Long> {
}
