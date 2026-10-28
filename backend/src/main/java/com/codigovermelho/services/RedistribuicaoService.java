package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.RecomendacaoRedistribuicaoResponse;
import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.LoteHemocomponente;
import com.codigovermelho.models.RecomendacaoRedistribuicao;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.repositories.InstituicaoRepository;
import com.codigovermelho.repositories.LoteHemocomponenteRepository;
import com.codigovermelho.repositories.RecomendacaoRedistribuicaoRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class RedistribuicaoService {

    private final RecomendacaoRedistribuicaoRepository repository;
    private final LoteHemocomponenteRepository loteRepository;
    private final InstituicaoRepository instituicaoRepository;
    private final GeminiAIService geminiAIService;

    private final AtomicInteger ponteiroRotacao = new AtomicInteger(0);

    public RedistribuicaoService(RecomendacaoRedistribuicaoRepository repository,
                                 LoteHemocomponenteRepository loteRepository,
                                 InstituicaoRepository instituicaoRepository,
                                 GeminiAIService geminiAIService) {
        this.repository = repository;
        this.loteRepository = loteRepository;
        this.instituicaoRepository = instituicaoRepository;
        this.geminiAIService = geminiAIService;
    }

    @PostConstruct
    public void inicializarRecomendacoesSeVazio() {
        if (repository.count() == 0) {
            try {
                gerarAutomaticaBaseadaEmEstoque();
            } catch (Exception e) {
                // Se o banco ainda não terminou de carregar os lotes, inicia com sugestão padrão segura
                List<String> motivos = geminiAIService.gerarExplicabilidadeRedistribuicao(
                        "Fundação HEMOPE", "Hospital Universitário Oswaldo Cruz", "O-", 2, 2.1
                );
                RecomendacaoRedistribuicao recInicial = new RecomendacaoRedistribuicao(
                        1L, "Fundação HEMOPE",
                        3L, "Hospital Universitário Oswaldo Cruz",
                        "O-", "Concentrado de Hemácias",
                        2,
                        "Urgência Alta",
                        "PENDENTE",
                        motivos
                );
                repository.save(recInicial);
            }
        }
    }

    public RecomendacaoRedistribuicaoResponse gerarAutomaticaBaseadaEmEstoque() {
        List<LoteHemocomponente> todosLotes = loteRepository.findAll();
        List<Instituicao> todasInsts = instituicaoRepository.findAll();

        List<LoteHemocomponente> lotesComSaldo = todosLotes.stream()
                .filter(l -> l.getQuantidade() != null && l.getQuantidade() >= 2)
                .collect(Collectors.toList());

        Long origemId;
        String origemNome;
        String tipoSang;
        String comp;
        int quantidade;

        if (!lotesComSaldo.isEmpty()) {
            int idxLote = Math.abs(ponteiroRotacao.getAndIncrement()) % lotesComSaldo.size();
            LoteHemocomponente loteEscolhido = lotesComSaldo.get(idxLote);

            origemId = loteEscolhido.getInstituicao().getId();
            origemNome = loteEscolhido.getInstituicao().getNome();
            tipoSang = converterEnumParaSigla(loteEscolhido.getTipoSanguineo());
            comp = converterEnumParaComponente(loteEscolhido.getComponente());
            quantidade = Math.min(3, Math.max(1, loteEscolhido.getQuantidade() / 4));
            if (quantidade == 0) quantidade = 1;
        } else {
            origemId = 1L;
            origemNome = "Fundação HEMOPE";
            tipoSang = "O-";
            comp = "Concentrado de Hemácias";
            quantidade = 2;
        }

        List<Instituicao> possiveisDestinos = todasInsts.stream()
                .filter(i -> !i.getId().equals(origemId))
                .collect(Collectors.toList());

        Long destinoId = 3L;
        String destinoNome = "Hospital Universitário Oswaldo Cruz";

        if (!possiveisDestinos.isEmpty()) {
            int idxDestino = Math.abs(ponteiroRotacao.get()) % possiveisDestinos.size();
            Instituicao destinoEscolhido = possiveisDestinos.get(idxDestino);
            destinoId = destinoEscolhido.getId();
            destinoNome = destinoEscolhido.getNome();
        }

        return criarERegistrarRecomendacao(origemId, origemNome, destinoId, destinoNome, tipoSang, comp, quantidade);
    }

    @Transactional
    public Optional<RecomendacaoRedistribuicaoResponse> aprovar(Long id) {
        return repository.findById(id).map(rec -> {
            rec.setStatus("APROVADA");

            TipoSanguineo enumTipo = converterSiglaParaEnum(rec.getTipoSanguineo());

            // Abate estoque na Origem via FEFO (menor validade sai primeiro)
            List<LoteHemocomponente> lotesOrigem = loteRepository
                    .findByInstituicaoIdAndTipoSanguineoOrderByDataValidadeAsc(rec.getOrigemId(), enumTipo);

            int restante = rec.getQuantidade();
            for (LoteHemocomponente lote : lotesOrigem) {
                if (restante <= 0) break;
                if (lote.getQuantidade() <= restante) {
                    restante -= lote.getQuantidade();
                    loteRepository.delete(lote);
                } else {
                    lote.setQuantidade(lote.getQuantidade() - restante);
                    loteRepository.save(lote);
                    restante = 0;
                }
            }

            RecomendacaoRedistribuicao atualizada = repository.save(rec);
            return converterParaResponse(atualizada);
        });
    }

    public Optional<RecomendacaoRedistribuicaoResponse> recusar(Long id, String justificativa) {
        return repository.findById(id).map(rec -> {
            rec.setStatus("RECUSADA");
            rec.setJustificativaRecusa(justificativa != null && !justificativa.isBlank()
                    ? justificativa
                    : "Recusada pela Gestora da Hemorrede com base na avaliação clínica.");
            RecomendacaoRedistribuicao atualizada = repository.save(rec);
            return converterParaResponse(atualizada);
        });
    }

    private RecomendacaoRedistribuicaoResponse criarERegistrarRecomendacao(
            Long origemId, String origemNome, Long destinoId, String destinoNome,
            String tipoSanguineo, String componente, int quantidade) {

        List<String> motivos = geminiAIService.gerarExplicabilidadeRedistribuicao(
                origemNome, destinoNome, tipoSanguineo, quantidade, 2.1
        );

        RecomendacaoRedistribuicao rec = new RecomendacaoRedistribuicao(
                origemId, origemNome,
                destinoId, destinoNome,
                tipoSanguineo, componente,
                quantidade,
                "Urgência Alta",
                "PENDENTE",
                motivos
        );

        RecomendacaoRedistribuicao salva = repository.save(rec);
        return converterParaResponse(salva);
    }

    public List<RecomendacaoRedistribuicaoResponse> listarTodas() {
        return repository.findAll().stream()
                .map(this::converterParaResponse)
                .collect(Collectors.toList());
    }

    private String converterEnumParaComponente(TipoComponente c) {
        if (c == null) return "Concentrado de Hemácias";
        switch (c) {
            case PLAQUETAS: return "Plaquetas";
            case PLASMA: return "Plasma";
            case CRIOPRECIPITADO: return "Crioprecipitado";
            default: return "Concentrado de Hemácias";
        }
    }

    private TipoSanguineo converterSiglaParaEnum(String sigla) {
        if (sigla == null) return TipoSanguineo.O_POSITIVO;
        switch (sigla.trim().toUpperCase()) {
            case "O+": return TipoSanguineo.O_POSITIVO;
            case "O-": return TipoSanguineo.O_NEGATIVO;
            case "A+": return TipoSanguineo.A_POSITIVO;
            case "A-": return TipoSanguineo.A_NEGATIVO;
            case "B+": return TipoSanguineo.B_POSITIVO;
            case "B-": return TipoSanguineo.B_NEGATIVO;
            case "AB+": return TipoSanguineo.AB_POSITIVO;
            case "AB-": return TipoSanguineo.AB_NEGATIVO;
            default: return TipoSanguineo.O_POSITIVO;
        }
    }

    private String converterEnumParaSigla(TipoSanguineo tipo) {
        if (tipo == null) return "O+";
        switch (tipo) {
            case O_POSITIVO: return "O+";
            case O_NEGATIVO: return "O-";
            case A_POSITIVO: return "A+";
            case A_NEGATIVO: return "A-";
            case B_POSITIVO: return "B+";
            case B_NEGATIVO: return "B-";
            case AB_POSITIVO: return "AB+";
            case AB_NEGATIVO: return "AB-";
            default: return "O+";
        }
    }

    private RecomendacaoRedistribuicaoResponse converterParaResponse(RecomendacaoRedistribuicao model) {
        return new RecomendacaoRedistribuicaoResponse(
                model.getId(),
                model.getOrigemId(),
                model.getOrigemNome(),
                model.getDestinoId(),
                model.getDestinoNome(),
                model.getTipoSanguineo(),
                model.getComponente(),
                model.getQuantidade(),
                model.getNivelUrgencia(),
                model.getStatus(),
                model.getJustificativaRecusa(),
                model.getMotivosExplicaveis()
        );
    }
}