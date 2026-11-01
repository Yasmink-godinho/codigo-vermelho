package com.codigovermelho.repositories;

import com.codigovermelho.models.Requisicao;
import com.codigovermelho.models.enums.NivelUrgencia;
import com.codigovermelho.models.enums.StatusRequisicao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.util.List;

public interface RequisicaoRepository extends JpaRepository<Requisicao, Long> {
    List<Requisicao> findByStatus(StatusRequisicao status);
    List<Requisicao> findByNivelUrgencia(NivelUrgencia nivelUrgencia);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select r from Requisicao r where r.id = :id")
    java.util.Optional<Requisicao> buscarPorIdComBloqueio(@org.springframework.data.repository.query.Param("id") Long id);
}
