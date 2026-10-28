package com.codigovermelho.repositories;

import com.codigovermelho.models.RecomendacaoRedistribuicao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecomendacaoRedistribuicaoRepository extends JpaRepository<RecomendacaoRedistribuicao, Long> {
    List<RecomendacaoRedistribuicao> findByStatus(String status);
}