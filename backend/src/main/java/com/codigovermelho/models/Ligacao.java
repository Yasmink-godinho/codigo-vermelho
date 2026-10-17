package com.codigovermelho.models;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

// Ligacao entre duas instituicoes da malha (US05). E a aresta do grafo.
// Nao tem direcao: se A esta ligada em B, tambem da pra ir de B ate A.
// A distancia nao fica salva aqui, ela e calculada pela latitude/longitude
// das duas instituicoes na hora de montar o grafo (assim nao fica desatualizada).
// O OnDelete faz o banco apagar a ligacao junto quando uma instituicao e excluida.
// A restricao unique barra o mesmo par repetido na mesma direcao; o sentido contrario (B-A)
// e barrado pelo LigacaoService.
@Entity
@Table(name = "ligacao",
        uniqueConstraints = @UniqueConstraint(name = "uk_ligacao_origem_destino", columnNames = {"origem_id", "destino_id"}))
public class Ligacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "origem_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Instituicao origem;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "destino_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Instituicao destino;

    protected Ligacao() {
        // o JPA precisa desse construtor
    }

    public Ligacao(Instituicao origem, Instituicao destino) {
        if (origem == null || destino == null) {
            throw new IllegalArgumentException("Origem e destino da ligacao sao obrigatorios");
        }
        if (origem.getId() != null && origem.getId().equals(destino.getId())) {
            throw new IllegalArgumentException("Uma instituicao nao pode ser ligada com ela mesma");
        }
        this.origem = origem;
        this.destino = destino;
    }

    public Long getId() {
        return id;
    }

    public Instituicao getOrigem() {
        return origem;
    }

    public Instituicao getDestino() {
        return destino;
    }

    // distancia em km em linha reta entre as duas instituicoes
    public double getDistanciaKm() {
        return com.codigovermelho.grafos.CalculoDistancia.haversineKm(
                origem.getLatitude(), origem.getLongitude(),
                destino.getLatitude(), destino.getLongitude());
    }
}
