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

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RedeStatusHttpTest {
    @Value("${local.server.port}") private int porta;

    @Test
    void endpointDeStatusRetornaMetricasEComponentes() throws Exception {
        var request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + porta + "/api/v1/rede/status"))
                .GET().build();
        var response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode());
        assertTrue(response.body().contains("\"statusGeral\""));
        assertTrue(response.body().contains("\"latenciaMediaMs\""));
        assertTrue(response.body().contains("\"componentes\""));
    }
}
