package com.codigovermelho.controllers.dto;

import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record NovaTransferenciaRequest(

        @NotNull(message = "Instituicao de origem e obrigatoria")
        Long origemId,

        @NotNull(message = "Instituicao de destino e obrigatoria")
        Long destinoId,

        @NotNull(message = "Tipo sanguineo e obrigatorio")
        TipoSanguineo tipoSanguineo,

        @NotNull(message = "Componente e obrigatorio")
        TipoComponente componente,

        @NotNull(message = "Quantidade e obrigatoria")
        @Min(value = 1, message = "Quantidade deve ser maior que zero")
        Integer quantidade,

        // US08 (obrigatorio): requisicao atendida. A compatibilidade ABO/Rh e de componente e validada
        // contra ela; incompativel -> 409. Sem requisicaoId nao ha como validar -> 400.
        @NotNull(message = "requisicaoId e obrigatorio para validar a compatibilidade ABO/Rh")
        Long requisicaoId
) {

        // Mantem a assinatura de 5 argumentos por compatibilidade de compilacao; requisicaoId fica nulo e a
        // criacao e recusada pelo servico (400). Nao ha mais caminho que confirme alocacao sem validar.
        public NovaTransferenciaRequest(Long origemId, Long destinoId, TipoSanguineo tipoSanguineo,
                                        TipoComponente componente, Integer quantidade) {
                this(origemId, destinoId, tipoSanguineo, componente, quantidade, null);
        }
}
