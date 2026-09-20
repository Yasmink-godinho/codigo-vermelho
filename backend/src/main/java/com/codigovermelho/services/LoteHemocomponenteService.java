package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.AtualizarLoteRequest;
import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.LoteHemocomponente;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.repositories.InstituicaoRepository;
import com.codigovermelho.repositories.LoteHemocomponenteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public LoteHemocomponente registrar(Long instituicaoId, TipoSanguineo tipoSanguineo,
                                        TipoComponente componente, LocalDate dataColeta,
                                        LocalDate validade, Integer quantidade) {
        Instituicao instituicao = buscarInstituicao(instituicaoId);
        LoteHemocomponente lote;
        if (validade == null) {
            lote = new LoteHemocomponente(tipoSanguineo, componente, dataColeta, quantidade, instituicao);
        } else {
            lote = new LoteHemocomponente(tipoSanguineo, componente, dataColeta, validade, quantidade, instituicao);
        }
        return loteRepository.save(lote);
    }

    @Transactional(readOnly = true)
    public List<LoteHemocomponente> listarPorInstituicao(Long instituicaoId) {
        buscarInstituicao(instituicaoId);
        return loteRepository.findByInstituicaoId(instituicaoId);
    }

    @Transactional(readOnly = true)
    public List<LoteHemocomponente> listar(TipoSanguineo tipoSanguineo, TipoComponente componente,
                                           LocalDate validadeAte) {
        return loteRepository.findAll().stream()
                .filter(l -> tipoSanguineo == null || l.getTipoSanguineo() == tipoSanguineo)
                .filter(l -> componente == null || l.getComponente() == componente)
                .filter(l -> validadeAte == null || !l.getDataValidade().isAfter(validadeAte))
                .toList();
    }

    @Transactional(readOnly = true)
    public LoteHemocomponente buscarPorId(Long id) {
        return loteRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Lote nao encontrado: " + id));
    }

    @Transactional
    public LoteHemocomponente atualizar(Long id, AtualizarLoteRequest request) {
        LoteHemocomponente lote = buscarPorId(id);
        if (request.validade() != null) {
            lote.setDataValidade(request.validade());
        }
        return loteRepository.save(lote);
    }

    @Transactional
    public void excluir(Long id) {
        LoteHemocomponente lote = buscarPorId(id);
        loteRepository.delete(lote);
    }

    @Transactional(readOnly = true)
    public List<LoteHemocomponente> filaFefo(TipoSanguineo tipoSanguineo, Long instituicaoId) {
        List<LoteHemocomponente> lotes;
        if (instituicaoId != null && tipoSanguineo != null) {
            lotes = loteRepository.findByInstituicaoIdAndTipoSanguineoOrderByDataValidadeAsc(instituicaoId, tipoSanguineo);
        } else if (tipoSanguineo != null) {
            lotes = loteRepository.findByTipoSanguineoOrderByDataValidadeAsc(tipoSanguineo);
        } else if (instituicaoId != null) {
            lotes = loteRepository.findByInstituicaoId(instituicaoId);
            lotes = lotes.stream().sorted(java.util.Comparator.comparing(LoteHemocomponente::getDataValidade)).toList();
        } else {
            lotes = loteRepository.findAll().stream()
                    .sorted(java.util.Comparator.comparing(LoteHemocomponente::getDataValidade)).toList();
        }
        return lotes.stream().filter(lote -> !lote.isVencido()).toList();
    }

    private Instituicao buscarInstituicao(Long id) {
        return instituicaoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Instituicao nao encontrada: " + id));
    }
}
