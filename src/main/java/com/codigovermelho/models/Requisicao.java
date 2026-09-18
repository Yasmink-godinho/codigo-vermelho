package com.codigovermelho.models;

import com.codigovermelho.models.enums.NivelUrgencia;
import com.codigovermelho.models.enums.StatusRequisicao;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Requisicao hospitalar de hemocomponente (US04): emitida por uma
 * instituicao solicitante, com tipo sanguineo, componente, volume e
 * nivel de urgencia. Nasce sempre com status PENDENTE.
 */
@Entity
@Table(name = "requisicao")

public class Requisicao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, updatable = false)
    private String codigoRequisicao;

    // FetchType.EAGER (mesma decisao ja usada em LoteHemocomponente.instituicao):
    // o projeto roda com spring.jpa.open-in-view=false, entao um relacionamento
    // LAZY aqui geraria LazyInitializationException ao serializar a resposta
    // fora da transacao do Service. EAGER evita esse problema sem precisar
    // mudar a arquitetura Service->Controller->DTO ja usada no restante do projeto.
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "instituicao_id", nullable = false)
    private Instituicao instituicaoSolicitante;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoSanguineo tipoSanguineo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoComponente componente;

    @Column(nullable = false)
    private Integer volume;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NivelUrgencia nivelUrgencia;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusRequisicao status;

    @Column(length = 500)
    private String observacoes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    protected Requisicao() {
        // construtor exigido pelo JPA
    }

    public Requisicao(Instituicao instituicaoSolicitante, TipoSanguineo tipoSanguineo, TipoComponente componente,
                      Integer volume, NivelUrgencia nivelUrgencia, String observacoes) {
        setInstituicaoSolicitante(instituicaoSolicitante);
        setTipoSanguineo(tipoSanguineo);
        setComponente(componente);
        setVolume(volume);
        setNivelUrgencia(nivelUrgencia);
        this.observacoes = observacoes;
        this.status = StatusRequisicao.PENDENTE;
    }

    @PrePersist
    private void aoPersistir() {
        this.dataCriacao = LocalDateTime.now();
        if (this.codigoRequisicao == null) {
            this.codigoRequisicao = "REQ-" + System.currentTimeMillis();
        }
    }

    public Long getId() {
        return id;
    }

    public String getCodigoRequisicao() {
        return codigoRequisicao;
    }

    public Instituicao getInstituicaoSolicitante() {
        return instituicaoSolicitante;
    }

    public void setInstituicaoSolicitante(Instituicao instituicaoSolicitante) {
        if (instituicaoSolicitante == null) {
            throw new IllegalArgumentException("Instituicao solicitante e obrigatoria");
        }
        this.instituicaoSolicitante = instituicaoSolicitante;
    }

    public TipoSanguineo getTipoSanguineo() {
        return tipoSanguineo;
    }

    public void setTipoSanguineo(TipoSanguineo tipoSanguineo) {
        if (tipoSanguineo == null) {
            throw new IllegalArgumentException("Tipo sanguineo e obrigatorio");
        }
        this.tipoSanguineo = tipoSanguineo;
    }

    public TipoComponente getComponente() {
        return componente;
    }

    public void setComponente(TipoComponente componente) {
        if (componente == null) {
            throw new IllegalArgumentException("Componente e obrigatorio");
        }
        this.componente = componente;
    }

    public Integer getVolume() {
        return volume;
    }

    public void setVolume(Integer volume) {
        if (volume == null || volume <= 0) {
            throw new IllegalArgumentException("Volume deve ser maior que zero");
        }
        this.volume = volume;
    }

    public NivelUrgencia getNivelUrgencia() {
        return nivelUrgencia;
    }

    public void setNivelUrgencia(NivelUrgencia nivelUrgencia) {
        if (nivelUrgencia == null) {
            throw new IllegalArgumentException("Nivel de urgencia e obrigatorio");
        }
        this.nivelUrgencia = nivelUrgencia;
    }

    public StatusRequisicao getStatus() {
        return status;
    }

    public void setStatus(StatusRequisicao status) {
        if (status == null) {
            throw new IllegalArgumentException("Status e obrigatorio");
        }
        this.status = status;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

}
