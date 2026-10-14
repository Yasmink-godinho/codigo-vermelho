package com.codigovermelho.services;

import com.codigovermelho.exceptions.RegraDeNegocioException;
import com.codigovermelho.models.AlertaTermico;
import com.codigovermelho.models.LeituraTelemetria;
import com.codigovermelho.models.Transferencia;
import com.codigovermelho.repositories.AlertaTermicoRepository;
import com.codigovermelho.repositories.LeituraTelemetriaRepository;
import com.codigovermelho.repositories.TransferenciaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;

// US07: recebe as leituras de temperatura da carga em transito, guarda no historico
// da transferencia e gera alerta critico quando a leitura sai da faixa de 2 a 6 graus.
@Service
public class TelemetriaService {

    // o que o registrarLeitura devolve: a leitura salva e o alerta (null se estava na faixa)
    public record ResultadoLeitura(LeituraTelemetria leitura, AlertaTermico alerta) {
    }

    private final TransferenciaRepository transferenciaRepository;
    private final LeituraTelemetriaRepository leituraRepository;
    private final AlertaTermicoRepository alertaRepository;

    public TelemetriaService(TransferenciaRepository transferenciaRepository,
                             LeituraTelemetriaRepository leituraRepository,
                             AlertaTermicoRepository alertaRepository) {
        this.transferenciaRepository = transferenciaRepository;
        this.leituraRepository = leituraRepository;
        this.alertaRepository = alertaRepository;
    }

    @Transactional
    public ResultadoLeitura registrarLeitura(Long transferenciaId, Double temperatura) {
        Transferencia transferencia = buscarTransferencia(transferenciaId);

        // so aceita leitura de carga que esta em transito
        if (!transferencia.isEmTransporte()) {
            throw new RegraDeNegocioException("A transferencia " + transferencia.getCodigo()
                    + " nao esta em transporte, nao da pra registrar temperatura");
        }

        LeituraTelemetria leitura = leituraRepository.save(new LeituraTelemetria(transferencia, temperatura));

        AlertaTermico alerta = null;
        if (leitura.isForaDaFaixa()) {
            alerta = alertaRepository.save(new AlertaTermico(leitura, montarMensagem(transferencia, temperatura)));
        }
        return new ResultadoLeitura(leitura, alerta);
    }

    @Transactional(readOnly = true)
    public List<LeituraTelemetria> listarLeituras(Long transferenciaId) {
        buscarTransferencia(transferenciaId); // garante o 404 se a transferencia nao existe
        return leituraRepository.findByTransferenciaIdOrderByDataHoraAscIdAsc(transferenciaId);
    }

    @Transactional(readOnly = true)
    public List<AlertaTermico> listarAlertas(Long transferenciaId) {
        buscarTransferencia(transferenciaId);
        return alertaRepository.findByTransferenciaIdOrderByDataHoraDescIdDesc(transferenciaId);
    }

    @Transactional(readOnly = true)
    public List<AlertaTermico> listarTodosAlertas() {
        return alertaRepository.findAllByOrderByDataHoraDescIdDesc();
    }

    private Transferencia buscarTransferencia(Long id) {
        return transferenciaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Transferencia nao encontrada: " + id));
    }

    private String montarMensagem(Transferencia transferencia, double temperatura) {
        String lado = temperatura > LeituraTelemetria.TEMPERATURA_MAXIMA ? "acima" : "abaixo";
        // Locale.US pra sair com ponto (7.4) e nao virgula, independente da maquina
        String valor = String.format(Locale.US, "%.1f", temperatura);
        return "Temperatura de " + valor + " °C " + lado + " da faixa segura (2 a 6 °C) na transferencia "
                + transferencia.getCodigo();
    }
}
