import java.util.*;


class Bolsa {
    private String idBolsa;
    private String tipoSanguineo;
    private String dataColeta;
    private String dataValidade;
    private String idUnidadeAtual;
    private String status; 

    public Bolsa(String idBolsa, String tipoSanguineo, String dataColeta,
                  String dataValidade, String idUnidadeAtual, String status) {
        this.idBolsa = idBolsa;
        this.tipoSanguineo = tipoSanguineo;
        this.dataColeta = dataColeta;
        this.dataValidade = dataValidade;
        this.idUnidadeAtual = idUnidadeAtual;
        this.status = status;
    }

    public String getIdBolsa() { return idBolsa; }
    public String getTipoSanguineo() { return tipoSanguineo; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    @Override
    public String toString() {
        return idBolsa + " - " + tipoSanguineo + " - " + status;
    }
}

class Requisicao {
    private String idRequisicao;
    private String idUnidadeSolicitante;
    private String idUnidadeFornecedora;
    private String tipoSanguineoSolicitado;
    private int quantidadeSolicitada;
    private String dataRequisicao;
    private String status; 

    public Requisicao(String idRequisicao, String idUnidadeSolicitante, String idUnidadeFornecedora,
                       String tipoSanguineoSolicitado, int quantidadeSolicitada, String dataRequisicao) {
        this.idRequisicao = idRequisicao;
        this.idUnidadeSolicitante = idUnidadeSolicitante;
        this.idUnidadeFornecedora = idUnidadeFornecedora;
        this.tipoSanguineoSolicitado = tipoSanguineoSolicitado;
        this.quantidadeSolicitada = quantidadeSolicitada;
        this.dataRequisicao = dataRequisicao;
        this.status = "Pendente";
    }

    public String getIdRequisicao() { return idRequisicao; }
    public void setStatus(String status) { this.status = status; }

    @Override
    public String toString() {
        return idRequisicao + " - " + idUnidadeSolicitante + " pediu " +
               quantidadeSolicitada + " bolsas " + tipoSanguineoSolicitado;
    }
}

class Movimentacao {
    private String idBolsa;
    private String tipoEvento; 
    private String data;

    public Movimentacao(String idBolsa, String tipoEvento, String data) {
        this.idBolsa = idBolsa;
        this.tipoEvento = tipoEvento;
        this.data = data;
    }

    @Override
    public String toString() {
        return data + " - " + idBolsa + " -> " + tipoEvento;
    }
}

class EstoqueUnidade {
    private String idUnidade;
    private String tipoSanguineo;
    private int qtdBolsasAtual;
    private int estoqueMinimoSeguranca;
    private double consumoDiarioMedio;

    public EstoqueUnidade(String idUnidade, String tipoSanguineo, int qtdBolsasAtual,
                           int estoqueMinimoSeguranca, double consumoDiarioMedio) {
        this.idUnidade = idUnidade;
        this.tipoSanguineo = tipoSanguineo;
        this.qtdBolsasAtual = qtdBolsasAtual;
        this.estoqueMinimoSeguranca = estoqueMinimoSeguranca;
        this.consumoDiarioMedio = consumoDiarioMedio;
    }

    public boolean estaCritico() {
        return qtdBolsasAtual < estoqueMinimoSeguranca;
    }
}


class GerenciadorEstoque {
    private List<Bolsa> bolsasDisponiveis = new LinkedList<>();

    public void adicionarBolsa(Bolsa bolsa) {
        bolsasDisponiveis.add(bolsa);
    }

    public boolean removerBolsa(String idBolsa) {
        return bolsasDisponiveis.removeIf(b -> b.getIdBolsa().equals(idBolsa));
    }

    public void listarBolsas() {
        for (Bolsa b : bolsasDisponiveis) {
            System.out.println(b);
        }
    }
}


class FilaRequisicoes {
    private Queue<Requisicao> pendentes = new LinkedList<>();

    public void enfileirar(Requisicao r) {
        pendentes.add(r);
    }

    public Requisicao atenderProxima() {
        Requisicao r = pendentes.poll(); 
        if (r != null) r.setStatus("Atendida");
        return r;
    }

    public boolean vazia() {
        return pendentes.isEmpty();
    }
}


class HistoricoMovimentacoes {
    private Deque<Movimentacao> eventos = new ArrayDeque<>();

    public void registrarEvento(Movimentacao m) {
        eventos.push(m); 
    }

    public Movimentacao consultarUltimoEvento() {
        return eventos.peek(); 
    }
}

public class TesteModeloDominio {
    public static void main(String[] args) {
        GerenciadorEstoque estoqueH01 = new GerenciadorEstoque();
        estoqueH01.adicionarBolsa(new Bolsa("B001", "O+", "2026-09-01", "2026-10-13", "H01", "Disponivel"));
        estoqueH01.adicionarBolsa(new Bolsa("B002", "A-", "2026-09-05", "2026-10-17", "H01", "Disponivel"));
        estoqueH01.listarBolsas();

        FilaRequisicoes filaHemo01 = new FilaRequisicoes();
        filaHemo01.enfileirar(new Requisicao("R001", "H03", "HEMO01", "O-", 5, "2026-09-14"));
        filaHemo01.enfileirar(new Requisicao("R002", "H06", "HEMO01", "B-", 3, "2026-09-14"));
        Requisicao atendida = filaHemo01.atenderProxima();
        System.out.println("Atendendo: " + atendida);

        HistoricoMovimentacoes historicoB001 = new HistoricoMovimentacoes();
        historicoB001.registrarEvento(new Movimentacao("B001", "Coletada", "2026-09-01"));
        historicoB001.registrarEvento(new Movimentacao("B001", "Reservada", "2026-09-10"));
        System.out.println("Ultimo evento: " + historicoB001.consultarUltimoEvento());
    }
}
