package com.codigovermelho.repositories;

import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.enums.TipoInstituicao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InstituicaoRepository extends JpaRepository<Instituicao, Long> {

    List<Instituicao> findByTipo(TipoInstituicao tipo);

    List<Instituicao> findByNomeContainingIgnoreCase(String nome);
}
