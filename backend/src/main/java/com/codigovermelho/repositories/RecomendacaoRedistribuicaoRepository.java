package com.codigovermelho.repositories;

import com.codigovermelho.models.RecomendacaoRedistribuicao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecomendacaoRedistribuicaoRepository extends JpaRepository<RecomendacaoRedistribuicao, Long> {
    List<RecomendacaoRedistribuicao> findByStatus(String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from RecomendacaoRedistribuicao r where r.id = :id")
    java.util.Optional<RecomendacaoRedistribuicao> buscarPorIdComBloqueio(@Param("id") Long id);
}