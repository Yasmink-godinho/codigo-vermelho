package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.RecomendacaoRedistribuicaoResponse;
import com.codigovermelho.controllers.dto.NovaTransferenciaRequest;
import com.codigovermelho.exceptions.RegraDeNegocioException;
import com.codigovermelho.models.Transferencia;
import com.codigovermelho.models.Requisicao;
import com.codigovermelho.models.enums.StatusRequisicao;
import com.codigovermelho.models.LoteHemocomponente;
import com.codigovermelho.models.RecomendacaoRedistribuicao;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.repositories.LoteHemocomponenteRepository;
import com.codigovermelho.repositories.RecomendacaoRedistribuicaoRepository;
import com.codigovermelho.repositories.RequisicaoRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RedistribuicaoService {

    public record AprovacaoRedistribuicao(RecomendacaoRedistribuicaoResponse recomendacao, Transferencia transferencia) {}

    private final RecomendacaoRedistribuicaoRepository repository;
    private final LoteHemocomponenteRepository loteRepository;
    private final GeminiAIService geminiAIService;
    private final RequisicaoRepository requisicaoRepository;
    private final TransferenciaService transferenciaService;


    public RedistribuicaoService(RecomendacaoRedistribuicaoRepository repository,
                                 LoteHemocomponenteRepository loteRepository,
                                 GeminiAIService geminiAIService,
                                 RequisicaoRepository requisicaoRepository,
                                 TransferenciaService transferenciaService) {
        this.repository = repository;
        this.loteRepository = loteRepository;
        this.geminiAIService = geminiAIService;
        this.requisicaoRepository = requisicaoRepository;
        this.transferenciaService = transferenciaService;
    }

    @PostConstruct
    public void inicializarRecomendacoesSeVazio() {
        if (repository.count() == 0) {
            try { gerarAutomaticaBaseadaEmEstoque(); }
            catch (RegraDeNegocioException semDemandaElegivel) {
                // Sem requisicao e estoque compativeis, nao cria recomendacao ficticia.
            }
        }
    }

    @Transactional
    public RecomendacaoRedistribuicaoResponse gerarAutomaticaBaseadaEmEstoque() {
        List<Requisicao> demandas = requisicaoRepository.findByStatus(StatusRequisicao.PENDENTE);
        List<LoteHemocomponente> lotes = loteRepository.findAll().stream()
                .filter(l -> l.getQuantidade() != null && l.getQuantidade() > 0)
                .filter(l -> !l.getDataValidade().isBefore(java.time.LocalDate.now()))
                .toList();
        for (Requisicao req : demandas) {
            for (LoteHemocomponente lote : lotes) {
                if (lote.getInstituicao().getId().equals(req.getInstituicaoSolicitante().getId())) continue;
                if (lote.getComponente() != req.getComponente()
                        || !CompatibilidadeSanguinea.compativel(lote.getTipoSanguineo(), req.getTipoSanguineo())
                        || lote.getQuantidade() < req.getVolume()) continue;
                return criarERegistrarRecomendacao(req, lote.getInstituicao().getId(), lote.getInstituicao().getNome(),
                        req.getInstituicaoSolicitante().getId(), req.getInstituicaoSolicitante().getNome(),
                        converterEnumParaSigla(lote.getTipoSanguineo()), converterEnumParaComponente(lote.getComponente()),
                        req.getVolume());
            }
        }
        throw new RegraDeNegocioException("Nao existe requisicao pendente com estoque compativel suficiente para gerar recomendacao.");
    }

    @Transactional
    public Optional<AprovacaoRedistribuicao> aprovarComTransferencia(Long id) {
        return aprovarComTransferencia(id, null);
    }

    @Transactional
    public Optional<AprovacaoRedistribuicao> aprovarComTransferencia(Long id, Long loteAlternativoId) {
        Optional<RecomendacaoRedistribuicao> encontrada = repository.buscarPorIdComBloqueio(id);
        if (encontrada.isEmpty()) return Optional.empty();
        RecomendacaoRedistribuicao rec = encontrada.get();
        if (!"PENDENTE".equalsIgnoreCase(rec.getStatus())) {
            throw new IllegalArgumentException("Somente recomendacoes PENDENTES podem ser aprovadas.");
        }
        if (rec.getOrigemId() == null || rec.getDestinoId() == null || rec.getQuantidade() <= 0) {
            throw new IllegalArgumentException("Recomendacao sem origem, destino ou quantidade valida.");
        }
        TipoSanguineo tipoDisponivel = converterSiglaParaEnumEstrito(rec.getTipoSanguineo());
        TipoComponente componente = converterComponenteEstrito(rec.getComponente());
        if (loteAlternativoId != null) {
            LoteHemocomponente alternativa = loteRepository.findById(loteAlternativoId)
                    .orElseThrow(() -> new NoSuchElementException("Lote alternativo nao encontrado: " + loteAlternativoId));
            if (alternativa.getQuantidade() == null || alternativa.getQuantidade() <= 0
                    || alternativa.getDataValidade().isBefore(java.time.LocalDate.now())) {
                throw new IllegalArgumentException("O lote alternativo esta vencido ou sem saldo.");
            }
            if (alternativa.getComponente() != componente || alternativa.getQuantidade() < rec.getQuantidade()) {
                throw new IllegalArgumentException("O lote alternativo nao possui componente ou quantidade suficiente.");
            }
            rec.setOrigemId(alternativa.getInstituicao().getId());
            rec.setOrigemNome(alternativa.getInstituicao().getNome());
            rec.setTipoSanguineo(alternativa.getTipoSanguineo().getLabel());
            tipoDisponivel = alternativa.getTipoSanguineo();
        }
        if (rec.getDestinoId().equals(rec.getOrigemId())) throw new IllegalArgumentException("Origem e destino devem ser diferentes.");

        // Requisicao real, aberta e correspondente ao destino/componente/volume. ABO e validado pelo fluxo unico de transferencia.
        Requisicao requisicao = rec.getRequisicao();
        final TipoSanguineo tipoDisponivelParaBusca = tipoDisponivel;

        if (requisicao == null) {
            // Compatibilidade com recomendacoes historicas que ainda nao possuem requisicao_id.
            List<Requisicao> candidatas = requisicaoRepository.findAll().stream()
                    .filter(r -> r.getInstituicaoSolicitante().getId().equals(rec.getDestinoId()))
                    .filter(r -> r.getComponente() == componente && r.getVolume().equals(rec.getQuantidade()))
                    .filter(r -> r.getStatus() == StatusRequisicao.PENDENTE || r.getStatus() == StatusRequisicao.EM_ANALISE
                            || r.getStatus() == StatusRequisicao.APROVADA)
                    .filter(r -> CompatibilidadeSanguinea.compativel(tipoDisponivelParaBusca, r.getTipoSanguineo()))
                    .toList();
            if (candidatas.size() != 1) {
                throw new IllegalArgumentException(candidatas.isEmpty()
                        ? "Nao existe requisicao aberta no destino com componente, volume e compatibilidade ABO/Rh correspondentes."
                        : "A recomendacao historica corresponde a mais de uma requisicao; associe-a explicitamente antes da aprovacao.");
            }
            requisicao = candidatas.get(0);
        } else if (!requisicao.getInstituicaoSolicitante().getId().equals(rec.getDestinoId())
                || requisicao.getComponente() != componente || !requisicao.getVolume().equals(rec.getQuantidade())
                || !CompatibilidadeSanguinea.compativel(tipoDisponivel, requisicao.getTipoSanguineo())) {
            throw new IllegalArgumentException("A requisicao vinculada nao corresponde ao destino, componente, volume ou compatibilidade da recomendacao.");
        }

        NovaTransferenciaRequest pedido = new NovaTransferenciaRequest(rec.getOrigemId(), rec.getDestinoId(),
                tipoDisponivel, componente, rec.getQuantidade(), requisicao.getId());
        // Este e o unico caminho de movimentacao: rota, reserva FEFO, vinculo da requisicao e persistencia atomica.
        Transferencia transferencia = transferenciaService.criar(pedido);
        rec.setStatus("APROVADA");
        RecomendacaoRedistribuicao salva = repository.save(rec);
        return Optional.of(new AprovacaoRedistribuicao(converterParaResponse(salva), transferencia));
    }

    @Transactional
    public Optional<RecomendacaoRedistribuicaoResponse> aprovar(Long id) {
        return aprovarComTransferencia(id).map(AprovacaoRedistribuicao::recomendacao);
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
            Requisicao requisicao, Long origemId, String origemNome, Long destinoId, String destinoNome,
            String tipoSanguineo, String componente, int quantidade) {

        List<String> motivos = geminiAIService.gerarExplicabilidadeRedistribuicao(
                origemNome, destinoNome, tipoSanguineo, quantidade, 2.1
        );

        RecomendacaoRedistribuicao rec = new RecomendacaoRedistribuicao(
                requisicao, origemId, origemNome,
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

    private TipoSanguineo converterSiglaParaEnumEstrito(String sigla) {
        if (sigla == null || sigla.isBlank()) throw new IllegalArgumentException("Tipo sanguineo da recomendacao e obrigatorio.");
        return TipoSanguineo.fromString(sigla);
    }

    private TipoComponente converterComponenteEstrito(String nome) {
        if (nome == null || nome.isBlank()) throw new IllegalArgumentException("Componente da recomendacao e obrigatorio.");
        for (TipoComponente c : TipoComponente.values()) {
            if (c.getLabel().equalsIgnoreCase(nome.trim()) || c.name().equalsIgnoreCase(nome.trim())) return c;
        }
        throw new IllegalArgumentException("Componente invalido na recomendacao: " + nome);
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
        Requisicao requisicaoVinculada = model.getRequisicao();
        if (requisicaoVinculada == null && model.getDestinoId() != null && model.getQuantidade() > 0) {
            try {
                TipoSanguineo tipoLote = converterSiglaParaEnumEstrito(model.getTipoSanguineo());
                TipoComponente componente = converterComponenteEstrito(model.getComponente());
                List<Requisicao> candidatas = requisicaoRepository.findAll().stream()
                        .filter(r -> r.getInstituicaoSolicitante().getId().equals(model.getDestinoId()))
                        .filter(r -> r.getComponente() == componente && r.getVolume().equals(model.getQuantidade()))
                        .filter(r -> r.getStatus() == StatusRequisicao.PENDENTE || r.getStatus() == StatusRequisicao.EM_ANALISE
                                || r.getStatus() == StatusRequisicao.APROVADA)
                        .filter(r -> CompatibilidadeSanguinea.compativel(tipoLote, r.getTipoSanguineo()))
                        .toList();
                if (candidatas.size() == 1) requisicaoVinculada = candidatas.get(0);
            } catch (IllegalArgumentException registroHistoricoInvalido) {
                // Registro legado malformado permanece visivel, mas nao recebe um vinculo presumido.
            }
        }
        return new RecomendacaoRedistribuicaoResponse(
                model.getId(),
                requisicaoVinculada == null ? null : requisicaoVinculada.getId(),
                requisicaoVinculada == null ? null : requisicaoVinculada.getTipoSanguineo().getLabel(),
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