package com.codigovermelho.controllers.dto;

import java.util.List;

public class RecomendacaoRedistribuicaoResponse {
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
    private String justificativaRecusa;
    private List<String> motivosExplicaveis;

    public RecomendacaoRedistribuicaoResponse() {}

    public RecomendacaoRedistribuicaoResponse(Long id, Long origemId, String origemNome, Long destinoId,
                                              String destinoNome, String tipoSanguineo, String componente,
                                              int quantidade, String nivelUrgencia, String status,
                                              String justificativaRecusa, List<String> motivosExplicaveis) {
        this.id = id;
        this.origemId = origemId;
        this.origemNome = origemNome;
        this.destinoId = destinoId;
        this.destinoNome = destinoNome;
        this.tipoSanguineo = tipoSanguineo;
        this.componente = componente;
        this.quantidade = quantidade;
        this.nivelUrgencia = nivelUrgencia;
        this.status = status;
        this.justificativaRecusa = justificativaRecusa;
        this.motivosExplicaveis = motivosExplicaveis;
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
}