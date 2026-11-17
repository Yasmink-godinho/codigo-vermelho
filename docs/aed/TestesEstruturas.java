// Testes automatizados das estruturas em Java (sem biblioteca de teste).
// Sao os mesmos casos de testes_estruturas.cpp, na mesma ordem.
//
// Compilar: javac conexao_poo_PI3E2-94.java TestesEstruturas.java
// Executar: java TestesEstruturas
public class TestesEstruturas {

    static int passaram = 0;
    static int total = 0;

    static void verificar(boolean condicao, String nomeDoTeste) {
        total++;
        if (condicao) {
            passaram++;
            System.out.println("[PASSOU] " + nomeDoTeste);
        } else {
            System.out.println("[FALHOU] " + nomeDoTeste);
        }
    }

    static Bolsa criarBolsa(String id, String tipo) {
        return new Bolsa(id, tipo, "2026-09-01", "2026-10-13", "H01", "Disponivel");
    }

    static Requisicao criarRequisicao(String id) {
        return new Requisicao(id, "H03", "HEMO01", "O-", 5, "2026-09-14", "Pendente");
    }

    static Movimentacao criarMovimentacao(String tipoEvento) {
        return new Movimentacao("B001", tipoEvento, "2026-09-01");
    }

    // ------------------------------------------------------------ LISTA
    static void testarLista() {
        System.out.println("--- Lista ---");

        ListaBolsas vazia = new ListaBolsas();
        verificar(vazia.vazia(), "Lista nova esta vazia");
        verificar(vazia.tamanho() == 0, "Lista nova tem tamanho 0");
        verificar(!vazia.remover("B001"), "Remover em lista vazia devolve false");
        verificar(vazia.consultar("B001") == null, "Consultar em lista vazia devolve null");

        ListaBolsas lista = new ListaBolsas();
        lista.inserir(criarBolsa("B001", "O+"));
        lista.inserir(criarBolsa("B002", "A-"));
        lista.inserir(criarBolsa("B003", "B+"));
        verificar(lista.tamanho() == 3, "Tamanho 3 apos tres insercoes");

        // inserir coloca no INICIO: a ordem fica B003, B002, B001 (igual ao C++)
        boolean ok0 = lista.obterNaPosicao(0).getIdBolsa().equals("B003");
        boolean ok1 = lista.obterNaPosicao(1).getIdBolsa().equals("B002");
        boolean ok2 = lista.obterNaPosicao(2).getIdBolsa().equals("B001");
        verificar(ok0 && ok1 && ok2, "Insercao no inicio: ordem B003, B002, B001");
        verificar(lista.obterNaPosicao(3) == null, "Posicao inexistente devolve null");

        Bolsa b = lista.consultar("B002");
        verificar(b != null && b.getTipoSanguineo().equals("A-"), "Consultar B002 devolve a bolsa certa");
        verificar(lista.tamanho() == 3, "Consultar nao remove da lista");
        verificar(lista.consultar("B999") == null, "Consultar id inexistente devolve null");

        verificar(lista.remover("B003"), "Remover a cabeca (B003)");
        verificar(lista.obterNaPosicao(0).getIdBolsa().equals("B002"), "Depois de remover a cabeca, B002 e a primeira");

        lista.inserir(criarBolsa("B004", "AB+")); // ordem: B004, B002, B001
        verificar(lista.remover("B002"), "Remover do meio (B002)");
        verificar(lista.obterNaPosicao(0).getIdBolsa().equals("B004")
                && lista.obterNaPosicao(1).getIdBolsa().equals("B001"),
                "Depois de remover o meio, ficam B004 e B001");

        verificar(lista.remover("B001"), "Remover o ultimo (B001)");
        verificar(lista.tamanho() == 1, "Tamanho 1 apos tres remocoes");

        verificar(!lista.remover("B001"), "Remover duas vezes o mesmo id devolve false na segunda");
        verificar(lista.remover("B004") && lista.vazia(), "Remover o unico elemento deixa a lista vazia");
    }

    // ------------------------------------------------------------- FILA
    static void testarFila() {
        System.out.println("--- Fila ---");

        FilaRequisicoes fila = new FilaRequisicoes();
        verificar(fila.vazia(), "Fila nova esta vazia");
        verificar(fila.desenfileirar() == null, "Desenfileirar em fila vazia devolve null");
        verificar(fila.consultarProxima() == null, "Consultar proxima em fila vazia devolve null");

        fila.enfileirar(criarRequisicao("R001"));
        fila.enfileirar(criarRequisicao("R002"));
        fila.enfileirar(criarRequisicao("R003"));
        verificar(fila.tamanho() == 3, "Tamanho 3 apos tres enfileiramentos");

        verificar(fila.consultarProxima().getIdRequisicao().equals("R001"), "Proxima da fila e R001");
        verificar(fila.tamanho() == 3, "Consultar proxima nao remove");

        boolean a = fila.desenfileirar().getIdRequisicao().equals("R001");
        boolean b = fila.desenfileirar().getIdRequisicao().equals("R002");
        boolean c = fila.desenfileirar().getIdRequisicao().equals("R003");
        verificar(a && b && c, "Ordem FIFO: R001, R002, R003");
        verificar(fila.vazia() && fila.tamanho() == 0, "Fila vazia depois de atender todas");

        // Caso de borda: depois de esvaziar, "fim" tem que voltar para null
        fila.enfileirar(criarRequisicao("R004"));
        verificar(fila.consultarProxima().getIdRequisicao().equals("R004"), "Reutilizar a fila depois de esvaziar");
        fila.enfileirar(criarRequisicao("R005"));
        verificar(fila.desenfileirar().getIdRequisicao().equals("R004")
                && fila.desenfileirar().getIdRequisicao().equals("R005"),
                "Fila reutilizada mantem a ordem FIFO");
    }

    // ------------------------------------------------------------ PILHA
    static void testarPilha() {
        System.out.println("--- Pilha ---");

        PilhaMovimentacoes pilha = new PilhaMovimentacoes();
        verificar(pilha.vazia(), "Pilha nova esta vazia");
        verificar(pilha.desempilhar() == null, "Desempilhar em pilha vazia devolve null");
        verificar(pilha.consultarTopo() == null, "Consultar topo em pilha vazia devolve null");

        pilha.empilhar(criarMovimentacao("Coletada"));
        pilha.empilhar(criarMovimentacao("Reservada"));
        pilha.empilhar(criarMovimentacao("Utilizada"));
        verificar(pilha.tamanho() == 3, "Tamanho 3 apos tres empilhamentos");

        verificar(pilha.consultarTopo().getTipoEvento().equals("Utilizada"), "Topo e o evento mais recente (Utilizada)");
        verificar(pilha.tamanho() == 3, "Consultar topo nao remove");

        boolean a = pilha.desempilhar().getTipoEvento().equals("Utilizada");
        boolean b = pilha.desempilhar().getTipoEvento().equals("Reservada");
        boolean c = pilha.desempilhar().getTipoEvento().equals("Coletada");
        verificar(a && b && c, "Ordem LIFO: Utilizada, Reservada, Coletada");
        verificar(pilha.vazia() && pilha.desempilhar() == null, "Pilha vazia depois de desempilhar tudo");
    }

    public static void main(String[] args) {
        testarLista();
        testarFila();
        testarPilha();

        System.out.println();
        System.out.println(passaram + " de " + total + " testes passaram.");
        if (passaram != total) System.exit(1);
    }
}
