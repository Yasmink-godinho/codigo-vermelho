package com.codigovermelho.services;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.Deque;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * US10 — monitoramento de desempenho e saude dos endpoints.
 *
 * Mede TRAFEGO REAL da API (nada simulado): cada requisicao a /api/v1/** e
 * registrada pelo MonitoramentoRedeFiltro e agregada numa janela deslizante.
 *
 * Regras:
 *  - erro = resposta HTTP 5xx (4xx e erro do cliente, nao do endpoint);
 *  - INDISPONIVEL: as {@value #SEQUENCIA_PARA_INDISPONIVEL} ultimas respostas do endpoint foram 5xx;
 *  - DEGRADADO: taxa de erro na janela acima de {@value #LIMITE_TAXA_ERRO}%;
 *  - SEM_DADOS: endpoint sem trafego na janela (nao e tratado como saudavel nem como falho);
 *  - uptime = tempo desde o inicio do processo da API.
 *  - sondas ativas (SondaSaude) ficam em armazenamento SEPARADO: nao entram em requisicoes, latencia,
 *    throughput nem taxa de erro (metricas reais). Servem apenas para classificar o status quando
 *    nao ha trafego ou quando a sonda detecta falha; vale o PIOR entre trafego e sonda.
 * Classe sem Spring: testavel com Clock controlado.
 */
public class MonitoramentoRede {

    public enum Status { OPERACIONAL, DEGRADADO, INDISPONIVEL, SEM_DADOS }

    public static final double LIMITE_TAXA_ERRO = 5.0;
    public static final int SEQUENCIA_PARA_INDISPONIVEL = 3;
    private static final int MAX_AMOSTRAS_POR_ENDPOINT = 5000;

    private record Amostra(Instant instante, double latenciaMs, boolean erro) {
    }

    public enum Origem { NENHUMA, TRAFEGO, SONDA, TRAFEGO_E_SONDA }

    public record EndpointStatus(String metodo, String caminho, boolean critico, Status status,
                                 long requisicoes, long erros, double latenciaMediaMs,
                                 double taxaErroPercentual, Instant ultimaAmostra,
                                 Origem origem, long sondas, long errosSonda, Instant ultimaSonda) {
        public boolean alerta() {
            return status == Status.DEGRADADO || status == Status.INDISPONIVEL;
        }
    }

    public record Resumo(Instant geradoEm, Instant iniciadoEm, long uptimeSegundos, long janelaSegundos,
                         long requisicoes, long erros, double latenciaMediaMs, double throughputPorSegundo,
                         double taxaErroPercentual, Status statusGeral, List<EndpointStatus> endpoints) {
    }

    private final Clock clock;
    private final Instant iniciadoEm;
    private final Duration janela;
    private final Set<String> criticos = new LinkedHashSet<>();
    private final ConcurrentMap<String, Deque<Amostra>> amostras = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Deque<Amostra>> sondas = new ConcurrentHashMap<>();

    /** criticos no formato "GET /api/v1/requisicoes" (caminho = padrao da rota, ex: /api/v1/transferencias/{id}). */
    public MonitoramentoRede(Clock clock, Instant iniciadoEm, Duration janela, Collection<String> criticos) {
        if (janela == null || janela.isZero() || janela.isNegative()) {
            throw new IllegalArgumentException("Janela de monitoramento deve ser positiva");
        }
        this.clock = clock;
        this.iniciadoEm = iniciadoEm;
        this.janela = janela;
        for (String c : criticos) {
            if (c != null && !c.isBlank()) {
                this.criticos.add(normalizarCritico(c));
            }
        }
    }

    /** Aceita somente "METODO /caminho" (ex: "GET /api/v1/requisicoes"); qualquer outra forma e erro de configuracao. */
    static String normalizarCritico(String bruto) {
        String[] p = bruto.trim().split("\\s+");
        if (p.length != 2 || !p[0].matches("(?i)GET|POST|PUT|PATCH|DELETE|HEAD") || !p[1].startsWith("/")) {
            throw new IllegalArgumentException("Endpoint critico invalido: '" + bruto.trim()
                    + "'. Use o formato 'METODO /caminho', ex: 'GET /api/v1/requisicoes'");
        }
        return chave(p[0], p[1]);
    }

    public Set<String> endpointsCriticos() {
        return Set.copyOf(criticos);
    }

    /** Resultado de uma sonda ativa. httpStatus <= 0 = sem resposta (conexao recusada, timeout). Falha = sem resposta ou 5xx. */
    public void registrarSonda(String metodo, String caminho, long latenciaNanos, int httpStatus) {
        Deque<Amostra> fila = sondas.computeIfAbsent(chave(metodo, caminho), k -> new ArrayDeque<>());
        Instant agora = clock.instant();
        synchronized (fila) {
            fila.addLast(new Amostra(agora, latenciaNanos / 1_000_000.0, httpStatus <= 0 || httpStatus >= 500));
            podar(fila, agora);
        }
    }

    public void registrar(String metodo, String caminho, long latenciaNanos, int httpStatus) {
        Deque<Amostra> fila = amostras.computeIfAbsent(chave(metodo, caminho), k -> new ArrayDeque<>());
        Instant agora = clock.instant();
        synchronized (fila) {
            fila.addLast(new Amostra(agora, latenciaNanos / 1_000_000.0, httpStatus >= 500));
            podar(fila, agora);
        }
    }

    public Resumo resumir() {
        Instant agora = clock.instant();
        Set<String> chaves = new LinkedHashSet<>(criticos);
        chaves.addAll(amostras.keySet());
        chaves.addAll(sondas.keySet());

        List<EndpointStatus> endpoints = new ArrayList<>();
        long total = 0;
        long totalErros = 0;
        double somaLatencia = 0;
        for (String chave : chaves) {
            List<Amostra> lista = copiar(amostras, chave, agora);
            List<Amostra> listaSonda = copiar(sondas, chave, agora);
            int sep = chave.indexOf(' ');
            long erros = lista.stream().filter(Amostra::erro).count();
            double soma = lista.stream().mapToDouble(Amostra::latenciaMs).sum();
            double taxa = lista.isEmpty() ? 0 : erros * 100.0 / lista.size();
            long errosSonda = listaSonda.stream().filter(Amostra::erro).count();
            double taxaSonda = listaSonda.isEmpty() ? 0 : errosSonda * 100.0 / listaSonda.size();
            Status doTrafego = classificar(lista, taxa);
            Status daSonda = classificar(listaSonda, taxaSonda);
            Origem origem = lista.isEmpty() ? (listaSonda.isEmpty() ? Origem.NENHUMA : Origem.SONDA)
                    : (listaSonda.isEmpty() ? Origem.TRAFEGO : Origem.TRAFEGO_E_SONDA);
            endpoints.add(new EndpointStatus(chave.substring(0, sep), chave.substring(sep + 1),
                    criticos.contains(chave), pior(doTrafego, daSonda), lista.size(), erros,
                    lista.isEmpty() ? 0 : soma / lista.size(), taxa,
                    lista.isEmpty() ? null : lista.get(lista.size() - 1).instante(),
                    origem, listaSonda.size(), errosSonda,
                    listaSonda.isEmpty() ? null : listaSonda.get(listaSonda.size() - 1).instante()));
            total += lista.size();
            totalErros += erros;
            somaLatencia += soma;
        }
        endpoints.sort(Comparator.comparingInt((EndpointStatus e) -> ordem(e.status()))
                .thenComparing(e -> !e.critico())
                .thenComparing(EndpointStatus::caminho)
                .thenComparing(EndpointStatus::metodo));

        long uptime = Math.max(0, Duration.between(iniciadoEm, agora).getSeconds());
        long janelaEfetiva = Math.max(1, Math.min(janela.getSeconds(), uptime));
        return new Resumo(agora, iniciadoEm, uptime, janela.getSeconds(), total, totalErros,
                total == 0 ? 0 : somaLatencia / total, (double) total / janelaEfetiva,
                total == 0 ? 0 : totalErros * 100.0 / total, statusGeral(endpoints), endpoints);
    }

    private static Status classificar(List<Amostra> lista, double taxaErro) {
        if (lista.isEmpty()) {
            return Status.SEM_DADOS;
        }
        if (lista.size() >= SEQUENCIA_PARA_INDISPONIVEL
                && lista.subList(lista.size() - SEQUENCIA_PARA_INDISPONIVEL, lista.size())
                        .stream().allMatch(Amostra::erro)) {
            return Status.INDISPONIVEL;
        }
        return taxaErro > LIMITE_TAXA_ERRO ? Status.DEGRADADO : Status.OPERACIONAL;
    }

    /** Pior status entre dois; SEM_DADOS so prevalece se ambos forem SEM_DADOS (ausencia de dado nao e falha). */
    public static Status pior(Status a, Status b) {
        if (a == Status.SEM_DADOS) {
            return b;
        }
        if (b == Status.SEM_DADOS) {
            return a;
        }
        return ordem(a) <= ordem(b) ? a : b;
    }

    private static Status statusGeral(List<EndpointStatus> endpoints) {
        for (Status s : new Status[]{Status.INDISPONIVEL, Status.DEGRADADO, Status.OPERACIONAL}) {
            if (endpoints.stream().anyMatch(e -> e.status() == s)) {
                return s;
            }
        }
        return Status.SEM_DADOS;
    }

    private static int ordem(Status s) {
        return switch (s) {
            case INDISPONIVEL -> 0;
            case DEGRADADO -> 1;
            case OPERACIONAL -> 2;
            case SEM_DADOS -> 3;
        };
    }

    private List<Amostra> copiar(ConcurrentMap<String, Deque<Amostra>> origem, String chave, Instant agora) {
        Deque<Amostra> fila = origem.get(chave);
        if (fila == null) {
            return List.of();
        }
        synchronized (fila) {
            podar(fila, agora);
            return new ArrayList<>(fila);
        }
    }

    private void podar(Deque<Amostra> fila, Instant agora) {
        Instant corte = agora.minus(janela);
        while (!fila.isEmpty() && (fila.peekFirst().instante().isBefore(corte) || fila.size() > MAX_AMOSTRAS_POR_ENDPOINT)) {
            fila.pollFirst();
        }
    }

    static String chave(String metodo, String caminho) {
        return metodo.toUpperCase(java.util.Locale.ROOT) + " " + caminho;
    }
}
