// Testes automatizados da U2 em Java (sem biblioteca de teste).
// Sao os mesmos casos de testes_u2.cpp, na mesma ordem e com os mesmos nomes.
//
// Compilar: javac conexao_poo_PI3E2-94.java integracao_poo_u2.java TestesU2.java
// Executar: java TestesU2
public class TestesU2 {

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

    static Bolsa criarBolsa(String id, String tipo, String validade, String unidade) {
        return new Bolsa(id, tipo, "2026-10-01", validade, unidade, "Disponivel");
    }

    static Requisicao criarPedido(String id, String solicitante, String origem, String tipo, int qtd) {
        return new Requisicao(id, solicitante, origem, tipo, qtd, "2026-11-11", "Pendente");
    }

    static void montarCentral(CentralAlocacao c) {
        c.adicionarUnidade("HEMO01", -8.0476, -34.8770, 5);
        c.adicionarUnidade("HEMO02", -8.0993, -34.9448, 5);
        c.adicionarUnidade("HEMO03", -8.0631, -34.8711, 5);
        c.adicionarUnidade("H03", -7.9948, -34.8656, 5);
    }

    static String idsDa(ListaFefo lista) {
        String ids = "";
        No<Bolsa> no = lista.primeiro();
        while (no != null) {
            ids += no.dado.getIdBolsa() + " ";
            no = no.proximo;
        }
        return ids;
    }

    static String rotaDe(RotaResultado rota) {
        String texto = "";
        for (int i = 0; i < rota.qtdPontos; i++) texto += rota.ordem[i] + " ";
        return texto;
    }

    // ------------------------------------------------------------ MATRIZ
    static void testarMatriz() {
        System.out.println("--- Matriz ABO/Rh ---");
        String[] T = CompatibilidadeAboRh.TIPOS;
        int Q = CompatibilidadeAboRh.QTD_TIPOS;

        int pares = 0;
        for (int d = 0; d < Q; d++)
            for (int r = 0; r < Q; r++)
                if (CompatibilidadeAboRh.compativel(T[d], T[r])) pares++;
        verificar(pares == 27, "Matriz tem 27 pares compativeis de 64");

        boolean todosTiposRecebemDeOnegativo = true;
        for (int r = 0; r < Q; r++)
            if (!CompatibilidadeAboRh.compativel("O-", T[r])) todosTiposRecebemDeOnegativo = false;
        verificar(todosTiposRecebemDeOnegativo, "O- doa para os 8 tipos");

        boolean abPositivoRecebeDeTodos = true;
        for (int d = 0; d < Q; d++)
            if (!CompatibilidadeAboRh.compativel(T[d], "AB+")) abPositivoRecebeDeTodos = false;
        verificar(abPositivoRecebeDeTodos, "AB+ recebe de todos os 8 tipos");

        verificar(CompatibilidadeAboRh.compativel("AB+", "AB+") && !CompatibilidadeAboRh.compativel("AB+", "O-")
                && !CompatibilidadeAboRh.compativel("AB+", "A+") && !CompatibilidadeAboRh.compativel("AB+", "B+")
                && !CompatibilidadeAboRh.compativel("AB+", "AB-"), "AB+ doa somente para AB+");

        boolean mesmoTipo = true;
        for (int i = 0; i < Q; i++)
            if (!CompatibilidadeAboRh.compativel(T[i], T[i])) mesmoTipo = false;
        verificar(mesmoTipo, "Todo tipo e compativel com ele mesmo");

        verificar(CompatibilidadeAboRh.compativel("A-", "A+") && !CompatibilidadeAboRh.compativel("A+", "A-"),
                "Rh: A- doa para A+, A+ nao doa para A-");
        verificar(CompatibilidadeAboRh.compativel("O-", "O+") && !CompatibilidadeAboRh.compativel("O+", "O-"),
                "Rh: O- doa para O+, O+ nao doa para O-");
        verificar(!CompatibilidadeAboRh.compativel("A+", "B+") && !CompatibilidadeAboRh.compativel("B+", "A+"),
                "ABO: A+ e B+ sao incompativeis nos dois sentidos");
        verificar(!CompatibilidadeAboRh.compativel("A-", "B-") && !CompatibilidadeAboRh.compativel("B-", "A-"),
                "ABO: A- e B- sao incompativeis nos dois sentidos");
        verificar(!CompatibilidadeAboRh.compativel("O+", "A-") && !CompatibilidadeAboRh.compativel("O+", "B-"),
                "O+ nao doa para receptor Rh negativo");
        verificar(!CompatibilidadeAboRh.compativel("AB-", "O-") && !CompatibilidadeAboRh.compativel("AB-", "A-"),
                "AB- nao doa para O- nem A-");

        verificar(!CompatibilidadeAboRh.compativel("C+", "O-") && !CompatibilidadeAboRh.compativel("O-", "C+")
                && !CompatibilidadeAboRh.compativel("", "O-") && !CompatibilidadeAboRh.compativel("o-", "O-"),
                "Tipo invalido devolve false");
        verificar(CompatibilidadeAboRh.indiceDoTipo("AB+") == 7 && CompatibilidadeAboRh.indiceDoTipo("O-") == 0
                && CompatibilidadeAboRh.indiceDoTipo("X") == -1, "indiceDoTipo devolve a posicao ou -1");

        // Regra independente: doa se nao tem antigeno que o receptor nao tem
        boolean igualRegra = true;
        for (int d = 0; d < Q; d++) {
            for (int r = 0; r < Q; r++) {
                String dd = T[d];
                String rr = T[r];
                boolean dA = dd.indexOf('A') >= 0;
                boolean dB = dd.indexOf('B') >= 0;
                boolean dRh = dd.indexOf('+') >= 0;
                boolean rA = rr.indexOf('A') >= 0;
                boolean rB = rr.indexOf('B') >= 0;
                boolean rRh = rr.indexOf('+') >= 0;
                boolean esperado = (!dA || rA) && (!dB || rB) && (!dRh || rRh);
                if (CompatibilidadeAboRh.compativel(dd, rr) != esperado) igualRegra = false;
            }
        }
        verificar(igualRegra, "Matriz confere com a regra de antigenos nos 64 pares");

        verificar(CompatibilidadeAboRh.doadoresCompativeis("AB+").length == 8, "Doadores de AB+: 8 tipos");
        String[] doO = CompatibilidadeAboRh.doadoresCompativeis("O-");
        verificar(doO.length == 1 && doO[0].equals("O-"), "Doadores de O-: so O-");
        verificar(CompatibilidadeAboRh.doadoresCompativeis("A+").length == 4, "Doadores de A+: 4 tipos");
        verificar(CompatibilidadeAboRh.doadoresCompativeis("Z+").length == 0, "Doadores de tipo invalido: 0");
    }

    // -------------------------------------------------------------- FEFO
    static void testarFefo() {
        System.out.println("--- FEFO ---");

        ListaFefo vazia = new ListaFefo();
        verificar(vazia.vazia() && vazia.tamanho() == 0, "Lista FEFO nova esta vazia");
        verificar(vazia.consultarMaisProxima() == null, "Consultar em FEFO vazia devolve false");
        verificar(vazia.removerMaisProxima() == null, "Remover em FEFO vazia devolve false");
        verificar(vazia.descartarVencidos("2026-11-11") == 0, "Descartar vencidas em FEFO vazia devolve 0");

        ListaFefo f = new ListaFefo();
        f.inserirOrdenado(criarBolsa("B1", "O+", "2026-12-01", "HEMO01"));
        f.inserirOrdenado(criarBolsa("B2", "O+", "2026-11-15", "HEMO01"));
        f.inserirOrdenado(criarBolsa("B3", "O+", "2026-11-20", "HEMO01"));
        f.inserirOrdenado(criarBolsa("B4", "O+", "2026-11-10", "HEMO01"));
        verificar(f.tamanho() == 4, "FEFO: tamanho 4 apos quatro insercoes");

        verificar(idsDa(f).equals("B4 B2 B3 B1 "), "FEFO: lista fica ordenada por validade (B4 B2 B3 B1)");

        verificar(f.consultarMaisProxima().getIdBolsa().equals("B4") && f.tamanho() == 4,
                "FEFO: consultar devolve a que vence primeiro sem remover");

        ListaFefo empate = new ListaFefo();
        empate.inserirOrdenado(criarBolsa("E1", "O+", "2026-11-20", "HEMO01"));
        empate.inserirOrdenado(criarBolsa("E2", "O+", "2026-11-20", "HEMO01"));
        empate.inserirOrdenado(criarBolsa("E3", "O+", "2026-11-20", "HEMO01"));
        boolean e1 = empate.removerMaisProxima().getIdBolsa().equals("E1");
        verificar(e1 && empate.removerMaisProxima().getIdBolsa().equals("E2"),
                "FEFO: empate de validade preserva a ordem de chegada");

        verificar(f.removerMaisProxima().getIdBolsa().equals("B4") && f.tamanho() == 3,
                "FEFO: remover tira a que vence primeiro");
        verificar(f.consultarMaisProxima().getIdBolsa().equals("B2"), "FEFO: a proxima a vencer passa a ser B2");

        verificar(f.remover("B3") && f.tamanho() == 2, "FEFO: remover por id no meio");
        verificar(!f.remover("B3"), "FEFO: remover id inexistente devolve false");
        verificar(f.remover("B1") && f.tamanho() == 1, "FEFO: remover por id no fim");
        verificar(f.remover("B2") && f.vazia(), "FEFO: remover por id na cabeca esvazia a lista");

        ListaFefo g = new ListaFefo();
        g.inserirOrdenado(criarBolsa("V1", "A+", "2026-11-05", "HEMO01"));
        g.inserirOrdenado(criarBolsa("V2", "A+", "2026-11-10", "HEMO01"));
        g.inserirOrdenado(criarBolsa("V3", "A+", "2026-11-11", "HEMO01"));
        g.inserirOrdenado(criarBolsa("V4", "A+", "2026-11-20", "HEMO01"));
        verificar(g.descartarVencidos("2026-11-11") == 2 && g.tamanho() == 2,
                "FEFO: descartar vencidas remove so as anteriores a hoje");
        verificar(g.consultarMaisProxima().getIdBolsa().equals("V3"), "FEFO: bolsa que vence hoje NAO e descartada");
        verificar(g.descartarVencidos("2026-11-11") == 0, "FEFO: descartar de novo nao remove nada");
        verificar(g.descartarVencidos("2027-01-01") == 2 && g.vazia(), "FEFO: descartar tudo esvazia a lista");
    }

    // -------------------------------------------------------------- HASH
    static void testarHash() {
        System.out.println("--- Hash ---");
        String[] T = CompatibilidadeAboRh.TIPOS;
        int Q = CompatibilidadeAboRh.QTD_TIPOS;

        IndiceEstoque minimo = new IndiceEstoque(0);
        verificar(minimo.getCapacidade() == 1, "Capacidade 0 vira 1");

        IndiceEstoque vazio = new IndiceEstoque(5);
        verificar(vazio.buscar("O+") == null && vazio.totalBolsas() == 0, "Indice novo: busca devolve nullptr");
        verificar(vazio.funcaoHash("O+") == 2, "funcaoHash(\"O+\") com capacidade 5 vale 2");

        boolean dentroDoIntervalo = true;
        for (int i = 0; i < Q; i++) {
            int h = vazio.funcaoHash(T[i]);
            if (h < 0 || h >= 5) dentroDoIntervalo = false;
        }
        verificar(dentroDoIntervalo, "funcaoHash fica sempre entre 0 e capacidade-1");

        IndiceEstoque idx = new IndiceEstoque(5);
        idx.inserirBolsa(criarBolsa("B1", "O+", "2026-12-01", "HEMO01"));
        idx.inserirBolsa(criarBolsa("B2", "O+", "2026-11-15", "HEMO01"));
        idx.inserirBolsa(criarBolsa("B3", "A-", "2026-11-20", "HEMO01"));
        verificar(idx.buscar("O+") != null && idx.buscar("O+").tamanho() == 2, "Busca O+ acha a lista com 2 bolsas");
        verificar(idx.buscar("A-") != null && idx.buscar("A-").tamanho() == 1, "Busca A- acha a lista com 1 bolsa");
        verificar(idx.buscar("B+") == null, "Busca de tipo sem bolsas devolve nullptr");
        verificar(idx.tiposGuardados() == 2 && idx.totalBolsas() == 3, "2 tipos guardados e 3 bolsas no total");

        verificar(idx.buscar("O+").consultarMaisProxima().getIdBolsa().equals("B2"),
                "Lista do tipo no indice esta em ordem FEFO");

        IndiceEstoque colisao = new IndiceEstoque(1);
        for (int i = 0; i < Q; i++) {
            colisao.inserirBolsa(criarBolsa("C" + i, T[i], "2026-12-01", "HEMO01"));
        }
        verificar(colisao.maiorCadeia() == 8, "Capacidade 1: os 8 tipos colidem na mesma cadeia");
        boolean todosAchados = true;
        for (int i = 0; i < Q; i++) {
            ListaFefo l = colisao.buscar(T[i]);
            if (l == null || l.tamanho() != 1) todosAchados = false;
        }
        verificar(todosAchados, "Com colisao total, todos os tipos continuam sendo encontrados");
        verificar(colisao.totalBolsas() == 8, "Com colisao total, o total de bolsas e 8");

        IndiceEstoque grande = new IndiceEstoque(101);
        for (int i = 0; i < Q; i++) {
            grande.inserirBolsa(criarBolsa("G" + i, T[i], "2026-12-01", "HEMO01"));
        }
        verificar(grande.maiorCadeia() <= 2, "Capacidade 101: cadeias curtas (no maximo 2)");
    }

    // -------------------------------------------------------------- ROTA
    static void testarRota() {
        System.out.println("--- Rota ---");

        Ponto a = new Ponto("A", 0.0, 0.0);
        Ponto b = new Ponto("B", 1.0, 0.0);
        verificar(Math.abs(Roteirizacao.distanciaKm(a, a)) < 0.0001, "Distancia de um ponto a ele mesmo e 0");
        verificar(Math.abs(Roteirizacao.distanciaKm(a, b) - 111.19) < 0.1, "1 grau de latitude vale cerca de 111,19 km");
        verificar(Math.abs(Roteirizacao.distanciaKm(a, b) - Roteirizacao.distanciaKm(b, a)) < 0.0001,
                "Distancia e simetrica");

        Ponto origem = new Ponto("O", 0.0, 0.0);
        Ponto destino = new Ponto("D", 0.0, 0.4);

        RotaResultado rota = Roteirizacao.calcularRota(origem, new Ponto[0], 0, destino);
        verificar(rota != null && rota.qtdPontos == 2 && rota.ordem[0].equals("O") && rota.ordem[1].equals("D"),
                "Rota sem paradas vai direto da origem ao destino");
        verificar(Math.abs(rota.distanciaTotalKm - Roteirizacao.distanciaKm(origem, destino)) < 0.0001,
                "Rota sem paradas: distancia igual a origem-destino");

        Ponto[] paradas = {new Ponto("P3", 0.0, 0.3), new Ponto("P1", 0.0, 0.1), new Ponto("P2", 0.0, 0.2)};
        rota = Roteirizacao.calcularRota(origem, paradas, 3, destino);
        verificar(rotaDe(rota).equals("O P1 P2 P3 D "), "Vizinho mais proximo visita P1, P2, P3 em ordem de proximidade");
        verificar(rota.qtdPontos == 5, "Rota com 3 paradas tem 5 pontos");
        verificar(Math.abs(rota.distanciaTotalKm - Roteirizacao.distanciaKm(origem, destino)) < 0.01,
                "Paradas alinhadas: distancia total igual a linha reta");

        Ponto[] uma = {new Ponto("U", 0.0, 0.1)};
        rota = Roteirizacao.calcularRota(origem, uma, 1, destino);
        double esperado = Roteirizacao.distanciaKm(origem, uma[0]) + Roteirizacao.distanciaKm(uma[0], destino);
        verificar(Math.abs(rota.distanciaTotalKm - esperado) < 0.0001, "Distancia total e a soma dos trechos");

        Ponto[] muitas = new Ponto[Roteirizacao.MAX_PARADAS + 1];
        for (int i = 0; i < muitas.length; i++) muitas[i] = new Ponto("M", 0.0, 0.01 * i);
        verificar(Roteirizacao.calcularRota(origem, muitas, Roteirizacao.MAX_PARADAS + 1, destino) == null,
                "Mais paradas que o maximo devolve false");
        verificar(Roteirizacao.calcularRota(origem, paradas, -1, destino) == null,
                "Numero de paradas negativo devolve false");
    }

    // -------------------------------------------------------- INTEGRACAO
    static void testarIntegracao() {
        System.out.println("--- Integracao ---");

        CentralAlocacao central = new CentralAlocacao();
        verificar(central.adicionarUnidade("HEMO01", -8.0476, -34.8770, 5), "Cadastrar unidade nova devolve true");
        verificar(!central.adicionarUnidade("HEMO01", -8.0, -34.0, 5), "Cadastrar unidade com id repetido devolve false");
        verificar(!central.adicionarBolsa(criarBolsa("X1", "O+", "2026-12-01", "NAOEXISTE")),
                "Bolsa de unidade desconhecida e recusada");
        verificar(!central.adicionarBolsa(criarBolsa("X2", "Z+", "2026-12-01", "HEMO01")),
                "Bolsa com tipo invalido e recusada");
        Bolsa reservada = new Bolsa("X3", "O+", "2026-10-01", "2026-12-01", "HEMO01", "Reservada");
        verificar(!central.adicionarBolsa(reservada), "Bolsa que nao esta Disponivel e recusada");
        verificar(central.totalBolsas() == 0, "Nenhuma bolsa recusada entrou no estoque");

        // Cenario completo (igual ao da demonstracao)
        CentralAlocacao c = new CentralAlocacao();
        montarCentral(c);
        c.adicionarUnidade("H06", -8.0219, -34.9622, 5);
        c.adicionarBolsa(criarBolsa("B101", "O-", "2026-11-20", "HEMO01"));
        c.adicionarBolsa(criarBolsa("B102", "O+", "2026-11-18", "HEMO01"));
        c.adicionarBolsa(criarBolsa("B103", "A+", "2026-12-05", "HEMO01"));
        c.adicionarBolsa(criarBolsa("B104", "O-", "2026-11-05", "HEMO01"));
        c.adicionarBolsa(criarBolsa("B201", "O-", "2026-11-25", "HEMO02"));
        c.adicionarBolsa(criarBolsa("B202", "B-", "2026-11-15", "HEMO02"));
        c.adicionarBolsa(criarBolsa("B203", "O+", "2026-11-30", "HEMO02"));
        c.adicionarBolsa(criarBolsa("B301", "B-", "2026-11-22", "HEMO03"));
        c.adicionarBolsa(criarBolsa("B302", "AB-", "2026-12-10", "HEMO03"));
        c.adicionarBolsa(criarBolsa("B303", "O-", "2026-11-13", "HEMO03"));
        c.adicionarBolsa(criarBolsa("B601", "B-", "2026-11-16", "H06"));
        verificar(c.totalBolsas() == 11, "Cenario: 11 bolsas no estoque");
        verificar(c.estoqueDe("HEMO01", "O-") == 2 && c.estoqueDe("HEMO01", "B+") == 0
                && c.estoqueDe("NAOEXISTE", "O-") == 0, "estoqueDe consulta pelo indice hash");

        ResultadoAlocacao r1 = c.atender(criarPedido("R010", "H03", "HEMO01", "B-", 3), "2026-11-11");
        verificar(r1.atendida && r1.motivo.equals("ok"), "Pedido de 3 B- e atendido");
        verificar(r1.bolsas.tamanho() == 3, "Pedido de 3 devolve 3 bolsas");

        boolean ordemFefo = true;
        No<Bolsa> no = r1.bolsas.primeiro();
        String anterior = "";
        String ids = "";
        boolean todasCompativeis = true;
        boolean todasReservadas = true;
        while (no != null) {
            if (no.dado.getDataValidade().compareTo(anterior) < 0) ordemFefo = false;
            anterior = no.dado.getDataValidade();
            ids += no.dado.getIdBolsa() + " ";
            if (!CompatibilidadeAboRh.compativel(no.dado.getTipoSanguineo(), "B-")) todasCompativeis = false;
            if (!no.dado.getStatus().equals("Reservada")) todasReservadas = false;
            no = no.proximo;
        }
        verificar(todasCompativeis, "Todas as bolsas escolhidas sao compativeis com B-");
        verificar(ordemFefo, "Bolsas escolhidas estao em ordem de validade");
        verificar(ids.equals("B303 B202 B601 "), "FEFO entre tipos e unidades: B303 (O-), B202 (B-), B601 (B-)");
        verificar(todasReservadas, "Bolsas escolhidas ficam com status Reservada");
        verificar(r1.descartadas == 1, "A bolsa vencida B104 foi descartada na busca");
        verificar(c.totalBolsas() == 7, "Estoque: 11 - 1 vencida - 3 reservadas = 7");
        verificar(c.estoqueDe("HEMO03", "O-") == 0 && c.estoqueDe("HEMO02", "B-") == 0,
                "Bolsas reservadas sairam do estoque das unidades");
        verificar(c.estoqueDe("HEMO01", "O-") == 1, "A vencida B104 saiu do estoque, B101 continua");

        verificar(rotaDe(r1.rota).equals("HEMO01 HEMO03 HEMO02 H06 H03 "),
                "Rota sai da fornecedora, passa pelas 3 unidades e chega no solicitante");
        verificar(r1.rota.distanciaTotalKm > 30.7 && r1.rota.distanciaTotalKm < 30.8,
                "Distancia da rota vale cerca de 30,77 km");

        ResultadoAlocacao r2 = c.atender(criarPedido("R011", "H03", "HEMO01", "A+", 2), "2026-11-11");
        verificar(r2.atendida && idsDa(r2.bolsas).equals("B102 B101 "),
                "Pedido de A+ aceita O+ e O-, escolhidas por validade");
        verificar(r2.rota.qtdPontos == 2 && r2.rota.ordem[0].equals("HEMO01") && r2.rota.ordem[1].equals("H03"),
                "Bolsas da propria origem: rota vai direto ao solicitante");

        int antes = c.totalBolsas();
        ResultadoAlocacao r3 = c.atender(criarPedido("R012", "H03", "HEMO01", "AB+", 20), "2026-11-11");
        verificar(!r3.atendida, "Pedido maior que o estoque nao e atendido");
        verificar(c.totalBolsas() == antes && r3.bolsas.vazia(),
                "Pedido nao atendido nao retira nenhuma bolsa (tudo ou nada)");

        ResultadoAlocacao r4 = c.atender(criarPedido("R013", "H03", "HEMO01", "XX", 1), "2026-11-11");
        verificar(!r4.atendida && r4.motivo.equals("tipo sanguineo invalido"), "Pedido com tipo invalido e recusado");
        ResultadoAlocacao r5 = c.atender(criarPedido("R014", "H03", "HEMO01", "O-", 0), "2026-11-11");
        verificar(!r5.atendida && r5.motivo.equals("quantidade invalida"), "Pedido com quantidade 0 e recusado");
        ResultadoAlocacao r6 = c.atender(criarPedido("R015", "H03", "HEMO01", "O-", -2), "2026-11-11");
        verificar(!r6.atendida, "Pedido com quantidade negativa e recusado");
        ResultadoAlocacao r7 = c.atender(criarPedido("R016", "NAOEXISTE", "HEMO01", "O-", 1), "2026-11-11");
        verificar(!r7.atendida && r7.motivo.equals("unidade desconhecida"), "Pedido de unidade desconhecida e recusado");

        // Incompatibilidade: so existe A+ no estoque, o pedido e de B-
        CentralAlocacao inc = new CentralAlocacao();
        montarCentral(inc);
        inc.adicionarBolsa(criarBolsa("I1", "A+", "2026-12-01", "HEMO01"));
        inc.adicionarBolsa(criarBolsa("I2", "AB+", "2026-12-01", "HEMO02"));
        inc.adicionarBolsa(criarBolsa("I3", "O+", "2026-12-01", "HEMO03"));
        ResultadoAlocacao ri = inc.atender(criarPedido("R020", "H03", "HEMO01", "B-", 1), "2026-11-11");
        verificar(!ri.atendida && inc.totalBolsas() == 3,
                "Receptor B-: estoque so com A+, AB+ e O+ (incompativeis) nao atende");
        ResultadoAlocacao ri2 = inc.atender(criarPedido("R021", "H03", "HEMO01", "O-", 1), "2026-11-11");
        verificar(!ri2.atendida, "Receptor O-: so recebe O-, estoque sem O- nao atende");
        ResultadoAlocacao ri3 = inc.atender(criarPedido("R022", "H03", "HEMO01", "AB+", 3), "2026-11-11");
        verificar(ri3.atendida && ri3.bolsas.tamanho() == 3, "Receptor AB+: recebe A+, AB+ e O+ do estoque");

        // Vencidas nunca sao alocadas
        CentralAlocacao venc = new CentralAlocacao();
        montarCentral(venc);
        venc.adicionarBolsa(criarBolsa("V1", "O-", "2026-11-01", "HEMO01"));
        venc.adicionarBolsa(criarBolsa("V2", "O-", "2026-11-10", "HEMO02"));
        ResultadoAlocacao rv = venc.atender(criarPedido("R030", "H03", "HEMO01", "O-", 1), "2026-11-11");
        verificar(!rv.atendida && rv.descartadas == 2,
                "Estoque so com bolsas vencidas: pedido nao e atendido e 2 sao descartadas");
        verificar(venc.totalBolsas() == 0, "As bolsas vencidas sairam do estoque");

        // A unidade solicitante nao e fonte
        CentralAlocacao proprio = new CentralAlocacao();
        montarCentral(proprio);
        proprio.adicionarBolsa(criarBolsa("P1", "O-", "2026-12-01", "H03"));
        ResultadoAlocacao rp = proprio.atender(criarPedido("R040", "H03", "HEMO01", "O-", 1), "2026-11-11");
        verificar(!rp.atendida, "Bolsas da propria unidade solicitante nao sao usadas");

        // Empate de validade: vence a primeira unidade cadastrada
        CentralAlocacao emp = new CentralAlocacao();
        montarCentral(emp);
        emp.adicionarBolsa(criarBolsa("T2", "O-", "2026-12-01", "HEMO02"));
        emp.adicionarBolsa(criarBolsa("T1", "O-", "2026-12-01", "HEMO01"));
        ResultadoAlocacao re = emp.atender(criarPedido("R050", "H03", "HEMO03", "O-", 1), "2026-11-11");
        verificar(re.bolsas.primeiro().dado.getIdBolsa().equals("T1"),
                "Empate de validade: escolhe a lista da primeira unidade cadastrada");
        verificar(re.rota.qtdPontos == 3 && re.rota.ordem[0].equals("HEMO03") && re.rota.ordem[1].equals("HEMO01")
                && re.rota.ordem[2].equals("H03"), "Rota: origem HEMO03, parada HEMO01, destino H03");

        // Um pedido nao reaproveita bolsa ja reservada
        CentralAlocacao uma = new CentralAlocacao();
        montarCentral(uma);
        uma.adicionarBolsa(criarBolsa("U1", "O-", "2026-12-01", "HEMO01"));
        boolean primeiro = uma.atender(criarPedido("R060", "H03", "HEMO01", "O-", 1), "2026-11-11").atendida;
        boolean segundo = uma.atender(criarPedido("R061", "H03", "HEMO01", "O-", 1), "2026-11-11").atendida;
        verificar(primeiro && !segundo, "A mesma bolsa nao atende dois pedidos");
    }

    public static void main(String[] args) {
        testarMatriz();
        testarFefo();
        testarHash();
        testarRota();
        testarIntegracao();

        System.out.println();
        System.out.println(passaram + " de " + total + " testes passaram.");
        if (passaram != total) System.exit(1);
    }
}
