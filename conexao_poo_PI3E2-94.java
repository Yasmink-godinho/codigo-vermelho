
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
    private static class NoBolsa {
        Bolsa dado;
        NoBolsa proximo;
        NoBolsa(Bolsa dado, NoBolsa proximo) {
            this.dado = dado;
            this.proximo = proximo;
        }
    }

    private NoBolsa inicio;

    public void adicionarBolsa(Bolsa bolsa) {
        inicio = new NoBolsa(bolsa, inicio);
    }

    public boolean removerBolsa(String idBolsa) {
        NoBolsa atual = inicio;
        NoBolsa anterior = null;
        while (atual != null) {
            if (atual.dado.getIdBolsa().equals(idBolsa)) {
                if (anterior == null) inicio = atual.proximo;
                else anterior.proximo = atual.proximo;
                return true;
            }
            anterior = atual;
            atual = atual.proximo;
        }
        return false;
    }

    public Bolsa consultarBolsa(String idBolsa) {
        NoBolsa atual = inicio;
        while (atual != null) {
            if (atual.dado.getIdBolsa().equals(idBolsa)) return atual.dado;
            atual = atual.proximo;
        }
        return null;
    }

    public void listarBolsas() {
        NoBolsa atual = inicio;
        while (atual != null) {
            System.out.println(atual.dado);
            atual = atual.proximo;
        }
    }
}

class FilaRequisicoes {
    private static class NoRequisicao {
        Requisicao dado;
        NoRequisicao proximo;
        NoRequisicao(Requisicao dado) { this.dado = dado; }
    }

    private NoRequisicao inicio;
    private NoRequisicao fim;

    public void enfileirar(Requisicao r) {
        NoRequisicao novo = new NoRequisicao(r);
        if (fim == null) inicio = novo;
        else fim.proximo = novo;
        fim = novo;
    }

    public Requisicao consultarProxima() {
        return inicio == null ? null : inicio.dado;
    }

    public Requisicao atenderProxima() {
        if (inicio == null) return null;
        Requisicao r = inicio.dado;
        inicio = inicio.proximo;
        if (inicio == null) fim = null;
        r.setStatus("Atendida");
        return r;
    }

    public boolean vazia() { return inicio == null; }
}

class HistoricoMovimentacoes {
    private static class NoMovimentacao {
        Movimentacao dado;
        NoMovimentacao proximo;
        NoMovimentacao(Movimentacao dado, NoMovimentacao proximo) {
            this.dado = dado;
            this.proximo = proximo;
        }
    }

    private NoMovimentacao topo;

    public void registrarEvento(Movimentacao m) {
        topo = new NoMovimentacao(m, topo);
    }

    public Movimentacao consultarUltimoEvento() {
        return topo == null ? null : topo.dado;
    }

    public Movimentacao removerUltimoEvento() {
        if (topo == null) return null;
        Movimentacao removida = topo.dado;
        topo = topo.proximo;
        return removida;
    }
}

class TesteModeloDominio {
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
