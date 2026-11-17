// PI3E2-94 - Lista, Fila e Pilha reimplementadas em Java, SEM colecao pronta.
// Cada estrutura usa um no proprio (No<T>) com a referencia "proximo",
// seguindo o mesmo algoritmo das classes C++ de estrutura_base_PI3E2-93.h.
// Nao ha LinkedList, Queue, Deque, ArrayDeque nem qualquer classe de java.util.
//
// Compilar: javac conexao_poo_PI3E2-94.java TestesEstruturas.java
// Demo:     java TesteModeloDominio
// Testes:   java TestesEstruturas

// ======================================================================
// Classes de dominio (encapsuladas: atributos privados + getters)
// ======================================================================
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
    public String getDataColeta() { return dataColeta; }
    public String getDataValidade() { return dataValidade; }
    public String getIdUnidadeAtual() { return idUnidadeAtual; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
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
                      String tipoSanguineoSolicitado, int quantidadeSolicitada,
                      String dataRequisicao, String status) {
        this.idRequisicao = idRequisicao;
        this.idUnidadeSolicitante = idUnidadeSolicitante;
        this.idUnidadeFornecedora = idUnidadeFornecedora;
        this.tipoSanguineoSolicitado = tipoSanguineoSolicitado;
        this.quantidadeSolicitada = quantidadeSolicitada;
        this.dataRequisicao = dataRequisicao;
        this.status = status;
    }

    public String getIdRequisicao() { return idRequisicao; }
    public String getIdUnidadeSolicitante() { return idUnidadeSolicitante; }
    public String getIdUnidadeFornecedora() { return idUnidadeFornecedora; }
    public String getTipoSanguineoSolicitado() { return tipoSanguineoSolicitado; }
    public int getQuantidadeSolicitada() { return quantidadeSolicitada; }
    public String getDataRequisicao() { return dataRequisicao; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

class Movimentacao {
    private String idBolsa;
    private String tipoEvento; // "Coletada", "Reservada", "Utilizada", "Descartada"
    private String data;

    public Movimentacao(String idBolsa, String tipoEvento, String data) {
        this.idBolsa = idBolsa;
        this.tipoEvento = tipoEvento;
        this.data = data;
    }

    public String getIdBolsa() { return idBolsa; }
    public String getTipoEvento() { return tipoEvento; }
    public String getData() { return data; }
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

// ======================================================================
// No generico: equivale ao struct NoBolsa / NoRequisicao / NoMovimentacao
// do C++. "proximo" faz o papel do ponteiro (em Java e uma referencia).
// ======================================================================
class No<T> {
    T dado;
    No<T> proximo;

    No(T dado) {
        this.dado = dado;
        this.proximo = null;
    }
}

// ======================================================================
// LISTA ENCADEADA - bolsas disponiveis em uma unidade (igual ao ListaBolsas C++)
// ======================================================================
class ListaBolsas {
    private No<Bolsa> inicio;
    private int qtd;

    public ListaBolsas() {
        inicio = null;
        qtd = 0;
    }

    // Insere no INICIO da lista (igual ao C++)
    public void inserir(Bolsa nova) {
        No<Bolsa> novo = new No<>(nova);
        novo.proximo = inicio;
        inicio = novo;
        qtd++;
    }

    // Remove pelo id. Trata cabeca, meio e fim (igual ao C++).
    // Em Java nao existe delete: ao soltar a referencia, o no fica sem uso
    // e o garbage collector libera a memoria.
    public boolean remover(String idBolsa) {
        No<Bolsa> atual = inicio;
        No<Bolsa> anterior = null;
        while (atual != null) {
            if (atual.dado.getIdBolsa().equals(idBolsa)) {
                if (anterior == null) inicio = atual.proximo;
                else anterior.proximo = atual.proximo;
                qtd--;
                return true;
            }
            anterior = atual;
            atual = atual.proximo;
        }
        return false; // nao encontrou a bolsa
    }

    // Consulta pelo id, sem remover. Devolve a bolsa ou null (no C++: true/false).
    public Bolsa consultar(String idBolsa) {
        No<Bolsa> atual = inicio;
        while (atual != null) {
            if (atual.dado.getIdBolsa().equals(idBolsa)) {
                return atual.dado;
            }
            atual = atual.proximo;
        }
        return null;
    }

    // Consulta pela posicao (0 = primeira da lista), sem remover.
    public Bolsa obterNaPosicao(int posicao) {
        if (posicao < 0) return null;
        No<Bolsa> atual = inicio;
        int i = 0;
        while (atual != null) {
            if (i == posicao) return atual.dado;
            atual = atual.proximo;
            i++;
        }
        return null;
    }

    public int tamanho() { return qtd; }

    public boolean vazia() { return inicio == null; }

    public void listar() {
        No<Bolsa> atual = inicio;
        while (atual != null) {
            System.out.println(atual.dado.getIdBolsa() + " - "
                    + atual.dado.getTipoSanguineo() + " - " + atual.dado.getStatus());
            atual = atual.proximo;
        }
    }

    // Equivalente ao liberar() do C++: solta os nos para o garbage collector.
    public void liberar() {
        inicio = null;
        qtd = 0;
    }
}

// ======================================================================
// FILA - requisicoes pendentes, FIFO (igual ao FilaRequisicoes C++)
// ======================================================================
class FilaRequisicoes {
    private No<Requisicao> inicio;
    private No<Requisicao> fim;
    private int qtd;

    public FilaRequisicoes() {
        inicio = null;
        fim = null;
        qtd = 0;
    }

    // Insere no FIM da fila
    public void enfileirar(Requisicao nova) {
        No<Requisicao> novo = new No<>(nova);
        if (fim == null) {
            inicio = novo;
            fim = novo;
        } else {
            fim.proximo = novo;
            fim = novo;
        }
        qtd++;
    }

    // Remove do INICIO da fila. Se a fila esvaziar, "fim" volta a null.
    // Fila vazia devolve null (no C++: false).
    public Requisicao desenfileirar() {
        if (inicio == null) return null;
        Requisicao removida = inicio.dado;
        inicio = inicio.proximo;
        if (inicio == null) fim = null;
        qtd--;
        return removida;
    }

    // Consulta a proxima requisicao, sem remover.
    public Requisicao consultarProxima() {
        if (inicio == null) return null;
        return inicio.dado;
    }

    public int tamanho() { return qtd; }

    public boolean vazia() { return inicio == null; }

    public void liberar() {
        inicio = null;
        fim = null;
        qtd = 0;
    }
}

// ======================================================================
// PILHA - historico de movimentacoes, LIFO (igual ao PilhaMovimentacoes C++)
// ======================================================================
class PilhaMovimentacoes {
    private No<Movimentacao> topo;
    private int qtd;

    public PilhaMovimentacoes() {
        topo = null;
        qtd = 0;
    }

    // Insere no TOPO
    public void empilhar(Movimentacao nova) {
        No<Movimentacao> novo = new No<>(nova);
        novo.proximo = topo;
        topo = novo;
        qtd++;
    }

    // Remove do TOPO. Pilha vazia devolve null, igual ao C++ que devolve false
    // (nao lanca excecao).
    public Movimentacao desempilhar() {
        if (topo == null) return null;
        Movimentacao removida = topo.dado;
        topo = topo.proximo;
        qtd--;
        return removida;
    }

    // Consulta o evento mais recente, sem remover.
    public Movimentacao consultarTopo() {
        if (topo == null) return null;
        return topo.dado;
    }

    public int tamanho() { return qtd; }

    public boolean vazia() { return topo == null; }

    public void liberar() {
        topo = null;
        qtd = 0;
    }
}

// ======================================================================
// Demonstracao com os mesmos dados sinteticos do C++.
// A saida e igual a do programa estrutura_base_PI3E2-93.cpp.
// ======================================================================
class TesteModeloDominio {
    public static void main(String[] args) {
        // LISTA
        ListaBolsas bolsasH01 = new ListaBolsas();
        bolsasH01.inserir(new Bolsa("B001", "O+", "2026-09-01", "2026-10-13", "H01", "Disponivel"));
        bolsasH01.inserir(new Bolsa("B002", "A-", "2026-09-05", "2026-10-17", "H01", "Disponivel"));
        bolsasH01.listar();
        System.out.println("Tamanho da lista: " + bolsasH01.tamanho());

        Bolsa encontrada = bolsasH01.consultar("B001");
        if (encontrada != null) {
            System.out.println("Consulta B001: " + encontrada.getTipoSanguineo() + " - " + encontrada.getStatus());
        }

        // FILA
        FilaRequisicoes filaHemo01 = new FilaRequisicoes();
        filaHemo01.enfileirar(new Requisicao("R001", "H03", "HEMO01", "O-", 5, "2026-09-14", "Pendente"));
        filaHemo01.enfileirar(new Requisicao("R002", "H06", "HEMO01", "B-", 3, "2026-09-14", "Pendente"));

        Requisicao proxima = filaHemo01.consultarProxima();
        if (proxima != null) {
            System.out.println("Proxima da fila (sem remover): " + proxima.getIdRequisicao());
        }

        Requisicao atendida = filaHemo01.desenfileirar();
        System.out.println("Atendendo requisicao: " + atendida.getIdRequisicao());
        System.out.println("Restam na fila: " + filaHemo01.tamanho());

        // PILHA
        PilhaMovimentacoes historicoB001 = new PilhaMovimentacoes();
        historicoB001.empilhar(new Movimentacao("B001", "Coletada", "2026-09-01"));
        historicoB001.empilhar(new Movimentacao("B001", "Reservada", "2026-09-10"));

        Movimentacao topoAtual = historicoB001.consultarTopo();
        if (topoAtual != null) {
            System.out.println("Topo do historico (sem remover): " + topoAtual.getTipoEvento());
        }

        Movimentacao ultimoEvento = historicoB001.desempilhar();
        System.out.println("Ultimo evento removido da pilha: " + ultimoEvento.getTipoEvento());

        // Pilha vazia: desempilhar devolve null (nao quebra o programa)
        historicoB001.desempilhar();
        boolean deuCerto = historicoB001.desempilhar() != null;
        System.out.println("Desempilhar com pilha vazia: " + (deuCerto ? "true" : "false"));
    }
}
