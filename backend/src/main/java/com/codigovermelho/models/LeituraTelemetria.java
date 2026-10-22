package com.codigovermelho.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

// Uma leitura de temperatura da carga durante o transporte (US07).
// Todas as leituras de uma transferencia formam o historico dela.
@Entity
@Table(name = "leitura_telemetria")
public class LeituraTelemetria {

    // faixa segura da historia (2 a 6 graus, vale pra maioria dos componentes)
    public static final double TEMPERATURA_MINIMA = 2.0;
    public static final double TEMPERATURA_MAXIMA = 6.0;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "transferencia_id", nullable = false)
    private Transferencia transferencia;

    @Column(nullable = false)
    private Double temperatura;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataHora;

    protected LeituraTelemetria() {
        // o JPA precisa desse construtor
    }

    public LeituraTelemetria(Transferencia transferencia, Double temperatura) {
        if (transferencia == null) {
            throw new IllegalArgumentException("Leitura precisa estar ligada a uma transferencia");
        }
        // barra NaN, infinito e valor de sensor quebrado
        if (temperatura == null || temperatura.isNaN() || temperatura.isInfinite()
                || temperatura < -100 || temperatura > 100) {
            throw new IllegalArgumentException("Temperatura invalida (precisa ficar entre -100 e 100 graus)");
        }
        this.transferencia = transferencia;
        this.temperatura = temperatura;
    }

    @PrePersist
    private void aoPersistir() {
        this.dataHora = LocalDateTime.now();
    }

    // fora da faixa = menor que 2 ou maior que 6 (2 e 6 ainda sao seguros)
    public boolean isForaDaFaixa() {
        return temperatura < TEMPERATURA_MINIMA || temperatura > TEMPERATURA_MAXIMA;
    }

    public Long getId() { return id; }
    public Transferencia getTransferencia() { return transferencia; }
    public Double getTemperatura() { return temperatura; }
    public LocalDateTime getDataHora() { return dataHora; }
}
