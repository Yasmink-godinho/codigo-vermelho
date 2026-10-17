package com.codigovermelho.repositories;

import com.codigovermelho.models.AlertaTermico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertaTermicoRepository extends JpaRepository<AlertaTermico, Long> {

    // mais recentes primeiro
    List<AlertaTermico> findByTransferenciaIdOrderByDataHoraDescIdDesc(Long transferenciaId);

    List<AlertaTermico> findAllByOrderByDataHoraDescIdDesc();
}
