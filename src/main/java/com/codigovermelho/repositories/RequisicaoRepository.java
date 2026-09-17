package com.codigovermelho.repositories;

import com.codigovermelho.models.Requisicao;
import com.codigovermelho.models.enums.NivelUrgencia;
import com.codigovermelho.models.enums.StatusRequisicao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequisicaoRepository extends JpaRepository<Requisicao, Long> {

    List<Requisicao> findByStatus(StatusRequisicao status);

    List<Requisicao> findByNivelUrgencia(NivelUrgencia nivelUrgencia);
}
