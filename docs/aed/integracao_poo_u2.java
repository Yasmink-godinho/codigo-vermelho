// U2 - Matriz ABO/Rh, FEFO, indice hash, rota por vizinho mais proximo e a
// alocacao integrada, reimplementados em Java SEM colecao pronta
// (nada de java.util: so nos, referencias e vetores).
// Cada classe segue o mesmo algoritmo do header C++ de mesmo assunto:
//   CompatibilidadeAboRh  <-> compatibilidade_abo_rh.h
//   ListaFefo             <-> fefo_lista_ordenada.h
//   IndiceEstoque         <-> indice_estoque_hash.h
//   Roteirizacao          <-> roteirizacao_vizinho_mais_proximo.h
//   CentralAlocacao       <-> alocacao_integrada.h
// Reaproveita Bolsa, Requisicao e No<T> da U1 (conexao_poo_PI3E2-94.java).
//
// Integracao com a aplicacao POO: CentralAlocacao nao tem dependencia fixa
// (nada estatico, sem Spring, sem arquivo, sem banco). Uma classe @Service
// pode receber ou criar uma CentralAlocacao e chamar atender(). Essa ligacao
// ainda NAO foi feita no backend: estes arquivos compilam com javac, fora do
// Maven.
//
// Compilar: javac conexao_poo_PI3E2-94.java integracao_poo_u2.java TestesU2.java
// Demo:     java DemonstracaoU2
// Testes:   java TestesU2

import java.util.Locale;

// ======================================================================
// MATRIZ ABO/Rh. Linha = doador, coluna = receptor. 1 = compativel.
// ======================================================================
class CompatibilidadeAboRh {
    static final int QTD_TIPOS = 8;

    // A ordem deste vetor define as linhas e colunas da matriz.
    static final String[] TIPOS = {"O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"};

    //                                        receptor: O-  O+  A-  A+  B-  B+ AB- AB+
    static final int[][] MATRIZ = {
        /* doador O-  */ {1, 1, 1, 1, 1, 1, 1, 1},
        /* doador O+  */ {0, 1, 0, 1, 0, 1, 0, 1},
        /* doador A-  */ {0, 0, 1, 1, 0, 0, 1, 1},
        /* doador A+  */ {0, 0, 0, 1, 0, 0, 0, 1},
        /* doador B-  */ {0, 0, 0, 0, 1, 1, 1, 1},
        /* doador B+  */ {0, 0, 0, 0, 0, 1, 0, 1},
        /* doador AB- */ {0, 0, 0, 0, 0, 0, 1, 1},
        /* doador AB+ */ {0, 0, 0, 0, 0, 0, 0, 1}
    };

    // Devolve a posicao do tipo em TIPOS, ou -1 se o tipo nao existe.
    static int indiceDoTipo(String tipo) {
        for (int i = 0; i < QTD_TIPOS; i++) {
            if (TIPOS[i].equals(tipo)) return i;
        }
        return -1;
    }

    // true se o doador pode doar para o receptor. Tipo invalido devolve false.
    static boolean compativel(String doador, String receptor) {
        int d = indiceDoTipo(doador);
        int r = indiceDoTipo(receptor);
        if (d == -1 || r == -1) return false;
        return MATRIZ[d][r] == 1;
    }

    // Tipos que podem doar para o receptor. Receptor invalido devolve vetor vazio.
    // (No C++ o vetor vem por parametro e a funcao devolve a quantidade.)
    static String[] doadoresCompativeis(String receptor) {
        int r = indiceDoTipo(receptor);
        if (r == -1) return new String[0];
        int n = 0;
        for (int d = 0; d < QTD_TIPOS; d++) {
            if (MATRIZ[d][r] == 1) n++;
        }
        String[] saida = new String[n];
        int pos = 0;
        for (int d = 0; d < QTD_TIPOS; d++) {
            if (MATRIZ[d][r] == 1) {
                saida[pos] = TIPOS[d];
                pos++;
            }
        }
        return saida;
    }
}

// ======================================================================
// FEFO: lista encadeada ordenada pela data de validade (No<Bolsa> da U1).
// Complexidade: inserirOrdenado O(n); consultar/remover mais proxima O(1);
// descartarVencidos O(v).
// ======================================================================
class ListaFefo {
    private No<Bolsa> inicio;
    private int qtd;

    public ListaFefo() {
        inicio = null;
        qtd = 0;
    }

    // Insere mantendo a ordem por dataValidade. Em empate, a nova fica
    // DEPOIS das que ja estavam. Datas AAAA-MM-DD: compareTo = ordem das datas.
    public void inserirOrdenado(Bolsa nova) {
        No<Bolsa> novo = new No<>(nova);
        No<Bolsa> atual = inicio;
        No<Bolsa> anterior = null;
        while (atual != null && atual.dado.getDataValidade().compareTo(nova.getDataValidade()) <= 0) {
            anterior = atual;
            atual = atual.proximo;
        }
        novo.proximo = atual;
        if (anterior == null) inicio = novo;
        else anterior.proximo = novo;
        qtd++;
    }

    // Bolsa que vence primeiro, sem remover. null se a lista esta vazia.
    public Bolsa consultarMaisProxima() {
        if (inicio == null) return null;
        return inicio.dado;
    }

    // Remove a bolsa que vence primeiro. null se a lista esta vazia.
    public Bolsa removerMaisProxima() {
        if (inicio == null) return null;
        Bolsa removida = inicio.dado;
        inicio = inicio.proximo;
        qtd--;
        return removida;
    }

    // Remove pelo id (igual ao ListaBolsas da U1).
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
        return false;
    }

    // Descarta as bolsas com validade ANTERIOR a "hoje" e devolve quantas foram.
    public int descartarVencidos(String hoje) {
        int descartadas = 0;
        while (inicio != null && inicio.dado.getDataValidade().compareTo(hoje) < 0) {
            inicio = inicio.proximo;
            qtd--;
            descartadas++;
        }
        return descartadas;
    }

    // Primeiro no da lista, para percorrer sem remover.
    public No<Bolsa> primeiro() { return inicio; }

    public int tamanho() { return qtd; }

    public boolean vazia() { return inicio == null; }

    public void listar() {
        No<Bolsa> atual = inicio;
        while (atual != null) {
            System.out.println(atual.dado.getIdBolsa() + " - " + atual.dado.getTipoSanguineo()
                    + " - validade " + atual.dado.getDataValidade());
            atual = atual.proximo;
        }
    }

    public void liberar() {
        inicio = null;
        qtd = 0;
    }
}

// ======================================================================
// INDICE HASH (encadeamento separado). Chave: tipo sanguineo.
// h = (h * 31 + caractere) % capacidade.
// Complexidade: buscar/inserir O(1 + alfa) em media, O(n) no pior caso.
// ======================================================================
class NoIndice {
    String tipo;
    ListaFefo lista;
    NoIndice proximo;

    NoIndice(String tipo) {
        this.tipo = tipo;
        this.lista = new ListaFefo();
        this.proximo = null;
    }
}

class IndiceEstoque {
    private NoIndice[] tabela;
    private int capacidade;
    private int qtdTipos;

    public IndiceEstoque(int cap) {
        if (cap <= 0) cap = 1;
        capacidade = cap;
        qtdTipos = 0;
        tabela = new NoIndice[capacidade];
    }

    public int funcaoHash(String tipo) {
        int h = 0;
        for (int i = 0; i < tipo.length(); i++) {
            h = (h * 31 + tipo.charAt(i)) % capacidade;
        }
        return h;
    }

    // Lista FEFO do tipo, ou null se o tipo nao esta no indice.
    public ListaFefo buscar(String tipo) {
        NoIndice atual = tabela[funcaoHash(tipo)];
        while (atual != null) {
            if (atual.tipo.equals(tipo)) return atual.lista;
            atual = atual.proximo;
        }
        return null;
    }

    public void inserirBolsa(Bolsa b) {
        ListaFefo lista = buscar(b.getTipoSanguineo());
        if (lista == null) {
            int pos = funcaoHash(b.getTipoSanguineo());
            NoIndice novo = new NoIndice(b.getTipoSanguineo());
            novo.proximo = tabela[pos];
            tabela[pos] = novo;
            qtdTipos++;
            lista = novo.lista;
        }
        lista.inserirOrdenado(b);
    }

    public int totalBolsas() {
        int total = 0;
        for (int i = 0; i < capacidade; i++) {
            NoIndice atual = tabela[i];
            while (atual != null) {
                total += atual.lista.tamanho();
                atual = atual.proximo;
            }
        }
        return total;
    }

    public int tiposGuardados() { return qtdTipos; }

    public int getCapacidade() { return capacidade; }

    public int maiorCadeia() {
        int maior = 0;
        for (int i = 0; i < capacidade; i++) {
            int tam = 0;
            NoIndice atual = tabela[i];
            while (atual != null) {
                tam++;
                atual = atual.proximo;
            }
            if (tam > maior) maior = tam;
        }
        return maior;
    }
}

// ======================================================================
// ROTEIRIZACAO: vizinho mais proximo + Haversine. Complexidade O(k^2).
// ======================================================================
class Ponto {
    private final String id;
    private final double latitude;
    private final double longitude;

    public Ponto(String id, double latitude, double longitude) {
        this.id = id;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getId() { return id; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
}

class RotaResultado {
    String[] ordem = new String[Roteirizacao.MAX_PARADAS + 2]; // origem, paradas, destino
    int qtdPontos = 0;
    double distanciaTotalKm = 0;
}

class Roteirizacao {
    static final int MAX_PARADAS = 20;

    static double distanciaKm(Ponto a, Ponto b) {
        final double RAIO_TERRA_KM = 6371.0;
        final double GRAU = 3.14159265358979323846 / 180.0;
        double dLat = (b.getLatitude() - a.getLatitude()) * GRAU;
        double dLon = (b.getLongitude() - a.getLongitude()) * GRAU;
        double x = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(a.getLatitude() * GRAU) * Math.cos(b.getLatitude() * GRAU)
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
        return RAIO_TERRA_KM * c;
    }

    // Rota origem -> paradas (vizinho mais proximo) -> destino.
    // Devolve null se k for negativo ou maior que MAX_PARADAS
    // (no C++ devolve false e preenche o parametro de saida).
    static RotaResultado calcularRota(Ponto origem, Ponto[] paradas, int k, Ponto destino) {
        if (k < 0 || k > MAX_PARADAS) return null;

        boolean[] visitada = new boolean[MAX_PARADAS];
        RotaResultado rota = new RotaResultado();
        rota.ordem[rota.qtdPontos] = origem.getId();
        rota.qtdPontos++;

        Ponto atual = origem;
        for (int rodada = 0; rodada < k; rodada++) {
            int melhor = -1;
            double menorDistancia = 0;
            for (int i = 0; i < k; i++) {
                if (visitada[i]) continue;
                double d = distanciaKm(atual, paradas[i]);
                if (melhor == -1 || d < menorDistancia) {
                    melhor = i;
                    menorDistancia = d;
                }
            }
            visitada[melhor] = true;
            rota.distanciaTotalKm += menorDistancia;
            rota.ordem[rota.qtdPontos] = paradas[melhor].getId();
            rota.qtdPontos++;
            atual = paradas[melhor];
        }

        rota.distanciaTotalKm += distanciaKm(atual, destino);
        rota.ordem[rota.qtdPontos] = destino.getId();
        rota.qtdPontos++;
        return rota;
    }
}

// ======================================================================
// ALOCACAO INTEGRADA: matriz + hash + FEFO + rota.
// Complexidade: O(U*C + v + q*K + q^2 + k^2). Detalhes em alocacao_integrada.h.
// ======================================================================
class UnidadeEstoque {
    Ponto local;
    IndiceEstoque indice;

    UnidadeEstoque(Ponto local, IndiceEstoque indice) {
        this.local = local;
        this.indice = indice;
    }
}

// No C++ este resultado e preenchido por parametro (a ListaFefo nao pode ser
// copiada). Em Java o metodo atender() devolve o objeto.
class ResultadoAlocacao {
    boolean atendida = false;
    String motivo = "";
    int descartadas = 0;
    ListaFefo bolsas = new ListaFefo();
    RotaResultado rota = new RotaResultado();
}

class CentralAlocacao {
    static final int MAX_UNIDADES = 20;
    static final int MAX_LISTAS = MAX_UNIDADES * CompatibilidadeAboRh.QTD_TIPOS;

    private UnidadeEstoque[] unidades = new UnidadeEstoque[MAX_UNIDADES];
    private int qtdUnidades = 0;

    private int posicaoDaUnidade(String idUnidade) {
        for (int i = 0; i < qtdUnidades; i++) {
            if (unidades[i].local.getId().equals(idUnidade)) return i;
        }
        return -1;
    }

    public boolean adicionarUnidade(String id, double latitude, double longitude, int capacidadeHash) {
        if (qtdUnidades >= MAX_UNIDADES) return false;
        if (posicaoDaUnidade(id) != -1) return false;
        unidades[qtdUnidades] = new UnidadeEstoque(new Ponto(id, latitude, longitude),
                                                   new IndiceEstoque(capacidadeHash));
        qtdUnidades++;
        return true;
    }

    // Recusa: unidade desconhecida, tipo invalido ou status diferente de "Disponivel".
    public boolean adicionarBolsa(Bolsa b) {
        int pos = posicaoDaUnidade(b.getIdUnidadeAtual());
        if (pos == -1) return false;
        if (CompatibilidadeAboRh.indiceDoTipo(b.getTipoSanguineo()) == -1) return false;
        if (!b.getStatus().equals("Disponivel")) return false;
        unidades[pos].indice.inserirBolsa(b);
        return true;
    }

    public int estoqueDe(String idUnidade, String tipo) {
        int pos = posicaoDaUnidade(idUnidade);
        if (pos == -1) return 0;
        ListaFefo lista = unidades[pos].indice.buscar(tipo);
        if (lista == null) return 0;
        return lista.tamanho();
    }

    public int totalBolsas() {
        int total = 0;
        for (int i = 0; i < qtdUnidades; i++) total += unidades[i].indice.totalBolsas();
        return total;
    }

    // Atende um pedido. "hoje" no formato AAAA-MM-DD.
    // A rota sai de idUnidadeFornecedora, passa pelas unidades que tem as
    // bolsas e termina em idUnidadeSolicitante.
    public ResultadoAlocacao atender(Requisicao pedido, String hoje) {
        ResultadoAlocacao resultado = new ResultadoAlocacao();

        // Validacoes
        if (pedido.getQuantidadeSolicitada() <= 0) {
            resultado.motivo = "quantidade invalida";
            return resultado;
        }
        if (CompatibilidadeAboRh.indiceDoTipo(pedido.getTipoSanguineoSolicitado()) == -1) {
            resultado.motivo = "tipo sanguineo invalido";
            return resultado;
        }
        int posSolicitante = posicaoDaUnidade(pedido.getIdUnidadeSolicitante());
        int posOrigem = posicaoDaUnidade(pedido.getIdUnidadeFornecedora());
        if (posSolicitante == -1 || posOrigem == -1) {
            resultado.motivo = "unidade desconhecida";
            return resultado;
        }

        // 1. Matriz: tipos que podem doar para o tipo pedido
        String[] doadores = CompatibilidadeAboRh.doadoresCompativeis(pedido.getTipoSanguineoSolicitado());

        // 2. Hash: lista FEFO de cada (unidade, tipo compativel). A unidade
        // que esta pedindo nao entra como fonte.
        ListaFefo[] listas = new ListaFefo[MAX_LISTAS];
        int qtdListas = 0;
        int disponiveis = 0;
        for (int u = 0; u < qtdUnidades; u++) {
            if (u == posSolicitante) continue;
            for (int t = 0; t < doadores.length; t++) {
                ListaFefo lista = unidades[u].indice.buscar(doadores[t]);
                if (lista == null) continue;
                resultado.descartadas += lista.descartarVencidos(hoje);
                if (lista.vazia()) continue;
                listas[qtdListas] = lista;
                qtdListas++;
                disponiveis += lista.tamanho();
            }
        }

        // Tudo ou nada
        if (disponiveis < pedido.getQuantidadeSolicitada()) {
            resultado.motivo = "estoque compativel insuficiente: ha " + disponiveis
                             + ", pedido " + pedido.getQuantidadeSolicitada();
            return resultado;
        }

        // 3. FEFO entre as listas: a cada rodada, a lista com a bolsa de menor
        // validade na frente. Em empate, a primeira lista encontrada.
        @SuppressWarnings("unchecked")
        No<Bolsa>[] cabeca = (No<Bolsa>[]) new No[MAX_LISTAS];
        int[] retiradas = new int[MAX_LISTAS];
        for (int i = 0; i < qtdListas; i++) {
            cabeca[i] = listas[i].primeiro();
            retiradas[i] = 0;
        }
        for (int n = 0; n < pedido.getQuantidadeSolicitada(); n++) {
            int melhor = -1;
            for (int i = 0; i < qtdListas; i++) {
                if (cabeca[i] == null) continue;
                if (melhor == -1 || cabeca[i].dado.getDataValidade().compareTo(
                        cabeca[melhor].dado.getDataValidade()) < 0) {
                    melhor = i;
                }
            }
            Bolsa o = cabeca[melhor].dado;
            Bolsa escolhida = new Bolsa(o.getIdBolsa(), o.getTipoSanguineo(), o.getDataColeta(),
                                        o.getDataValidade(), o.getIdUnidadeAtual(), "Reservada");
            resultado.bolsas.inserirOrdenado(escolhida);
            cabeca[melhor] = cabeca[melhor].proximo;
            retiradas[melhor]++;
        }

        // Retira do estoque as bolsas escolhidas (sempre as primeiras de cada lista)
        for (int i = 0; i < qtdListas; i++) {
            for (int r = 0; r < retiradas[i]; r++) listas[i].removerMaisProxima();
        }

        // 4. Rota: unidades distintas que fornecem bolsas. A propria origem
        // nao vira parada.
        Ponto[] paradas = new Ponto[Roteirizacao.MAX_PARADAS];
        int k = 0;
        No<Bolsa> atual = resultado.bolsas.primeiro();
        while (atual != null) {
            int pos = posicaoDaUnidade(atual.dado.getIdUnidadeAtual());
            boolean jaTem = (pos == posOrigem);
            if (!jaTem) {
                for (int i = 0; i < k; i++) {
                    if (paradas[i].getId().equals(unidades[pos].local.getId())) jaTem = true;
                }
            }
            if (!jaTem) {
                paradas[k] = unidades[pos].local;
                k++;
            }
            atual = atual.proximo;
        }
        resultado.rota = Roteirizacao.calcularRota(unidades[posOrigem].local, paradas, k,
                                                   unidades[posSolicitante].local);

        resultado.atendida = true;
        resultado.motivo = "ok";
        return resultado;
    }
}

// ======================================================================
// Demonstracao: mesma saida do demo_u2.cpp
// ======================================================================
class DemonstracaoU2 {
    static String dois(double v) {
        return String.format(Locale.US, "%.2f", v);
    }

    static void imprimirResultado(Requisicao pedido, ResultadoAlocacao r) {
        System.out.println("Pedido " + pedido.getIdRequisicao() + ": " + pedido.getQuantidadeSolicitada()
                + " bolsa(s) " + pedido.getTipoSanguineoSolicitado()
                + " para " + pedido.getIdUnidadeSolicitante());
        System.out.println("  Atendido: " + (r.atendida ? "sim" : "nao") + " (" + r.motivo + ")");
        System.out.println("  Vencidas descartadas: " + r.descartadas);
        if (!r.atendida) return;
        No<Bolsa> atual = r.bolsas.primeiro();
        while (atual != null) {
            System.out.println("  Bolsa " + atual.dado.getIdBolsa() + " (" + atual.dado.getTipoSanguineo()
                    + ", vence " + atual.dado.getDataValidade() + ") de " + atual.dado.getIdUnidadeAtual());
            atual = atual.proximo;
        }
        StringBuilder linha = new StringBuilder("  Rota:");
        for (int i = 0; i < r.rota.qtdPontos; i++) {
            linha.append(i == 0 ? " " : " -> ").append(r.rota.ordem[i]);
        }
        System.out.println(linha);
        System.out.println("  Distancia total: " + dois(r.rota.distanciaTotalKm) + " km");
    }

    public static void main(String[] args) {
        // ---------------- 1. Matriz ABO/Rh
        System.out.println("=== 1. Matriz ABO/Rh ===");
        System.out.println("O- doa para AB+: " + (CompatibilidadeAboRh.compativel("O-", "AB+") ? "sim" : "nao"));
        System.out.println("A+ doa para O-: " + (CompatibilidadeAboRh.compativel("A+", "O-") ? "sim" : "nao"));
        System.out.println("A- doa para A+: " + (CompatibilidadeAboRh.compativel("A-", "A+") ? "sim" : "nao"));
        System.out.println("A+ doa para A-: " + (CompatibilidadeAboRh.compativel("A+", "A-") ? "sim" : "nao"));
        String[] doadores = CompatibilidadeAboRh.doadoresCompativeis("B-");
        StringBuilder linhaDoadores = new StringBuilder("Doadores compativeis com B-:");
        for (int i = 0; i < doadores.length; i++) linhaDoadores.append(" ").append(doadores[i]);
        System.out.println(linhaDoadores);

        // ---------------- 2. FEFO
        System.out.println("=== 2. FEFO (lista ordenada por validade) ===");
        ListaFefo fefo = new ListaFefo();
        fefo.inserirOrdenado(new Bolsa("B501", "O+", "2026-10-01", "2026-12-01", "HEMO01", "Disponivel"));
        fefo.inserirOrdenado(new Bolsa("B502", "O+", "2026-10-02", "2026-11-15", "HEMO01", "Disponivel"));
        fefo.inserirOrdenado(new Bolsa("B503", "O+", "2026-10-03", "2026-11-20", "HEMO01", "Disponivel"));
        fefo.listar();
        System.out.println("Proxima a vencer: " + fefo.consultarMaisProxima().getIdBolsa());

        // ---------------- 3. Indice hash
        System.out.println("=== 3. Indice hash ===");
        IndiceEstoque indice = new IndiceEstoque(5);
        String[] todos = {"O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"};
        for (int i = 0; i < CompatibilidadeAboRh.QTD_TIPOS; i++) {
            indice.inserirBolsa(new Bolsa("X" + i, todos[i], "2026-10-01", "2026-12-01", "HEMO01", "Disponivel"));
        }
        System.out.println("Tipos guardados: " + indice.tiposGuardados());
        System.out.println("Capacidade: " + indice.getCapacidade());
        System.out.println("Maior cadeia (colisoes): " + indice.maiorCadeia());
        System.out.println("Busca A+: " + (indice.buscar("A+") != null ? "achou" : "nao achou"));

        // ---------------- 4. Rota
        System.out.println("=== 4. Rota (vizinho mais proximo) ===");
        Ponto origem = new Ponto("HEMO01", -8.0476, -34.8770);
        Ponto[] paradas = {
            new Ponto("HEMO02", -8.0993, -34.9448),
            new Ponto("HEMO03", -8.0631, -34.8711),
            new Ponto("H06", -8.0219, -34.9622)
        };
        Ponto destino = new Ponto("H03", -7.9948, -34.8656);
        RotaResultado rota = Roteirizacao.calcularRota(origem, paradas, 3, destino);
        StringBuilder linhaRota = new StringBuilder("Rota:");
        for (int i = 0; i < rota.qtdPontos; i++) linhaRota.append(i == 0 ? " " : " -> ").append(rota.ordem[i]);
        System.out.println(linhaRota);
        System.out.println("Distancia total: " + dois(rota.distanciaTotalKm) + " km");

        // ---------------- 5. Integracao
        System.out.println("=== 5. Pedido integrado (matriz + hash + FEFO + rota) ===");
        CentralAlocacao central = new CentralAlocacao();
        central.adicionarUnidade("HEMO01", -8.0476, -34.8770, 5);
        central.adicionarUnidade("HEMO02", -8.0993, -34.9448, 5);
        central.adicionarUnidade("HEMO03", -8.0631, -34.8711, 5);
        central.adicionarUnidade("H06", -8.0219, -34.9622, 5);
        central.adicionarUnidade("H03", -7.9948, -34.8656, 5);

        central.adicionarBolsa(new Bolsa("B101", "O-", "2026-10-01", "2026-11-20", "HEMO01", "Disponivel"));
        central.adicionarBolsa(new Bolsa("B102", "O+", "2026-10-02", "2026-11-18", "HEMO01", "Disponivel"));
        central.adicionarBolsa(new Bolsa("B103", "A+", "2026-10-03", "2026-12-05", "HEMO01", "Disponivel"));
        central.adicionarBolsa(new Bolsa("B104", "O-", "2026-09-20", "2026-11-05", "HEMO01", "Disponivel"));
        central.adicionarBolsa(new Bolsa("B201", "O-", "2026-10-05", "2026-11-25", "HEMO02", "Disponivel"));
        central.adicionarBolsa(new Bolsa("B202", "B-", "2026-10-06", "2026-11-15", "HEMO02", "Disponivel"));
        central.adicionarBolsa(new Bolsa("B203", "O+", "2026-10-07", "2026-11-30", "HEMO02", "Disponivel"));
        central.adicionarBolsa(new Bolsa("B301", "B-", "2026-10-08", "2026-11-22", "HEMO03", "Disponivel"));
        central.adicionarBolsa(new Bolsa("B302", "AB-", "2026-10-09", "2026-12-10", "HEMO03", "Disponivel"));
        central.adicionarBolsa(new Bolsa("B303", "O-", "2026-10-10", "2026-11-13", "HEMO03", "Disponivel"));
        central.adicionarBolsa(new Bolsa("B601", "B-", "2026-10-11", "2026-11-16", "H06", "Disponivel"));
        System.out.println("Bolsas em estoque: " + central.totalBolsas());

        String hoje = "2026-11-11";

        Requisicao r1 = new Requisicao("R010", "H03", "HEMO01", "B-", 3, "2026-11-11", "Pendente");
        imprimirResultado(r1, central.atender(r1, hoje));

        Requisicao r2 = new Requisicao("R011", "H03", "HEMO01", "A+", 2, "2026-11-11", "Pendente");
        imprimirResultado(r2, central.atender(r2, hoje));

        Requisicao r3 = new Requisicao("R012", "H03", "HEMO01", "AB+", 20, "2026-11-11", "Pendente");
        imprimirResultado(r3, central.atender(r3, hoje));

        Requisicao r4 = new Requisicao("R013", "H03", "HEMO01", "XX", 1, "2026-11-11", "Pendente");
        imprimirResultado(r4, central.atender(r4, hoje));

        System.out.println("Bolsas em estoque ao final: " + central.totalBolsas());
    }
}
