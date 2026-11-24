package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.NovaTransferenciaRequest;
import com.codigovermelho.controllers.dto.RotaResultado;
import com.codigovermelho.exceptions.RegraDeNegocioException;
import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.Transferencia;
import com.codigovermelho.models.Requisicao;
import com.codigovermelho.observabilidade.MetricasNegocio;
import com.codigovermelho.repositories.InstituicaoRepository;
import com.codigovermelho.repositories.TransferenciaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

// Cria e consulta transferencias. Na criacao usa o RotaService (US05): se nao tem rota
// a transferencia nao e criada, e se tem, salva o percurso, a distancia e a previsao de chegada.
@Service
public class TransferenciaService {

    private final TransferenciaRepository transferenciaRepository;
    private final InstituicaoRepository instituicaoRepository;
    private final RotaService rotaService;
    private final AlocacaoCompatibilidadeService alocacaoCompatibilidadeService;
    private final MetricasNegocio metricasNegocio;

    public TransferenciaService(TransferenciaRepository transferenciaRepository,
                                InstituicaoRepository instituicaoRepository,
                                RotaService rotaService,
                                AlocacaoCompatibilidadeService alocacaoCompatibilidadeService,
                                MetricasNegocio metricasNegocio) {
        this.transferenciaRepository = transferenciaRepository;
        this.instituicaoRepository = instituicaoRepository;
        this.rotaService = rotaService;
        this.alocacaoCompatibilidadeService = alocacaoCompatibilidadeService;
        this.metricasNegocio = metricasNegocio;
    }

    // Observabilidade: a criacao inteira vira o span "criacao-transferencia", com o span
    // "calculo-rota" dentro dele (HTTP -> criacao-transferencia -> calculo-rota).
    @Transactional
    public Transferencia criar(NovaTransferenciaRequest request) {
        Transferencia criada = metricasNegocio.observarCriacaoTransferencia(() -> criarTransferencia(request));
        metricasNegocio.transferenciaCriada(criada);
        return criada;
    }

    private Transferencia criarTransferencia(NovaTransferenciaRequest request) {
        // 1) Valida requisicao, destino e compatibilidade (409 se incompativel) SEM alterar nada.
        Requisicao requisicao = alocacaoCompatibilidadeService.validarParaTransferencia(
                request.requisicaoId(), request.origemId(), request.destinoId(), request.tipoSanguineo(),
                request.componente(), request.quantidade());

        // 2) Confirma a rota (US05) antes de tocar no estoque: sem rota -> RegraDeNegocioException (409).
        RotaResultado rota = rotaService.calcularRota(request.origemId(), request.destinoId());
        if (!rota.rotaEncontrada()) throw new RegraDeNegocioException(rota.mensagem());

        Instituicao origem = instituicaoRepository.findById(request.origemId())
                .orElseThrow(() -> new NoSuchElementException("Instituicao nao encontrada: " + request.origemId()));
        Instituicao destino = instituicaoRepository.findById(request.destinoId())
                .orElseThrow(() -> new NoSuchElementException("Instituicao nao encontrada: " + request.destinoId()));

        String percurso = String.join(" -> ", rota.nomesInstituicoes());
        LocalDateTime chegada = LocalDateTime.now().plusMinutes(Math.round(rota.tempoEstimadoMinutos()));
        Transferencia transferencia = new Transferencia(origem, destino, requisicao, request.tipoSanguineo(),
                request.componente(), request.quantidade(), percurso, rota.distanciaTotalKm(), chegada);

        // 3) So agora reserva o estoque (FEFO) e atende a requisicao; tudo na mesma transacao da transferencia,
        //    entao qualquer falha daqui em diante reverte estoque, status da requisicao e a transferencia.
        alocacaoCompatibilidadeService.consumirEstoque(requisicao, request.origemId(), request.tipoSanguineo(),
                request.componente(), request.quantidade());
        return transferenciaRepository.save(transferencia);
    }

    @Transactional(readOnly = true)
    public List<Transferencia> listar() {
        return transferenciaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Transferencia buscarPorId(Long id) {
        return transferenciaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Transferencia nao encontrada: " + id));
    }

    @Transactional
    public Transferencia marcarComoEntregue(Long id) {
        Transferencia transferencia = buscarPorId(id);
        transferencia.marcarComoEntregue();
        return transferenciaRepository.save(transferencia);
    }
}
