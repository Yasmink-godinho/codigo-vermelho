package com.codigovermelho.models;

import com.codigovermelho.exceptions.RegraDeNegocioException;
import com.codigovermelho.models.enums.StatusTransferencia;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

// Transferencia de hemocomponentes de uma instituicao pra outra.
// A rota, a distancia e a previsao de chegada vem do resultado do Dijkstra (US05)
// e o historico de temperatura dela fica nas LeituraTelemetria (US07).
// Essa versao e minima, so com o que a US05 e a US07 precisam. A US09 pode completar depois.
@Entity
@Table(name = "transferencia")
public class Transferencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, updatable = false)
    private String codigo;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "origem_id", nullable = false)
    private Instituicao origem;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "destino_id", nullable = false)
    private Instituicao destino;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoSanguineo tipoSanguineo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoComponente componente;

    @Column(nullable = false)
    private Integer quantidade;

    // texto com o percurso, ex: "HEMOPE -> Hospital da Restauracao"
    @Column(nullable = false, length = 2000)
    private String rota;

    @Column(nullable = false)
    private Double distanciaKm;

    @Column(nullable = false)
    private LocalDateTime previsaoChegada;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusTransferencia status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    protected Transferencia() {
        // o JPA precisa desse construtor
    }

    public Transferencia(Instituicao origem, Instituicao destino, TipoSanguineo tipoSanguineo,
                         TipoComponente componente, Integer quantidade, String rota,
                         Double distanciaKm, LocalDateTime previsaoChegada) {
        if (origem == null || destino == null) {
            throw new IllegalArgumentException("Origem e destino sao obrigatorios");
        }
        if (origem.getId() != null && origem.getId().equals(destino.getId())) {
            throw new IllegalArgumentException("Origem e destino devem ser instituicoes diferentes");
        }
        if (tipoSanguineo == null) {
            throw new IllegalArgumentException("Tipo sanguineo e obrigatorio");
        }
        if (componente == null) {
            throw new IllegalArgumentException("Componente e obrigatorio");
        }
        if (quantidade == null || quantidade <= 0) {
            throw new IllegalArgumentException("Quantidade deve ser maior que zero");
        }
        if (rota == null || rota.isBlank()) {
            throw new IllegalArgumentException("Rota nao pode ser vazia");
        }
        if (distanciaKm == null || distanciaKm < 0) {
            throw new IllegalArgumentException("Distancia nao pode ser negativa");
        }
        if (previsaoChegada == null) {
            throw new IllegalArgumentException("Previsao de chegada e obrigatoria");
        }
        this.origem = origem;
        this.destino = destino;
        this.tipoSanguineo = tipoSanguineo;
        this.componente = componente;
        this.quantidade = quantidade;
        this.rota = rota;
        this.distanciaKm = distanciaKm;
        this.previsaoChegada = previsaoChegada;
        this.status = StatusTransferencia.EM_TRANSPORTE; // ja nasce saindo
    }

    @PrePersist
    private void aoPersistir() {
        this.dataCriacao = LocalDateTime.now();
        if (this.codigo == null) {
            this.codigo = "TR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }

    public void marcarComoEntregue() {
        if (status != StatusTransferencia.EM_TRANSPORTE) {
            throw new RegraDeNegocioException("So da pra entregar uma transferencia que esta em transporte");
        }
        this.status = StatusTransferencia.ENTREGUE;
    }

    public boolean isEmTransporte() {
        return status == StatusTransferencia.EM_TRANSPORTE;
    }

    public Long getId() { return id; }
    public String getCodigo() { return codigo; }
    public Instituicao getOrigem() { return origem; }
    public Instituicao getDestino() { return destino; }
    public TipoSanguineo getTipoSanguineo() { return tipoSanguineo; }
    public TipoComponente getComponente() { return componente; }
    public Integer getQuantidade() { return quantidade; }
    public String getRota() { return rota; }
    public Double getDistanciaKm() { return distanciaKm; }
    public LocalDateTime getPrevisaoChegada() { return previsaoChegada; }
    public StatusTransferencia getStatus() { return status; }
    public LocalDateTime getDataCriacao() { return dataCriacao; }
}
