package com.codigovermelho.controllers.dto;

import com.codigovermelho.models.enums.StatusRequisicao;
import jakarta.validation.constraints.NotNull;

/**
 * DTO de entrada para atualizar o status de uma requisicao ja existente
 * (ex: aprovar, recusar, marcar como atendida apos uma Transferencia).
 * Completa a Requisicao com a mesma capacidade de atualizacao que
 * Instituicao (PUT) e Lote (PATCH) ja possuem.
 */
public record AtualizarRequisicaoRequest(

        @NotNull(message = "Status e obrigatorio")
        StatusRequisicao status

) {}
