package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.NovaTransferenciaRequest;
import com.codigovermelho.controllers.dto.RotaResultado;
import com.codigovermelho.exceptions.RegraDeNegocioException;
import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.Transferencia;
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

    public TransferenciaService(TransferenciaRepository transferenciaRepository,
                                InstituicaoRepository instituicaoRepository,
                                RotaService rotaService) {
        this.transferenciaRepository = transferenciaRepository;
        this.instituicaoRepository = instituicaoRepository;
        this.rotaService = rotaService;
    }

    @Transactional
    public Transferencia criar(NovaTransferenciaRequest request) {
        RotaResultado rota = rotaService.calcularRota(request.origemId(), request.destinoId());
        if (!rota.rotaEncontrada()) {
            throw new RegraDeNegocioException(rota.mensagem());
        }

        Instituicao origem = instituicaoRepository.findById(request.origemId())
                .orElseThrow(() -> new NoSuchElementException("Instituicao nao encontrada: " + request.origemId()));
        Instituicao destino = instituicaoRepository.findById(request.destinoId())
                .orElseThrow(() -> new NoSuchElementException("Instituicao nao encontrada: " + request.destinoId()));

        String percurso = String.join(" -> ", rota.nomesInstituicoes());
        LocalDateTime chegada = LocalDateTime.now().plusMinutes(Math.round(rota.tempoEstimadoMinutos()));

        Transferencia transferencia = new Transferencia(origem, destino, request.tipoSanguineo(),
                request.componente(), request.quantidade(), percurso, rota.distanciaTotalKm(), chegada);
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
