package com.codigovermelho.controllers;

import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.LoteHemocomponente;
import com.codigovermelho.models.Requisicao;
import com.codigovermelho.models.enums.NivelUrgencia;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.repositories.InstituicaoRepository;
import com.codigovermelho.repositories.LoteHemocomponenteRepository;
import com.codigovermelho.repositories.RequisicaoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * US08 — aceitacao da validacao de alocacao: bloqueio, alternativas e bloqueio na criacao de transferencia.
 * Mesmo padrao do CompatibilidadeHttpTest (HttpClient + H2 proprio).
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.datasource.url=jdbc:h2:mem:alocacaotest;DB_CLOSE_DELAY=-1")
class AlocacaoCompatibilidadeHttpTest {

    private record Resposta(int status, String corpo) {
    }

    @Value("${local.server.port}")
    private int porta;

    @Autowired
    private InstituicaoRepository instituicaoRepository;
    @Autowired
    private LoteHemocomponenteRepository loteRepository;
    @Autowired
    private RequisicaoRepository requisicaoRepository;

    private final HttpClient cliente = HttpClient.newHttpClient();

    private Instituicao inst;
    private Instituicao destino;
    private Requisicao requisicaoOPositivo;
    private LoteHemocomponente loteAPositivo;
    private LoteHemocomponente loteONegativo;

    @BeforeEach
    void criarCenario() {
        String sufixo = String.valueOf(System.nanoTime());
        inst = instituicaoRepository.save(new Instituicao(
                "Aloc Hemocentro " + sufixo, TipoInstituicao.HEMOCENTRO, "Endereco de teste", -8.0539, -34.8999));
        destino = instituicaoRepository.save(new Instituicao(
                "Aloc Hospital " + sufixo, TipoInstituicao.HOSPITAL_PUBLICO, "Endereco de teste", -8.0573, -34.8984));
        LocalDate coleta = LocalDate.now().minusDays(1);
        loteAPositivo = loteRepository.save(new LoteHemocomponente(
                TipoSanguineo.A_POSITIVO, TipoComponente.CONCENTRADO_HEMACIAS, coleta, 10, inst));
        loteONegativo = loteRepository.save(new LoteHemocomponente(
                TipoSanguineo.O_NEGATIVO, TipoComponente.CONCENTRADO_HEMACIAS, coleta, 10, inst));
        requisicaoOPositivo = requisicaoRepository.save(new Requisicao(
                destino, TipoSanguineo.O_POSITIVO, TipoComponente.CONCENTRADO_HEMACIAS, 2, NivelUrgencia.PRIORITARIA, null));
    }

    @Test
    void loteIncompativelFicaBloqueadoEListaAlternativasCompativeis() {
        Resposta r = get("/api/v1/compatibilidade/alocacao?requisicaoId=" + requisicaoOPositivo.getId()
                + "&loteId=" + loteAPositivo.getId());

        assertEquals(200, r.status());
        assertTrue(r.corpo().contains("\"compativel\":false"));
        assertTrue(r.corpo().contains("\"alocacaoBloqueada\":true"));
        assertTrue(r.corpo().contains(loteONegativo.getCodigoLote()), "lote O- deveria ser sugerido");
        assertFalse(r.corpo().contains("\"loteId\":" + loteAPositivo.getId() + ",\"codigoLote\""),
                "o lote recusado nao pode aparecer como alternativa");
    }

    @Test
    void loteCompativelLiberaAlocacaoSemAlternativas() {
        Resposta r = get("/api/v1/compatibilidade/alocacao?requisicaoId=" + requisicaoOPositivo.getId()
                + "&loteId=" + loteONegativo.getId());

        assertEquals(200, r.status());
        assertTrue(r.corpo().contains("\"compativel\":true"));
        assertTrue(r.corpo().contains("\"alternativas\":[]"));
    }

    @Test
    void verificacaoPorTiposSegueOContratoTipoRequisicaoTipoLote() {
        Resposta r = get("/api/v1/compatibilidade/alocacao?tipoRequisicao=O%2B&tipoLote=A%2B"
                + "&componente=CONCENTRADO_HEMACIAS&instituicaoId=" + inst.getId());

        assertEquals(200, r.status());
        assertTrue(r.corpo().contains("\"compativel\":false"));
        assertTrue(r.corpo().contains(loteONegativo.getCodigoLote()));
    }

    @Test
    void semParametrosSuficientesRetorna400() {
        assertEquals(400, get("/api/v1/compatibilidade/alocacao").status());
    }

    @Test
    void requisicaoInexistenteRetorna404() {
        assertEquals(404, get("/api/v1/compatibilidade/alocacao?requisicaoId=99999999&loteId="
                + loteONegativo.getId()).status());
    }

    @Test
    void transferenciaSemRequisicaoRetorna400() {
        Resposta r = post("/api/v1/transferencias", "{\"origemId\":" + inst.getId() + ",\"destinoId\":" + destino.getId()
                + ",\"tipoSanguineo\":\"O-\",\"componente\":\"CONCENTRADO_HEMACIAS\",\"quantidade\":1}");
        assertEquals(400, r.status());
        assertTrue(r.corpo().contains("requisicaoId"));
    }

    @Test
    void transferenciaIncompativelEBloqueadaComAlternativas() {
        Resposta r = post("/api/v1/transferencias", "{\"origemId\":" + inst.getId() + ",\"destinoId\":" + destino.getId()
                + ",\"tipoSanguineo\":\"A+\",\"componente\":\"CONCENTRADO_HEMACIAS\",\"quantidade\":1"
                + ",\"requisicaoId\":" + requisicaoOPositivo.getId() + "}");

        assertEquals(409, r.status());
        assertTrue(r.corpo().contains("Alocacao bloqueada"));
        assertTrue(r.corpo().contains("\"alternativas\":["));
        assertTrue(r.corpo().contains(loteONegativo.getCodigoLote()));
    }

    @Test
    void transferenciaCompativelNaoEBloqueadaPelaCompatibilidade() {
        // sem ligacao entre as instituicoes o 409 aqui e de rota (US05), nunca de compatibilidade
        Resposta r = post("/api/v1/transferencias", "{\"origemId\":" + inst.getId() + ",\"destinoId\":" + destino.getId()
                + ",\"tipoSanguineo\":\"O-\",\"componente\":\"CONCENTRADO_HEMACIAS\",\"quantidade\":1"
                + ",\"requisicaoId\":" + requisicaoOPositivo.getId() + "}");

        assertFalse(r.corpo().contains("Alocacao bloqueada"));
    }

    @Test
    void transferenciaSemRequisicaoIdNaoEConfirmada() {
        // mesmo tipo incompativel (A+ para O+): sem requisicaoId nao pode passar para a etapa de rota/persistencia
        Resposta r = post("/api/v1/transferencias", "{\"origemId\":" + inst.getId() + ",\"destinoId\":" + destino.getId()
                + ",\"tipoSanguineo\":\"A+\",\"componente\":\"CONCENTRADO_HEMACIAS\",\"quantidade\":1}");

        assertEquals(400, r.status());
        assertFalse(r.corpo().contains("\"percurso\""), "nenhuma transferencia pode ter sido criada");
    }

    @Test
    void transferenciaSemRequisicaoIdNemCompativelEConfirmada() {
        Resposta r = post("/api/v1/transferencias", "{\"origemId\":" + inst.getId() + ",\"destinoId\":" + destino.getId()
                + ",\"tipoSanguineo\":\"O-\",\"componente\":\"CONCENTRADO_HEMACIAS\",\"quantidade\":1}");

        assertEquals(400, r.status());
    }

    @Test
    void transferenciaComRequisicaoInexistenteRetorna404() {
        Resposta r = post("/api/v1/transferencias", "{\"origemId\":" + inst.getId() + ",\"destinoId\":" + destino.getId()
                + ",\"tipoSanguineo\":\"O-\",\"componente\":\"CONCENTRADO_HEMACIAS\",\"quantidade\":1"
                + ",\"requisicaoId\":99999999}");

        assertEquals(404, r.status());
    }

    // ---------------------------------------------------------------- infra

    private Resposta get(String caminho) {
        return enviar(HttpRequest.newBuilder().uri(URI.create("http://localhost:" + porta + caminho)).GET().build());
    }

    private Resposta post(String caminho, String json) {
        return enviar(HttpRequest.newBuilder().uri(URI.create("http://localhost:" + porta + caminho))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json)).build());
    }

    private Resposta enviar(HttpRequest requisicao) {
        try {
            HttpResponse<String> resposta = cliente.send(requisicao, HttpResponse.BodyHandlers.ofString());
            return new Resposta(resposta.statusCode(), resposta.body());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
