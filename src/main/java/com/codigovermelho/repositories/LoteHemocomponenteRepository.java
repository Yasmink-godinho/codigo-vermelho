package com.codigovermelho.repositories;

import com.codigovermelho.models.LoteHemocomponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface LoteHemocomponenteRepository extends JpaRepository<LoteHemocomponente, Long> {

    /**
     * Base da fila FEFO (US03): todos os lotes de um tipo sanguineo,
     * ja ordenados por validade crescente (o que vence primeiro, primeiro).
     */
    List<LoteHemocomponente> findByTipoSanguineoOrderByDataValidadeAsc(TipoSanguineo tipoSanguineo);

    /**
     * Mesma logica do FEFO, mas restrita a uma instituicao especifica.
     */
    List<LoteHemocomponente> findByInstituicaoIdAndTipoSanguineoOrderByDataValidadeAsc(
            Long instituicaoId, TipoSanguineo tipoSanguineo);

    List<LoteHemocomponente> findByInstituicaoId(Long instituicaoId);

    List<LoteHemocomponente> findByInstituicaoIdAndTipoSanguineo(Long instituicaoId, TipoSanguineo tipoSanguineo);

    /**
     * Lotes ja vencidos ou vencendo ate uma data limite — usado no alerta
     * de "risco de vencimento" do dashboard.
     */
    List<LoteHemocomponente> findByDataValidadeLessThanEqual(LocalDate dataLimite);
}
