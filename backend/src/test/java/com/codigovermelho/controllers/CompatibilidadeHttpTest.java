package com.codigovermelho.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * US08 — Matching Imunologico (ABO/Rh). Teste de ACEITACAO.
 *
 * Exercita o sistema inteiro pela camada HTTP (servidor em porta aleatoria),
 * do jeito que o operador de fato usaria. Segue o mesmo padrao de
 * RotasETelemetriaHttpTest (HttpClient do proprio Java + H2 proprio).
 *
 * Criterios de aceitacao (formato Given/When/Then — ver tambem o .feature em
 * src/test/resources/features/compatibilidade.feature):
 *   - DADO um doador O- e um receptor AB+, QUANDO consulto a compatibilidade,
 *     ENTAO a resposta e 200 e compativel=true.
 *   - DADO um doador A+ e um receptor O+, QUANDO consulto, ENTAO compativel=false.
 *   - DADO um tipo sanguineo invalido, QUANDO consulto, ENTAO a resposta e 400.
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.datasource.url=jdbc:h2:mem:matchingtest;DB_CLOSE_DELAY=-1")
class CompatibilidadeHttpTest {

    private record Resposta(int status, String corpo) {
    }

    @Value("${local.server.port}")
    private int porta;

    private final HttpClient cliente = HttpClient.newHttpClient();

    @Test
    void doadorUniversalComReceptorUniversalRetorna200ECompativel() {
        // O- -> AB+ : compativel tanto em ABO quanto em Rh
        Resposta r = get("/api/v1/compatibilidade?doador=O-&receptor=AB%2B");

        assertEquals(200, r.status());
        assertTrue(r.corpo().contains("\"compativel\":true"));
        assertTrue(r.corpo().contains("\"doador\":\"O-\""));
        assertTrue(r.corpo().contains("\"receptor\":\"AB+\""));
    }

    @Test
    void doadorIncompativelRetorna200ECompativelFalse() {
        // A+ -> O+ : incompativel no ABO
        Resposta r = get("/api/v1/compatibilidade?doador=A%2B&receptor=O%2B");

        assertEquals(200, r.status());
        assertTrue(r.corpo().contains("\"compativel\":false"));
        assertTrue(r.corpo().toLowerCase().contains("abo"));
    }

    @Test
    void tipoSanguineoInvalidoRetorna400() {
        Resposta r = get("/api/v1/compatibilidade?doador=X9&receptor=O%2B");

        assertEquals(400, r.status());
    }

    @Test
    void listaDeDoadoresCompativeisParaAbPositivoTrazOsOitoTipos() {
        Resposta r = get("/api/v1/compatibilidade/doadores?receptor=AB%2B");

        assertEquals(200, r.status());
        for (String tipo : new String[]{"O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"}) {
            assertTrue(r.corpo().contains("\"" + tipo + "\""), "Faltou " + tipo + " na lista");
        }
    }

    // ---------------------------------------------------------------- infra

    private Resposta get(String caminho) {
        try {
            HttpRequest requisicao = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:" + porta + caminho))
                    .GET()
                    .build();
            HttpResponse<String> resposta = cliente.send(requisicao, HttpResponse.BodyHandlers.ofString());
            return new Resposta(resposta.statusCode(), resposta.body());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}