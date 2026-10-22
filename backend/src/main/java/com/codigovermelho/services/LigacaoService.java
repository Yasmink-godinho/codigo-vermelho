package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.NovaLigacaoRequest;
import com.codigovermelho.exceptions.RegraDeNegocioException;
import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.Ligacao;
import com.codigovermelho.repositories.InstituicaoRepository;
import com.codigovermelho.repositories.LigacaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

// Cadastro das ligacoes (arestas) da malha logistica. Sem elas o Dijkstra nao tem por onde andar.
@Service
public class LigacaoService {

    private final LigacaoRepository ligacaoRepository;
    private final InstituicaoRepository instituicaoRepository;

    public LigacaoService(LigacaoRepository ligacaoRepository, InstituicaoRepository instituicaoRepository) {
        this.ligacaoRepository = ligacaoRepository;
        this.instituicaoRepository = instituicaoRepository;
    }

    @Transactional
    public Ligacao criar(NovaLigacaoRequest request) {
        Instituicao origem = buscarInstituicao(request.origemId());
        Instituicao destino = buscarInstituicao(request.destinoId());

        // como nao tem direcao, A-B e B-A sao a mesma ligacao
        if (ligacaoRepository.existsByOrigemAndDestino(origem, destino)
                || ligacaoRepository.existsByOrigemAndDestino(destino, origem)) {
            throw new RegraDeNegocioException("Essas duas instituicoes ja estao ligadas");
        }
        return ligacaoRepository.save(new Ligacao(origem, destino));
    }

    @Transactional(readOnly = true)
    public List<Ligacao> listar() {
        return ligacaoRepository.findAll();
    }

    @Transactional
    public void excluir(Long id) {
        Ligacao ligacao = ligacaoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Ligacao nao encontrada: " + id));
        ligacaoRepository.delete(ligacao);
    }

    private Instituicao buscarInstituicao(Long id) {
        return instituicaoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Instituicao nao encontrada: " + id));
    }
}
