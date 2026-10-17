package com.codigovermelho.repositories;

import com.codigovermelho.models.LeituraTelemetria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeituraTelemetriaRepository extends JpaRepository<LeituraTelemetria, Long> {

    // historico em ordem cronologica (o id desempata se duas leituras tiverem a mesma hora)
    List<LeituraTelemetria> findByTransferenciaIdOrderByDataHoraAscIdAsc(Long transferenciaId);
}
