package com.codigovermelho.models;

import com.codigovermelho.models.enums.NivelAlerta;
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

// Alerta gerado quando uma leitura de temperatura sai da faixa segura (US07).
// Cada leitura fora da faixa gera um alerta, sempre CRITICO.
@Entity
@Table(name = "alerta_termico")
public class AlertaTermico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "transferencia_id", nullable = false)
    private Transferencia transferencia;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "leitura_id", nullable = false)
    private LeituraTelemetria leitura;

    @Column(nullable = false)
    private Double temperatura;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NivelAlerta nivel;

    @Column(nullable = false, length = 300)
    private String mensagem;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataHora;

    protected AlertaTermico() {
        // o JPA precisa desse construtor
    }

    public AlertaTermico(LeituraTelemetria leitura, String mensagem) {
        if (leitura == null) {
            throw new IllegalArgumentException("Alerta precisa de uma leitura");
        }
        if (mensagem == null || mensagem.isBlank()) {
            throw new IllegalArgumentException("Mensagem do alerta e obrigatoria");
        }
        this.leitura = leitura;
        this.transferencia = leitura.getTransferencia();
        this.temperatura = leitura.getTemperatura();
        this.mensagem = mensagem;
        this.nivel = NivelAlerta.CRITICO;
    }

    @PrePersist
    private void aoPersistir() {
        this.dataHora = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Transferencia getTransferencia() { return transferencia; }
    public LeituraTelemetria getLeitura() { return leitura; }
    public Double getTemperatura() { return temperatura; }
    public NivelAlerta getNivel() { return nivel; }
    public String getMensagem() { return mensagem; }
    public LocalDateTime getDataHora() { return dataHora; }
}
