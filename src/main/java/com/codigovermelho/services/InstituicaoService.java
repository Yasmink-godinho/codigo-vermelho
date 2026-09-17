package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.NovaInstituicaoRequest;
import com.codigovermelho.models.Instituicao;
import com.codigovermelho.repositories.InstituicaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class InstituicaoService {

    private final InstituicaoRepository instituicaoRepository;

    public InstituicaoService(InstituicaoRepository instituicaoRepository) {
        this.instituicaoRepository = instituicaoRepository;
    }

    @Transactional
    public Instituicao salvar(NovaInstituicaoRequest request) {
        Instituicao instituicao = new Instituicao(
                request.nome(),
                request.tipo(),
                request.endereco(),
                request.latitude(),
                request.longitude()
        );

        if (request.estoqueMinimoPorTipo() != null) {
            request.estoqueMinimoPorTipo().forEach(instituicao::definirEstoqueMinimo);
        }

        return instituicaoRepository.save(instituicao);
    }

    public List<Instituicao> listarTodas() {
        return instituicaoRepository.findAll();
    }

    public Instituicao buscarPorId(Long id) {
        return instituicaoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Instituicao nao encontrada: " + id));
    }
}