package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.AtualizarInstituicaoRequest;
import com.codigovermelho.controllers.dto.NovaInstituicaoRequest;
import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.enums.TipoInstituicao;
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
                request.nome(), request.tipo(), request.endereco(), request.latitude(), request.longitude());
        aplicarEstoqueMinimo(instituicao, request.estoqueMinimoPorTipo());
        return instituicaoRepository.save(instituicao);
    }

    @Transactional(readOnly = true)
    public List<Instituicao> listar(TipoInstituicao tipo) {
        return tipo == null ? instituicaoRepository.findAll() : instituicaoRepository.findByTipo(tipo);
    }

    @Transactional(readOnly = true)
    public Instituicao buscarPorId(Long id) {
        return instituicaoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Instituicao nao encontrada: " + id));
    }

    @Transactional
    public Instituicao atualizar(Long id, AtualizarInstituicaoRequest request) {
        Instituicao instituicao = buscarPorId(id);
        instituicao.setNome(request.nome());
        instituicao.setTipo(request.tipo());
        instituicao.setEndereco(request.endereco());
        instituicao.setLatitude(request.latitude());
        instituicao.setLongitude(request.longitude());
        if (request.estoqueMinimoPorTipo() != null) {
            request.estoqueMinimoPorTipo().forEach(instituicao::definirEstoqueMinimo);
        }
        return instituicaoRepository.save(instituicao);
    }

    @Transactional
    public void excluir(Long id) {
        Instituicao instituicao = buscarPorId(id);
        instituicaoRepository.delete(instituicao);
    }

    private void aplicarEstoqueMinimo(Instituicao instituicao,
                                      java.util.Map<com.codigovermelho.models.enums.TipoSanguineo, Integer> estoque) {
        if (estoque != null) {
            estoque.forEach(instituicao::definirEstoqueMinimo);
        }
    }
}
