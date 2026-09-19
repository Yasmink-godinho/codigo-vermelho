package com.codigovermelho.services;

import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.Requisicao;
import com.codigovermelho.models.enums.NivelUrgencia;
import com.codigovermelho.models.enums.StatusRequisicao;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.repositories.InstituicaoRepository;
import com.codigovermelho.repositories.RequisicaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class RequisicaoService {
    private final RequisicaoRepository requisicaoRepository;
    private final InstituicaoRepository instituicaoRepository;

    public RequisicaoService(RequisicaoRepository requisicaoRepository,
                             InstituicaoRepository instituicaoRepository) {
        this.requisicaoRepository = requisicaoRepository;
        this.instituicaoRepository = instituicaoRepository;
    }

    @Transactional
    public Requisicao emitir(Long instituicaoId, TipoSanguineo tipoSanguineo, TipoComponente componente,
                             Integer volume, NivelUrgencia nivelUrgencia, String observacoes) {
        Instituicao instituicao = instituicaoRepository.findById(instituicaoId)
                .orElseThrow(() -> new NoSuchElementException("Instituicao nao encontrada: " + instituicaoId));

        Requisicao requisicao = new Requisicao(instituicao, tipoSanguineo, componente, volume, nivelUrgencia, observacoes);
        return requisicaoRepository.save(requisicao);
    }

    /**
     * Lista requisicoes, com filtro opcional por status e/ou nivel de
     * urgencia (conforme docs/CONTRATOS_API.md, US04: GET /api/v1/requisicoes?status=...&urgencia=...).
     * Quando os dois filtros sao informados, aplica status primeiro (via
     * repository) e depois filtra o resultado em memoria pela urgencia —
     * lista pequena o suficiente na U1 para nao precisar de uma query combinada.
     */
    @Transactional(readOnly = true)
    public List<Requisicao> listar(StatusRequisicao status, NivelUrgencia nivelUrgencia) {
        List<Requisicao> base;
        if (status != null) {
            base = requisicaoRepository.findByStatus(status);
        } else if (nivelUrgencia != null) {
            base = requisicaoRepository.findByNivelUrgencia(nivelUrgencia);
        } else {
            base = requisicaoRepository.findAll();
        }
        if (status != null && nivelUrgencia != null) {
            base = base.stream().filter(r -> r.getNivelUrgencia() == nivelUrgencia).toList();
        }
        return base;
    }

    @Transactional(readOnly = true)
    public Requisicao buscarPorId(Long id) {
        return requisicaoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Requisicao nao encontrada: " + id));
    }
}
