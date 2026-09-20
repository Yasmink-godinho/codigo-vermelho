package com.codigovermelho.controllers.dto;

import com.codigovermelho.models.enums.NivelUrgencia;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO de entrada para emissao de requisicao (US04).
 *
 * Segue o mesmo padrao de validacao ja adotado em NovaInstituicaoRequest e
 * NovoLoteRequest (Bean Validation + @Valid no Controller), completando a
 * Requisicao para o mesmo nivel das outras duas entidades.
 */
public record NovaRequisicaoRequest(

        @NotNull(message = "Instituicao solicitante e obrigatoria")
        Long instituicaoId,

        @NotNull(message = "Tipo sanguineo e obrigatorio")
        TipoSanguineo tipoSanguineo,

        @NotNull(message = "Componente e obrigatorio")
        TipoComponente componente,

        @NotNull(message = "Volume e obrigatorio")
        @Min(value = 1, message = "Volume deve ser maior que zero")
        Integer volume,

        @NotNull(message = "Nivel de urgencia e obrigatorio")
        NivelUrgencia nivelUrgencia,

        @Size(max = 500, message = "Observacoes devem ter no maximo 500 caracteres")
        String observacoes
) {}
