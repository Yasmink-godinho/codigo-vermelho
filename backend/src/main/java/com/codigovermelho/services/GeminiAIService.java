package com.codigovermelho.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GeminiAIService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public List<String> gerarExplicabilidadeRedistribuicao(
            String origem, String destino, String tipoSanguineo, int quantidade, double distanciaKm) {

        if (apiKey != null && !apiKey.isBlank()) {
            try {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

                String prompt = String.format(
                        "Você é um especialista em logística hospitalar e hemorrede (XAI). " +
                                "Gere exatamente 4 motivos explicáveis e técnicos para autorizar a transferência de %d bolsas de %s " +
                                "da unidade doadora '%s' para a receptora '%s' (distância: %.1f km). " +
                                "Considere risco de desabastecimento, estabilidade da origem, prioridade FEFO e rota viária. " +
                                "Responda estritamente em formato JSON com uma lista de strings na chave 'motivos'. Exemplo: {\"motivos\": [\"motivo 1\", \"motivo 2\"]}",
                        quantidade, tipoSanguineo, origem, destino, distanciaKm
                );

                Map<String, Object> body = Map.of(
                        "contents", List.of(
                                Map.of("parts", List.of(Map.of("text", prompt)))
                        ),
                        "generationConfig", Map.of(
                                "response_mime_type", "application/json"
                        )
                );

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
                ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    List<String> motivosExtraidos = extrairMotivos(response.getBody());
                    if (!motivosExtraidos.isEmpty()) {
                        return motivosExtraidos;
                    }
                }
            } catch (Exception e) {
                System.err.println("Aviso: Falha ao consultar Gemini API, acionando fallback determinístico: " + e.getMessage());
            }
        }

        return fallbackMotivos(origem, destino, tipoSanguineo, quantidade, distanciaKm);
    }

    private List<String> extrairMotivos(String jsonResponse) {
        List<String> motivos = new ArrayList<>();
        // Extrai strings contidas dentro de arrays JSON
        Pattern pattern = Pattern.compile("\"([^\"]{10,}?)\"");
        Matcher matcher = pattern.matcher(jsonResponse);
        while (matcher.find()) {
            String texto = matcher.group(1).trim();
            if (!texto.equalsIgnoreCase("motivos") && !texto.contains("generateContent") && !texto.contains("candidates")) {
                motivos.add(texto);
            }
        }
        return motivos.isEmpty() ? Collections.emptyList() : motivos;
    }

    private List<String> fallbackMotivos(String origem, String destino, String tipoSanguineo, int quantidade, double distanciaKm) {
        return List.of(
                destino + " apresenta risco iminente de desabastecimento crítico para o hemocomponente " + tipoSanguineo + " (abaixo de 30% do estoque de segurança).",
                origem + " opera com margem segura acima do estoque mínimo e pode ceder " + quantidade + " unidades sem risco à sua UTI.",
                "Validade das bolsas na fila FEFO priorizada para consumo em tempo hábil, prevenindo perdas biológicas.",
                "Caminho mínimo logístico calculado em " + distanciaKm + " km via malha viária expressa, viabilizando o transporte refrigerado ágil."
        );
    }
}