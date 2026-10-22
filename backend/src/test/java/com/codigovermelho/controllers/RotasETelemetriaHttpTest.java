package com.codigovermelho.controllers;

import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.repositories.InstituicaoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

// Teste de integracao pela camada HTTP de verdade (servidor em porta aleatoria + banco H2).
// Confere status, JSON e o tratamento de erro dos endpoints da US05 e da US07.
// Usa o HttpClient do proprio Java pra nao depender de classe de teste do Spring.
//
// Esse teste NAO usa @Transactional (o servidor roda em outra thread), entao os dados ficam gravados.
// Por isso ele usa um banco proprio (webtest) e nomes unicos em cada teste, sem contar registros.
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.datasource.url=jdbc:h2:mem:webtest;DB_CLOSE_DELAY=-1")
class RotasETelemetriaHttpTest {

    private record Resposta(int status, String corpo) {
    }

    @Value("${local.server.port}")
    private int porta;

    @Autowired
    private InstituicaoRepository instituicaoRepository;

    private final HttpClient cliente = HttpClient.newHttpClient();

    // A - B - C ligados em sequencia, D sem ligacao nenhuma
    private Instituicao a;
    private Instituicao b;
    private Instituicao c;
    private Instituicao d;

    @BeforeEach
    void montarMalha() {
        String sufixo = UUID.randomUUID().toString().substring(0, 6);
        a = salvar("HTTP Hemocentro " + sufixo, TipoInstituicao.HEMOCENTRO, -8.0539, -34.8999);
        b = salvar("HTTP Hospital Meio " + sufixo, TipoInstituicao.HOSPITAL_PUBLICO, -8.0573, -34.8984);
        c = salvar("HTTP Hospital Fim " + sufixo, TipoInstituicao.HOSPITAL_PUBLICO, -8.0409, -34.8896);
        d = salvar("HTTP Hospital Isolado " + sufixo, TipoInstituicao.HOSPITAL_PUBLICO, -8.2760, -35.9760);

        assertEquals(201, ligar(a, b).status());
        assertEquals(201, ligar(b, c).status());
    }

    // ---------------------------------------------------------------- US05

    @Test
    void rotaComVariosTrechosVolta200ComPercursoDistanciaETempo() {
        Resposta r = get("/api/v1/rotas?origem=" + a.getId() + "&destino=" + c.getId());

        assertEquals(200, r.status());
        assertTrue(r.corpo().contains("\"rotaEncontrada\":true"));
        assertTrue(r.corpo().contains("\"instituicoesIds\":[" + a.getId() + "," + b.getId() + "," + c.getId() + "]"));
        assertTrue(r.corpo().contains("\"distanciaTotalKm\":2.48"));
        assertTrue(r.corpo().contains("\"tempoEstimadoMinutos\":3.7"));
        assertTrue(r.corpo().contains(b.getNome()));
    }

    @Test
    void semCaminhoVolta200ComRotaEncontradaFalse() {
        Resposta r = get("/api/v1/rotas?origem=" + a.getId() + "&destino=" + d.getId());

        assertEquals(200, r.status());
        assertTrue(r.corpo().contains("\"rotaEncontrada\":false"));
        assertTrue(r.corpo().contains("\"instituicoesIds\":[]"));
        assertTrue(r.corpo().contains("Nao ha rota disponivel"));
    }

    @Test
    void rotaComParametrosInvalidosVolta400NoFormatoPadraoDeErro() {
        Resposta igual = get("/api/v1/rotas?origem=" + a.getId() + "&destino=" + a.getId());
        Resposta faltando = get("/api/v1/rotas?origem=" + a.getId());
        Resposta texto = get("/api/v1/rotas?origem=abc&destino=" + a.getId());

        assertEquals(400, igual.status());
        assertEquals(400, faltando.status());
        assertEquals(400, texto.status());
        assertTrue(igual.corpo().contains("\"mensagem\""));
        assertTrue(faltando.corpo().contains("destino"));
        assertTrue(texto.corpo().contains("origem"));
    }

    @Test
    void rotaComInstituicaoInexistenteVolta404() {
        assertEquals(404, get("/api/v1/rotas?origem=" + a.getId() + "&destino=999999").status());
    }

    @Test
    void ligacaoRepetidaVolta409NosDoisSentidosEAutoLigacaoVolta400() {
        assertEquals(409, ligar(a, b).status());
        assertEquals(409, ligar(b, a).status());
        assertEquals(400, ligar(a, a).status());
        assertEquals(404, post("/api/v1/ligacoes", "{\"origemId\":" + a.getId() + ",\"destinoId\":999999}").status());
        assertEquals(400, post("/api/v1/ligacoes", "{\"origemId\":" + a.getId() + "}").status());
    }

    @Test
    void apagarLigacaoMudaARotaEListarMostraAsLigacoes() {
        Resposta lista = get("/api/v1/ligacoes");
        assertEquals(200, lista.status());
        assertTrue(lista.corpo().contains(a.getNome()));

        Resposta nova = ligar(a, c);
        assertEquals(201, nova.status());
        // agora existe ligacao direta A - C, a rota deixa de passar por B
        assertTrue(get("/api/v1/rotas?origem=" + a.getId() + "&destino=" + c.getId()).corpo()
                .contains("\"instituicoesIds\":[" + a.getId() + "," + c.getId() + "]"));

        assertEquals(204, delete("/api/v1/ligacoes/" + extrairId(nova)).status());
        assertTrue(get("/api/v1/rotas?origem=" + a.getId() + "&destino=" + c.getId()).corpo()
                .contains("\"instituicoesIds\":[" + a.getId() + "," + b.getId() + "," + c.getId() + "]"));
        assertEquals(404, delete("/api/v1/ligacoes/" + extrairId(nova)).status());
    }

    @Test
    void excluirUmaInstituicaoApagaAsLigacoesDelaNoBanco() {
        // confere o @OnDelete(CASCADE) da Ligacao: sem ele, a exclusao daria erro de chave estrangeira
        assertEquals(204, delete("/api/v1/instituicoes/" + a.getId()).status());

        assertFalse(get("/api/v1/ligacoes").corpo().contains(a.getNome()));
        assertTrue(get("/api/v1/rotas?origem=" + b.getId() + "&destino=" + c.getId()).corpo()
                .contains("\"rotaEncontrada\":true"));
    }

    @Test
    void transferenciaUsaARotaECriaComStatusEmTransporte() {
        Resposta r = criarTransferencia(a, c);

        assertEquals(201, r.status());
        assertTrue(r.corpo().contains("\"statusTransferencia\":\"EM_TRANSPORTE\""));
        assertTrue(r.corpo().contains(a.getNome() + " -> " + b.getNome() + " -> " + c.getNome()));
        assertTrue(r.corpo().contains("\"distanciaKm\":2.48"));
        assertTrue(r.corpo().contains("\"codigo\":\"TR-"));
        assertEquals(200, get("/api/v1/transferencias/" + extrairId(r)).status());
        assertEquals(404, get("/api/v1/transferencias/999999").status());
    }

    @Test
    void transferenciaSemRotaVolta409ENaoECriada() {
        Resposta r = criarTransferencia(a, d);

        assertEquals(409, r.status());
        assertTrue(r.corpo().contains("Nao ha rota disponivel"));
    }

    @Test
    void transferenciaComCorpoInvalidoVolta400() {
        assertEquals(400, post("/api/v1/transferencias", "{\"origemId\":" + a.getId() + "}").status());
        assertEquals(400, post("/api/v1/transferencias", "{\"origemId\":" + a.getId() + ",\"destinoId\":" + c.getId()
                + ",\"tipoSanguineo\":\"XX\",\"componente\":\"PLASMA\",\"quantidade\":1}").status());
        assertEquals(400, post("/api/v1/transferencias", "{\"origemId\":" + a.getId() + ",\"destinoId\":" + c.getId()
                + ",\"tipoSanguineo\":\"O-\",\"componente\":\"PLASMA\",\"quantidade\":0}").status());
    }

    // ---------------------------------------------------------------- US07

    @Test
    void leituraDentroDaFaixaVolta201SemAlerta() {
        long id = extrairId(criarTransferencia(a, c));

        Resposta r = post("/api/v1/transferencias/" + id + "/telemetria", "{\"temperatura\":4.2}");

        assertEquals(201, r.status());
        assertTrue(r.corpo().contains("\"foraDaFaixa\":false"));
        assertTrue(r.corpo().contains("\"alerta\":null"));
        assertEquals(200, get("/api/v1/transferencias/" + id + "/telemetria").status());
        assertEquals("[]", get("/api/v1/transferencias/" + id + "/alertas").corpo());
    }

    @Test
    void leituraForaDaFaixaVolta201ComAlertaCriticoEFicaConsultavel() {
        long id = extrairId(criarTransferencia(a, c));

        Resposta r = post("/api/v1/transferencias/" + id + "/telemetria", "{\"temperatura\":7.4}");

        assertEquals(201, r.status());
        assertTrue(r.corpo().contains("\"foraDaFaixa\":true"));
        assertTrue(r.corpo().contains("\"nivel\":\"CRITICO\""));
        assertTrue(r.corpo().contains("7.4"));

        Resposta historico = get("/api/v1/transferencias/" + id + "/telemetria");
        assertTrue(historico.corpo().contains("\"temperatura\":7.4"));
        Resposta alertas = get("/api/v1/transferencias/" + id + "/alertas");
        assertEquals(200, alertas.status());
        assertTrue(alertas.corpo().contains("\"nivel\":\"CRITICO\""));
        assertTrue(get("/api/v1/alertas-termicos").corpo().contains("\"transferenciaId\":" + id));
    }

    @Test
    void limitesDe2e6SaoAceitosSemAlerta() {
        long id = extrairId(criarTransferencia(a, c));

        assertTrue(post("/api/v1/transferencias/" + id + "/telemetria", "{\"temperatura\":2.0}").corpo().contains("\"alerta\":null"));
        assertTrue(post("/api/v1/transferencias/" + id + "/telemetria", "{\"temperatura\":6.0}").corpo().contains("\"alerta\":null"));
        assertTrue(post("/api/v1/transferencias/" + id + "/telemetria", "{\"temperatura\":6.1}").corpo().contains("\"nivel\":\"CRITICO\""));
    }

    @Test
    void leituraInvalidaVolta400() {
        long id = extrairId(criarTransferencia(a, c));
        String url = "/api/v1/transferencias/" + id + "/telemetria";

        assertEquals(400, post(url, "{}").status());
        assertEquals(400, post(url, "{\"temperatura\":\"abc\"}").status());
        assertEquals(400, post(url, "{\"temperatura\":101}").status());
        assertEquals(400, post(url, "{\"temperatura\":-101}").status());
        assertEquals("[]", get(url).corpo());
    }

    @Test
    void transferenciaInexistenteVolta404NasConsultasENoPost() {
        assertEquals(404, post("/api/v1/transferencias/999999/telemetria", "{\"temperatura\":4}").status());
        assertEquals(404, get("/api/v1/transferencias/999999/telemetria").status());
        assertEquals(404, get("/api/v1/transferencias/999999/alertas").status());
    }

    @Test
    void depoisDeEntregueNaoAceitaMaisLeituraEEntregarDeNovoVolta409() {
        long id = extrairId(criarTransferencia(a, c));

        Resposta entrega = patch("/api/v1/transferencias/" + id + "/entrega");
        assertEquals(200, entrega.status());
        assertTrue(entrega.corpo().contains("\"statusTransferencia\":\"ENTREGUE\""));

        assertEquals(409, post("/api/v1/transferencias/" + id + "/telemetria", "{\"temperatura\":4.0}").status());
        assertEquals(409, patch("/api/v1/transferencias/" + id + "/entrega").status());
    }

    @Test
    void simuladorGeraLeiturasEOAlertaDoDesvio() {
        long id = extrairId(criarTransferencia(a, c));

        Resposta normal = post("/api/v1/transferencias/" + id + "/telemetria/simulacao?quantidade=3", "");
        assertEquals(201, normal.status());
        assertEquals("[]", get("/api/v1/transferencias/" + id + "/alertas").corpo());

        Resposta comDesvio = post("/api/v1/transferencias/" + id + "/telemetria/simulacao?quantidade=4&comDesvio=true", "");
        assertEquals(201, comDesvio.status());
        assertTrue(comDesvio.corpo().contains("\"nivel\":\"CRITICO\""));

        assertEquals(400, post("/api/v1/transferencias/" + id + "/telemetria/simulacao?quantidade=0", "").status());
        assertEquals(400, post("/api/v1/transferencias/" + id + "/telemetria/simulacao?quantidade=abc", "").status());
    }

    // ---------------------------------------------------------------- ajudantes

    private Instituicao salvar(String nome, TipoInstituicao tipo, double lat, double lon) {
        return instituicaoRepository.save(new Instituicao(nome, tipo, "Endereco de teste", lat, lon));
    }

    private Resposta ligar(Instituicao origem, Instituicao destino) {
        return post("/api/v1/ligacoes", "{\"origemId\":" + origem.getId() + ",\"destinoId\":" + destino.getId() + "}");
    }

    private Resposta criarTransferencia(Instituicao origem, Instituicao destino) {
        return post("/api/v1/transferencias", "{\"origemId\":" + origem.getId() + ",\"destinoId\":" + destino.getId()
                + ",\"tipoSanguineo\":\"O-\",\"componente\":\"CONCENTRADO_HEMACIAS\",\"quantidade\":3}");
    }

    // pega o primeiro "id" do JSON da resposta
    private long extrairId(Resposta resposta) {
        Matcher m = Pattern.compile("\"id\":(\\d+)").matcher(resposta.corpo());
        assertTrue(m.find(), "nao achei o id em: " + resposta.corpo());
        return Long.parseLong(m.group(1));
    }

    private Resposta get(String caminho) {
        return enviar(montar(caminho).GET().build());
    }

    private Resposta delete(String caminho) {
        return enviar(montar(caminho).DELETE().build());
    }

    private Resposta patch(String caminho) {
        return enviar(montar(caminho).method("PATCH", HttpRequest.BodyPublishers.noBody()).build());
    }

    private Resposta post(String caminho, String json) {
        return enviar(montar(caminho).header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json)).build());
    }

    private HttpRequest.Builder montar(String caminho) {
        return HttpRequest.newBuilder(URI.create("http://localhost:" + porta + caminho));
    }

    private Resposta enviar(HttpRequest requisicao) {
        try {
            HttpResponse<String> resposta = cliente.send(requisicao, HttpResponse.BodyHandlers.ofString());
            return new Resposta(resposta.statusCode(), resposta.body());
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao chamar " + requisicao.uri(), e);
        }
    }
}
