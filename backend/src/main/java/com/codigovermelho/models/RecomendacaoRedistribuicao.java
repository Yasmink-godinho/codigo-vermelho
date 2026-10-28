package com.codigovermelho.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "recomendacoes_redistribuicao")
public class RecomendacaoRedistribuicao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long origemId;
    private String origemNome;
    private Long destinoId;
    private String destinoNome;
    private String tipoSanguineo;
    private String componente;
    private int quantidade;
    private String nivelUrgencia;
    private String status; // PENDENTE, APROVADA, RECUSADA

    @Column(length = 1000)
    private String justificativaRecusa;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "recomendacao_motivos", joinColumns = @JoinColumn(name = "recomendacao_id"))
    @Column(name = "motivo", length = 500)
    private List<String> motivosExplicaveis = new ArrayList<>();

    private LocalDateTime dataCriacao;

    public RecomendacaoRedistribuicao() {
        this.dataCriacao = LocalDateTime.now();
    }

    public RecomendacaoRedistribuicao(Long origemId, String origemNome, Long destinoId,
                                      String destinoNome, String tipoSanguineo, String componente,
                                      int quantidade, String nivelUrgencia, String status,
                                      List<String> motivosExplicaveis) {
        this.origemId = origemId;
        this.origemNome = origemNome;
        this.destinoId = destinoId;
        this.destinoNome = destinoNome;
        this.tipoSanguineo = tipoSanguineo;
        this.componente = componente;
        this.quantidade = quantidade;
        this.nivelUrgencia = nivelUrgencia;
        this.status = status;
        this.motivosExplicaveis = motivosExplicaveis != null ? motivosExplicaveis : new ArrayList<>();
        this.dataCriacao = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOrigemId() { return origemId; }
    public void setOrigemId(Long origemId) { this.origemId = origemId; }

    public String getOrigemNome() { return origemNome; }
    public void setOrigemNome(String origemNome) { this.origemNome = origemNome; }

    public Long getDestinoId() { return destinoId; }
    public void setDestinoId(Long destinoId) { this.destinoId = destinoId; }

    public String getDestinoNome() { return destinoNome; }
    public void setDestinoNome(String destinoNome) { this.destinoNome = destinoNome; }

    public String getTipoSanguineo() { return tipoSanguineo; }
    public void setTipoSanguineo(String tipoSanguineo) { this.tipoSanguineo = tipoSanguineo; }

    public String getComponente() { return componente; }
    public void setComponente(String componente) { this.componente = componente; }

    public int getQuantidade() { return quantidade; }
    public void setQuantidade(int quantidade) { this.quantidade = quantidade; }

    public String getNivelUrgencia() { return nivelUrgencia; }
    public void setNivelUrgencia(String nivelUrgencia) { this.nivelUrgencia = nivelUrgencia; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getJustificativaRecusa() { return justificativaRecusa; }
    public void setJustificativaRecusa(String justificativaRecusa) { this.justificativaRecusa = justificativaRecusa; }

    public List<String> getMotivosExplicaveis() { return motivosExplicaveis; }
    public void setMotivosExplicaveis(List<String> motivosExplicaveis) { this.motivosExplicaveis = motivosExplicaveis; }

    public LocalDateTime getDataCriacao() { return dataCriacao; }
    public void setDataCriacao(LocalDateTime dataCriacao) { this.dataCriacao = dataCriacao; }
}