package com.codigovermelho.repositories;

import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.Ligacao;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LigacaoRepository extends JpaRepository<Ligacao, Long> {

    // a ligacao nao tem direcao, entao precisa olhar nos dois sentidos
    boolean existsByOrigemAndDestino(Instituicao origem, Instituicao destino);
}
