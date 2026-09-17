package com.codigovermelho.services;

import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.Requisicao;
import com.codigovermelho.models.enums.NivelUrgencia;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.repositories.InstituicaoRepository;
import com.codigovermelho.repositories.RequisicaoRepository;
import org.springframework.stereotype.Service;

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

    public Requisicao emitir(Long instituicaoId, TipoSanguineo tipoSanguineo, TipoComponente componente,
                             Integer volume, NivelUrgencia nivelUrgencia, String observacoes) {
        Instituicao instituicao = instituicaoRepository.findById(instituicaoId)
                .orElseThrow(() -> new NoSuchElementException("Instituicao nao encontrada: " + instituicaoId));

        Requisicao requisicao = new Requisicao(instituicao, tipoSanguineo, componente, volume, nivelUrgencia, observacoes);
        return requisicaoRepository.save(requisicao);
    }

    public List<Requisicao> listarTodas() {
        return requisicaoRepository.findAll();
    }

    public Requisicao buscarPorId(Long id) {
        return requisicaoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Requisicao nao encontrada: " + id));
    }
}
