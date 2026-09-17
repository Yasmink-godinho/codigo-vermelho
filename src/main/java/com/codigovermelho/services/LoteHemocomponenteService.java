package com.codigovermelho.services;

import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.LoteHemocomponente;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.repositories.InstituicaoRepository;
import com.codigovermelho.repositories.LoteHemocomponenteRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class LoteHemocomponenteService {

    private final LoteHemocomponenteRepository loteRepository;
    private final InstituicaoRepository instituicaoRepository;

    public LoteHemocomponenteService(LoteHemocomponenteRepository loteRepository,
                                     InstituicaoRepository instituicaoRepository) {
        this.loteRepository = loteRepository;
        this.instituicaoRepository = instituicaoRepository;
    }

    public LoteHemocomponente registrar(Long instituicaoId, TipoSanguineo tipoSanguineo,
                                        TipoComponente componente, LocalDate dataColeta, Integer quantidade) {
        Instituicao instituicao = instituicaoRepository.findById(instituicaoId)
                .orElseThrow(() -> new NoSuchElementException("Instituicao nao encontrada: " + instituicaoId));

        LoteHemocomponente lote = new LoteHemocomponente(tipoSanguineo, componente, dataColeta, quantidade, instituicao);
        return loteRepository.save(lote);
    }

    public List<LoteHemocomponente> listarPorInstituicao(Long instituicaoId) {
        return loteRepository.findByInstituicaoId(instituicaoId);
    }

    /**
     * Consulta da Fila FEFO (US03):
     * Filtra opcionalmente por tipo sanguíneo e/ou instituição,
     * trazendo os lotes ordenados por data de validade crescente e ignorando os vencidos.
     */
    public List<LoteHemocomponente> filaFefo(TipoSanguineo tipoSanguineo, Long instituicaoId) {
        List<LoteHemocomponente> lotes;

        if (instituicaoId != null && tipoSanguineo != null) {
            lotes = loteRepository.findByInstituicaoIdAndTipoSanguineoOrderByDataValidadeAsc(instituicaoId, tipoSanguineo);
        } else if (tipoSanguineo != null) {
            lotes = loteRepository.findByTipoSanguineoOrderByDataValidadeAsc(tipoSanguineo);
        } else if (instituicaoId != null) {
            lotes = loteRepository.findByInstituicaoId(instituicaoId);
        } else {
            lotes = loteRepository.findAll();
        }

        return lotes.stream()
                .filter(lote -> !lote.isVencido())
                .toList();
    }
}