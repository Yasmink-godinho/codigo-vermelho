package com.codigovermelho.models;

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

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Lote de hemocomponente (US02): unidade de estoque vinculada a uma
 * instituicao, com tipo sanguineo, componente, datas de coleta/validade
 * e quantidade. E a unidade basica que alimenta o FEFO (US03) e o
 * matching ABO/Rh (US08).
 */
@Entity
@Table(name = "lote_hemocomponente")
public class LoteHemocomponente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, updatable = false)
    private String codigoLote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoSanguineo tipoSanguineo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoComponente componente;

    @Column(nullable = false)
    private LocalDate dataColeta;

    @Column(nullable = false)
    private LocalDate dataValidade;

    @Column(nullable = false)
    private Integer quantidade;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "instituicao_id", nullable = false)
    private Instituicao instituicao;

    protected LoteHemocomponente() {
        // construtor exigido pelo JPA
    }

    /**
     * Cria um lote calculando a validade automaticamente a partir do
     * prazo padrao do componente (US02). Para informar uma validade
     * customizada, use o construtor com dataValidade explicita.
     */
    public LoteHemocomponente(TipoSanguineo tipoSanguineo, TipoComponente componente,
                               LocalDate dataColeta, Integer quantidade, Instituicao instituicao) {
        this(tipoSanguineo, componente, dataColeta,
                dataColeta == null ? null : dataColeta.plusDays(componente == null ? 0 : componente.getDiasValidadePadrao()),
                quantidade, instituicao);
    }

    /**
     * Cria um lote com data de validade explicita (editavel manualmente,
     * conforme US02 permite).
     */
    public LoteHemocomponente(TipoSanguineo tipoSanguineo, TipoComponente componente, LocalDate dataColeta,
                               LocalDate dataValidade, Integer quantidade, Instituicao instituicao) {
        setTipoSanguineo(tipoSanguineo);
        setComponente(componente);
        setDataColeta(dataColeta);
        setDataValidade(dataValidade);
        setQuantidade(quantidade);
        setInstituicao(instituicao);
    }

    @PrePersist
    private void gerarCodigoLote() {
        if (this.codigoLote == null) {
            this.codigoLote = "LT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }

    public Long getId() {
        return id;
    }

    public String getCodigoLote() {
        return codigoLote;
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

    public LocalDate getDataColeta() {
        return dataColeta;
    }

    public void setDataColeta(LocalDate dataColeta) {
        if (dataColeta == null) {
            throw new IllegalArgumentException("Data de coleta e obrigatoria");
        }
        if (dataColeta.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Data de coleta nao pode ser no futuro");
        }
        this.dataColeta = dataColeta;
    }

    public LocalDate getDataValidade() {
        return dataValidade;
    }

    public void setDataValidade(LocalDate dataValidade) {
        if (dataValidade == null) {
            throw new IllegalArgumentException("Data de validade e obrigatoria");
        }
        if (this.dataColeta != null && !dataValidade.isAfter(this.dataColeta)) {
            throw new IllegalArgumentException("Data de validade deve ser posterior a data de coleta");
        }
        this.dataValidade = dataValidade;
    }

    public Integer getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(Integer quantidade) {
        if (quantidade == null || quantidade <= 0) {
            throw new IllegalArgumentException("Quantidade deve ser maior que zero");
        }
        this.quantidade = quantidade;
    }

    public Instituicao getInstituicao() {
        return instituicao;
    }

    public void setInstituicao(Instituicao instituicao) {
        if (instituicao == null) {
            throw new IllegalArgumentException("Lote precisa estar vinculado a uma instituicao");
        }
        this.instituicao = instituicao;
    }

    /**
     * Usado pelo EstoqueService/PriorizacaoService para saber se o lote
     * ja esta vencido e nao deve mais entrar na fila FEFO.
     */
    public boolean isVencido() {
        return dataValidade.isBefore(LocalDate.now());
    }

    /**
     * Dias restantes ate o vencimento (pode ser negativo se ja vencido).
     * Usado para o alerta de "risco de vencimento" (US03/dashboard).
     */
    public long getDiasParaVencer() {
        return ChronoUnit.DAYS.between(LocalDate.now(), dataValidade);
    }
}
