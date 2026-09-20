package com.codigovermelho.models;

import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.models.enums.TipoSanguineo;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.FetchType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MapKeyEnumerated;
import jakarta.persistence.Table;
import jakarta.persistence.JoinColumn;

import java.util.EnumMap;
import java.util.Map;

/**
 * Instituicao da malha logistica (US01): hemocentro, hospital ou unidade
 * equivalente, com localizacao geografica e estoque minimo de seguranca
 * por tipo sanguineo.
 */
@Entity
@Table(name = "instituicao")
public class Instituicao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoInstituicao tipo;

    @Column(nullable = false)
    private String endereco;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    /**
     * Estoque minimo de seguranca por tipo sanguineo (US01).
     * Ex: O+ -> 20 (unidades minimas antes de disparar alerta critico).
     */

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "instituicao_estoque_minimo", joinColumns = @JoinColumn(name = "instituicao_id"))
    @MapKeyEnumerated(EnumType.STRING)
    @Column(name = "quantidade_minima")
    private Map<TipoSanguineo, Integer> estoqueMinimoPorTipo = new EnumMap<>(TipoSanguineo.class);

    protected Instituicao() {
        // construtor exigido pelo JPA
    }

    public Instituicao(String nome, TipoInstituicao tipo, String endereco, Double latitude, Double longitude) {
        setNome(nome);
        setTipo(tipo);
        setEndereco(endereco);
        setLatitude(latitude);
        setLongitude(longitude);
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("Nome da instituicao nao pode ser vazio");
        }
        this.nome = nome;
    }

    public TipoInstituicao getTipo() {
        return tipo;
    }

    public void setTipo(TipoInstituicao tipo) {
        if (tipo == null) {
            throw new IllegalArgumentException("Tipo de instituicao e obrigatorio");
        }
        this.tipo = tipo;
    }

    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        if (endereco == null || endereco.isBlank()) {
            throw new IllegalArgumentException("Endereco nao pode ser vazio");
        }
        this.endereco = endereco;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        if (latitude == null || latitude < -90 || latitude > 90) {
            throw new IllegalArgumentException("Coordenadas invalidas");
        }
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        if (longitude == null || longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException("Coordenadas invalidas");
        }
        this.longitude = longitude;
    }

    public Map<TipoSanguineo, Integer> getEstoqueMinimoPorTipo() {
        return estoqueMinimoPorTipo;
    }

    /**
     * Define o estoque minimo de seguranca para um tipo sanguineo especifico.
     * Metodo incremental (em vez de substituir o mapa inteiro) para permitir
     * atualizar um tipo por vez sem apagar os demais.
     */
    public void definirEstoqueMinimo(TipoSanguineo tipoSanguineo, Integer quantidadeMinima) {
        if (tipoSanguineo == null) {
            throw new IllegalArgumentException("Tipo sanguineo e obrigatorio");
        }
        if (quantidadeMinima == null || quantidadeMinima < 0) {
            throw new IllegalArgumentException("Quantidade minima nao pode ser negativa");
        }
        this.estoqueMinimoPorTipo.put(tipoSanguineo, quantidadeMinima);
    }

    public int getEstoqueMinimo(TipoSanguineo tipoSanguineo) {
        return estoqueMinimoPorTipo.getOrDefault(tipoSanguineo, 0);
    }
}
