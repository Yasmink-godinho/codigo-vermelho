class TestesEstruturasAED {
    private static void verificar(boolean condicao, String mensagem) {
        if (!condicao) throw new AssertionError(mensagem);
    }
    public static void main(String[] args) {
        GerenciadorEstoque lista = new GerenciadorEstoque();
        verificar(lista.consultarBolsa("B001") == null, "Lista inicialmente vazia");
        lista.adicionarBolsa(new Bolsa("B001", "O+", "2026-09-01", "2026-10-13", "H01", "Disponivel"));
        lista.adicionarBolsa(new Bolsa("B002", "A-", "2026-09-05", "2026-10-17", "H01", "Disponivel"));
        verificar(lista.consultarBolsa("B001") != null, "Consultar bolsa");
        verificar(lista.removerBolsa("B001"), "Remover bolsa");
        verificar(lista.consultarBolsa("B001") == null, "Bolsa removida");
        verificar(!lista.removerBolsa("inexistente"), "Remover inexistente");

        FilaRequisicoes fila = new FilaRequisicoes();
        verificar(fila.vazia() && fila.consultarProxima() == null, "Fila vazia");
        fila.enfileirar(new Requisicao("R001", "H03", "HEMO01", "O-", 5, "2026-09-14"));
        fila.enfileirar(new Requisicao("R002", "H06", "HEMO01", "B-", 3, "2026-09-14"));
        verificar(fila.consultarProxima().getIdRequisicao().equals("R001"), "Consulta FIFO");
        verificar(fila.atenderProxima().getIdRequisicao().equals("R001"), "Primeira requisicao");
        verificar(fila.atenderProxima().getIdRequisicao().equals("R002"), "Segunda requisicao");
        verificar(fila.vazia() && fila.atenderProxima() == null, "Fila esgotada");

        HistoricoMovimentacoes pilha = new HistoricoMovimentacoes();
        verificar(pilha.consultarUltimoEvento() == null, "Pilha vazia");
        pilha.registrarEvento(new Movimentacao("B001", "Coletada", "2026-09-01"));
        pilha.registrarEvento(new Movimentacao("B001", "Reservada", "2026-09-10"));
        verificar(pilha.consultarUltimoEvento().toString().contains("Reservada"), "Consulta LIFO");
        verificar(pilha.removerUltimoEvento().toString().contains("Reservada"), "Primeira remocao LIFO");
        verificar(pilha.removerUltimoEvento().toString().contains("Coletada"), "Segunda remocao LIFO");
        verificar(pilha.removerUltimoEvento() == null, "Pilha esgotada");
        System.out.println("Todos os testes de AED em Java passaram.");
    }
}
