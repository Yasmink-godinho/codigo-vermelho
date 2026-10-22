package com.codigovermelho.controllers.dto;

import java.util.List;

// Resultado do calculo de rota (US05). Os 4 primeiros campos sao o contrato que esta em
// docs/RESULTADO_ROTA.md. Acrescentei os nomes (pro front mostrar o percurso sem buscar cada
// instituicao) e a mensagem (pro caso de nao ter rota).
public record RotaResultado(
        List<Long> instituicoesIds,
        double distanciaTotalKm,
        double tempoEstimadoMinutos,
        boolean rotaEncontrada,
        List<String> nomesInstituicoes,
        String mensagem
) {
}
