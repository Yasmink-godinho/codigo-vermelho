package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.AlocacaoCompatibilidadeResponse;
import com.codigovermelho.controllers.dto.AlocacaoCompatibilidadeResponse.Alternativa;
import com.codigovermelho.exceptions.AlocacaoIncompativelException;
import com.codigovermelho.models.LoteHemocomponente;
import com.codigovermelho.models.Requisicao;
import com.codigovermelho.models.enums.StatusRequisicao;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.repositories.LoteHemocomponenteRepository;
import com.codigovermelho.repositories.RequisicaoRepository;
import com.codigovermelho.services.AlocacaoCompatibilidade.Candidato;
import com.codigovermelho.services.AlocacaoCompatibilidade.Veredito;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

/** US08 — valida alocacoes contra o estoque real e sugere lotes compativeis. */
@Service
public class AlocacaoCompatibilidadeService {

    private final RequisicaoRepository requisicaoRepository;
    private final LoteHemocomponenteRepository loteRepository;

    public AlocacaoCompatibilidadeService(RequisicaoRepository requisicaoRepository,
                                          LoteHemocomponenteRepository loteRepository) {
        this.requisicaoRepository = requisicaoRepository;
        this.loteRepository = loteRepository;
    }

    /** Lote candidato x requisicao (ambos cadastrados). */
    @Transactional(readOnly = true)
    public AlocacaoCompatibilidadeResponse avaliar(Long requisicaoId, Long loteId) {
        Requisicao requisicao = buscarRequisicao(requisicaoId);
        LoteHemocomponente lote = loteRepository.findById(loteId)
                .orElseThrow(() -> new NoSuchElementException("Lote nao encontrado: " + loteId));
        Veredito v = AlocacaoCompatibilidade.verificar(requisicao.getTipoSanguineo(), requisicao.getComponente(),
                lote.getTipoSanguineo(), lote.getComponente());
        if (v.compativel() && (lote.getQuantidade() == null || lote.getQuantidade() <= 0))
            v = new Veredito(false, "Lote sem saldo disponivel.");
        if (v.compativel() && lote.getDataValidade().isBefore(LocalDate.now()))
            v = new Veredito(false, "Lote vencido nao pode ser alocado.");
        List<Alternativa> alternativas = v.compativel() ? List.of()
                : alternativas(requisicao.getTipoSanguineo(), requisicao.getComponente(),
                        requisicao.getVolume(), lote.getId(), null);
        return new AlocacaoCompatibilidadeResponse(v.compativel(), !v.compativel(), v.motivo(),
                requisicao.getId(), lote.getId(),
                requisicao.getTipoSanguineo().getLabel(), requisicao.getComponente().getLabel(),
                lote.getTipoSanguineo().getLabel(), lote.getComponente().getLabel(), alternativas);
    }

    /** Verificacao so por tipos (contrato tipoRequisicao/tipoLote). componente e instituicaoId sao opcionais. */
    @Transactional(readOnly = true)
    public AlocacaoCompatibilidadeResponse avaliarPorTipos(TipoSanguineo tipoRequisicao, TipoSanguineo tipoLote,
                                                           TipoComponente componente, Long instituicaoId) {
        return avaliarPorTipos(tipoRequisicao, tipoLote, componente, instituicaoId, null);
    }

    @Transactional(readOnly = true)
    public AlocacaoCompatibilidadeResponse avaliarPorTipos(TipoSanguineo tipoRequisicao, TipoSanguineo tipoLote,
                                                           TipoComponente componente, Long instituicaoId, Integer volume) {
        if (tipoRequisicao == null || tipoLote == null || componente == null) {
            throw new IllegalArgumentException("tipoRequisicao, tipoLote e componente sao obrigatorios.");
        }
        Veredito v = AlocacaoCompatibilidade.verificar(tipoRequisicao, componente, tipoLote, componente);
        List<Alternativa> alternativas = v.compativel() ? List.of()
                : alternativas(tipoRequisicao, componente, volume, null, instituicaoId);
        String rotuloComponente = componente == null ? null : componente.getLabel();
        return new AlocacaoCompatibilidadeResponse(v.compativel(), !v.compativel(), v.motivo(),
                null, null, tipoRequisicao.getLabel(), rotuloComponente,
                tipoLote.getLabel(), rotuloComponente, alternativas);
    }

    /**
     * Bloqueio de alocacao (criacao de transferencia e qualquer aprovacao). Falha FECHADA: sem requisicao,
     * sem tipo ou sem componente nao ha como provar compatibilidade, entao a alocacao e recusada.
     * requisicaoId nulo / dados ausentes -> IllegalArgumentException (400); incompativel -> AlocacaoIncompativelException (409).
     */
    @Transactional(readOnly = true)
    public void exigirCompativel(Long requisicaoId, TipoSanguineo tipoEnviado, TipoComponente componenteEnviado) {
        if (requisicaoId == null) {
            throw new IllegalArgumentException(
                    "requisicaoId e obrigatorio: a compatibilidade ABO/Rh so pode ser validada contra uma requisicao");
        }
        if (tipoEnviado == null || componenteEnviado == null) {
            throw new IllegalArgumentException("Tipo sanguineo e componente do que sera alocado sao obrigatorios");
        }
        Requisicao requisicao = buscarRequisicao(requisicaoId);
        validarRequisicaoAberta(requisicao);
        Veredito v = AlocacaoCompatibilidade.verificar(requisicao.getTipoSanguineo(), requisicao.getComponente(),
                tipoEnviado, componenteEnviado);
        if (!v.compativel()) {
            throw new AlocacaoIncompativelException("Alocacao bloqueada. " + v.motivo(),
                    alternativas(requisicao.getTipoSanguineo(), requisicao.getComponente(),
                            requisicao.getVolume(), null, null));
        }
    }

    /** Valida estoque disponivel; mantido para consultas que nao efetivam movimentacao. */
    @Transactional(readOnly = true)
    public void exigirCompativel(Long requisicaoId, Long instituicaoOrigemId,
                                 TipoSanguineo tipoEnviado, TipoComponente componenteEnviado, Integer quantidade) {
        if (instituicaoOrigemId == null || quantidade == null || quantidade <= 0) {
            throw new IllegalArgumentException("Origem e quantidade positiva sao obrigatorias para alocacao.");
        }
        Requisicao requisicao = buscarRequisicao(requisicaoId);
        validarRequisicaoAberta(requisicao);
        Veredito v = AlocacaoCompatibilidade.verificar(requisicao.getTipoSanguineo(), requisicao.getComponente(), tipoEnviado, componenteEnviado);
        if (!v.compativel()) throw new AlocacaoIncompativelException("Alocacao bloqueada. " + v.motivo(),
                alternativas(requisicao.getTipoSanguineo(), requisicao.getComponente(), requisicao.getVolume(), null, instituicaoOrigemId));
        if (quantidade > requisicao.getVolume()) throw new IllegalArgumentException("Quantidade excede o volume solicitado na requisicao.");
        long saldo = loteRepository.findByInstituicaoIdAndTipoSanguineo(instituicaoOrigemId, tipoEnviado).stream()
                .filter(l -> l.getComponente() == componenteEnviado && !l.getDataValidade().isBefore(LocalDate.now()))
                .filter(l -> CompatibilidadeSanguinea.compativel(l.getTipoSanguineo(), requisicao.getTipoSanguineo()))
                .mapToLong(LoteHemocomponente::getQuantidade).sum();
        if (saldo < quantidade) throw new IllegalArgumentException("Estoque compativel insuficiente na instituicao de origem.");
    }

    /**
     * Reserva FEFO e atualiza a requisicao dentro da mesma transacao que cria a transferencia.
     * Mantido por compatibilidade: equivale a {@link #validarParaTransferencia} seguido de {@link #consumirEstoque}.
     */
    @Transactional
    public Requisicao validarEConsumir(Long requisicaoId, Long origemId, Long destinoId,
                                       TipoSanguineo tipoEnviado, TipoComponente componenteEnviado, Integer quantidade) {
        Requisicao req = validarParaTransferencia(requisicaoId, origemId, destinoId, tipoEnviado,
                componenteEnviado, quantidade);
        return consumirEstoque(req, origemId, tipoEnviado, componenteEnviado, quantidade);
    }

    /**
     * Etapa 1 da criacao de transferencia, SEM efeitos colaterais (nao altera estoque nem requisicao).
     * Ordem: dados obrigatorios (400) -> requisicao existe (404) -> requisicao em aberto (400) -> destino e a
     * instituicao solicitante (400) -> compatibilidade ABO/Rh e de componente (AlocacaoIncompativelException, 409)
     * -> quantidade igual ao volume da requisicao (400). A requisicao fica bloqueada ate o fim da transacao.
     */
    @Transactional
    public Requisicao validarParaTransferencia(Long requisicaoId, Long origemId, Long destinoId,
                                               TipoSanguineo tipoEnviado, TipoComponente componenteEnviado,
                                               Integer quantidade) {
        if (requisicaoId == null || origemId == null || destinoId == null || tipoEnviado == null || componenteEnviado == null
                || quantidade == null || quantidade <= 0) {
            throw new IllegalArgumentException("Requisicao, origem, destino, tipo, componente e quantidade positiva sao obrigatorios.");
        }
        Requisicao req = requisicaoRepository.buscarPorIdComBloqueio(requisicaoId)
                .orElseThrow(() -> new NoSuchElementException("Requisicao nao encontrada: " + requisicaoId));
        validarRequisicaoAberta(req);
        if (!req.getInstituicaoSolicitante().getId().equals(destinoId)) {
            throw new IllegalArgumentException("A instituicao de destino deve ser a instituicao solicitante da requisicao.");
        }
        Veredito v = AlocacaoCompatibilidade.verificar(req.getTipoSanguineo(), req.getComponente(), tipoEnviado, componenteEnviado);
        if (!v.compativel()) throw new AlocacaoIncompativelException("Alocacao bloqueada. " + v.motivo(),
                alternativas(req.getTipoSanguineo(), req.getComponente(), req.getVolume(), null, origemId));
        if (!quantidade.equals(req.getVolume())) throw new IllegalArgumentException("A quantidade transferida deve corresponder ao volume integral da requisicao.");
        return req;
    }

    /**
     * Etapa 2: reserva FEFO e marca a requisicao como ATENDIDA. Deve ser chamada somente depois de a rota ter sido
     * confirmada. Verifica o saldo compativel ANTES de mexer em qualquer lote, entao uma falha de estoque nao deixa
     * consumo parcial; qualquer erro posterior tambem reverte tudo pela transacao do chamador.
     */
    @Transactional
    public Requisicao consumirEstoque(Requisicao req, Long origemId, TipoSanguineo tipoEnviado,
                                      TipoComponente componenteEnviado, Integer quantidade) {
        if (req == null || origemId == null || tipoEnviado == null || componenteEnviado == null
                || quantidade == null || quantidade <= 0) {
            throw new IllegalArgumentException("Requisicao, origem, tipo, componente e quantidade positiva sao obrigatorios.");
        }
        List<LoteHemocomponente> elegiveis = loteRepository.bloquearEstoqueFefo(origemId, tipoEnviado).stream()
                .filter(l -> l.getComponente() == componenteEnviado
                        && !l.getDataValidade().isBefore(LocalDate.now())
                        && CompatibilidadeSanguinea.compativel(l.getTipoSanguineo(), req.getTipoSanguineo()))
                .toList();
        long disponivel = elegiveis.stream().mapToLong(LoteHemocomponente::getQuantidade).sum();
        if (disponivel < quantidade) {
            throw new IllegalArgumentException("Estoque compativel insuficiente; nenhuma transferencia foi efetivada.");
        }

        int restante = quantidade;
        for (LoteHemocomponente lote : elegiveis) {
            if (restante == 0) break;
            int retirar = Math.min(restante, lote.getQuantidade());
            if (retirar == lote.getQuantidade()) loteRepository.delete(lote);
            else { lote.setQuantidade(lote.getQuantidade() - retirar); loteRepository.save(lote); }
            restante -= retirar;
        }
        req.setStatus(StatusRequisicao.ATENDIDA);
        return requisicaoRepository.save(req);
    }

    private void validarRequisicaoAberta(Requisicao requisicao) {
        if (requisicao.getStatus() != StatusRequisicao.PENDENTE
                && requisicao.getStatus() != StatusRequisicao.EM_ANALISE
                && requisicao.getStatus() != StatusRequisicao.APROVADA) {
            throw new IllegalArgumentException("Requisicao nao pode ser atendida no status " + requisicao.getStatus() + ".");
        }
    }

    /** Variante para fluxos de aprovacao que ja tem o lote: use antes de confirmar/aprovar a alocacao. */
    @Transactional(readOnly = true)
    public void exigirCompativelComLote(Long requisicaoId, Long loteId) {
        if (loteId == null) {
            throw new IllegalArgumentException("loteId e obrigatorio para validar a alocacao");
        }
        LoteHemocomponente lote = loteRepository.findById(loteId)
                .orElseThrow(() -> new NoSuchElementException("Lote nao encontrado: " + loteId));
        // Ordem das validacoes: 1) compatibilidade ABO/Rh e de componente (AlocacaoIncompativelException -> 409);
        // 2) estado do lote, saldo e validade (IllegalArgumentException -> 400).
        exigirCompativel(requisicaoId, lote.getTipoSanguineo(), lote.getComponente());
        if (lote.getQuantidade() == null || lote.getQuantidade() <= 0
                || lote.getDataValidade().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Lote vencido ou sem saldo nao pode ser alocado.");
        }
    }

    private Requisicao buscarRequisicao(Long id) {
        return requisicaoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Requisicao nao encontrada: " + id));
    }

    private List<Alternativa> alternativas(TipoSanguineo tipoRequisicao, TipoComponente componente,
                                           Integer volume, Long loteExcluidoId, Long instituicaoId) {
        List<Candidato> estoque = loteRepository.findAll().stream()
                .filter(l -> instituicaoId == null || instituicaoId.equals(l.getInstituicao().getId()))
                .map(l -> new Candidato(l.getId(), l.getCodigoLote(), l.getTipoSanguineo(), l.getComponente(),
                        l.getDataValidade(), l.getQuantidade(), l.getInstituicao().getId(),
                        l.getInstituicao().getNome()))
                .toList();
        return AlocacaoCompatibilidade.alternativas(tipoRequisicao, componente, estoque, LocalDate.now(), loteExcluidoId)
                .stream()
                .map(c -> new Alternativa(c.loteId(), c.codigoLote(), c.tipo().getLabel(), c.componente().getLabel(),
                        c.quantidade(), c.validade(), c.instituicaoId(), c.instituicaoNome(),
                        volume == null ? null : c.quantidade() >= volume))
                .toList();
    }
}
