package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.RotaResultado;
import com.codigovermelho.grafos.CalculoDistancia;
import com.codigovermelho.grafos.CaminhoMinimo;
import com.codigovermelho.grafos.Dijkstra;
import com.codigovermelho.grafos.Grafo;
import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.Ligacao;
import com.codigovermelho.repositories.InstituicaoRepository;
import com.codigovermelho.repositories.LigacaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

// US05: monta o grafo da malha com o que esta no banco (instituicoes = nos, ligacoes = arestas)
// e roda o Dijkstra pra achar o menor caminho entre duas instituicoes.
@Service
public class RotaService {

    // velocidade media que eu assumi pro transporte urbano, so pra estimar o tempo
    private static final double VELOCIDADE_MEDIA_KMH = 40.0;

    private final InstituicaoRepository instituicaoRepository;
    private final LigacaoRepository ligacaoRepository;

    public RotaService(InstituicaoRepository instituicaoRepository, LigacaoRepository ligacaoRepository) {
        this.instituicaoRepository = instituicaoRepository;
        this.ligacaoRepository = ligacaoRepository;
    }

    @Transactional(readOnly = true)
    public RotaResultado calcularRota(Long origemId, Long destinoId) {
        if (origemId == null || destinoId == null) {
            throw new IllegalArgumentException("Origem e destino sao obrigatorios");
        }
        if (origemId.equals(destinoId)) {
            throw new IllegalArgumentException("Origem e destino devem ser instituicoes diferentes");
        }

        // se alguma das duas nao existe da 404
        Instituicao origem = instituicaoRepository.findById(origemId)
                .orElseThrow(() -> new NoSuchElementException("Instituicao nao encontrada: " + origemId));
        Instituicao destino = instituicaoRepository.findById(destinoId)
                .orElseThrow(() -> new NoSuchElementException("Instituicao nao encontrada: " + destinoId));

        // nos do grafo: todas as instituicoes cadastradas
        List<Instituicao> todas = instituicaoRepository.findAll();
        List<Long> ids = new ArrayList<>();
        Map<Long, Instituicao> porId = new HashMap<>();
        for (Instituicao inst : todas) {
            ids.add(inst.getId());
            porId.put(inst.getId(), inst);
        }
        Grafo grafo = new Grafo(ids);

        // arestas do grafo: as ligacoes cadastradas, com a distancia em km como peso
        for (Ligacao ligacao : ligacaoRepository.findAll()) {
            grafo.adicionarAresta(ligacao.getOrigem().getId(), ligacao.getDestino().getId(),
                    ligacao.getDistanciaKm());
        }

        CaminhoMinimo caminho = Dijkstra.calcular(grafo, origem.getId(), destino.getId());

        if (!caminho.encontrado()) {
            return new RotaResultado(List.of(), 0.0, 0.0, false, List.of(),
                    "Nao ha rota disponivel entre " + origem.getNome() + " e " + destino.getNome());
        }

        List<String> nomes = new ArrayList<>();
        for (Long id : caminho.ids()) {
            nomes.add(porId.get(id).getNome());
        }
        double km = arredondar(caminho.distanciaKm(), 2);
        double minutos = arredondar(caminho.distanciaKm() / VELOCIDADE_MEDIA_KMH * 60, 1);
        return new RotaResultado(caminho.ids(), km, minutos, true, nomes, "Rota calculada com sucesso");
    }

    private double arredondar(double valor, int casas) {
        double fator = Math.pow(10, casas);
        return Math.round(valor * fator) / fator;
    }
}
