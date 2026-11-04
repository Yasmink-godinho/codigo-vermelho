package com.codigovermelho.services;

import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.LoteHemocomponente;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.repositories.InstituicaoRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * US03 — Fila de Prioridade FEFO. Teste de INTEGRACAO (passa pelo banco).
 *
 * Sobe o contexto Spring de verdade e usa o LoteHemocomponenteService ligado
 * ao repositorio JPA sobre o H2. Grava lotes reais e confere que a fila FEFO:
 *   1. ordena por validade crescente (o que vence primeiro sai primeiro);
 *   2. exclui lotes ja vencidos.
 *
 * @Transactional faz o rollback ao fim de cada teste, mantendo o banco limpo.
 */
@SpringBootTest
@Transactional
class FilaFefoIntegracaoTest {

    @Autowired
    private LoteHemocomponenteService loteService;

    @Autowired
    private InstituicaoRepository instituicaoRepository;

    @Test
    void filaFefoOrdenaPorValidadeEIgnoraVencidos() {
        Instituicao hemocentro = instituicaoRepository.save(new Instituicao(
                "Hemocentro FEFO", TipoInstituicao.HEMOCENTRO, "Rua X", -8.05, -34.90));
        Long id = hemocentro.getId();

        // Lote que vence depois (30 dias)
        loteService.registrar(id, TipoSanguineo.O_NEGATIVO, TipoComponente.CONCENTRADO_HEMACIAS,
                LocalDate.now().minusDays(5), LocalDate.now().plusDays(30), 10);
        // Lote que vence primeiro (5 dias) -> deve encabecar a fila
        loteService.registrar(id, TipoSanguineo.O_NEGATIVO, TipoComponente.CONCENTRADO_HEMACIAS,
                LocalDate.now().minusDays(5), LocalDate.now().plusDays(5), 10);
        // Lote ja vencido (ontem) -> deve ficar fora da fila
        loteService.registrar(id, TipoSanguineo.O_NEGATIVO, TipoComponente.CONCENTRADO_HEMACIAS,
                LocalDate.now().minusDays(60), LocalDate.now().minusDays(1), 10);

        long inicioMs = System.currentTimeMillis();
        long inicioNanos = System.nanoTime();
        List<LoteHemocomponente> fila = loteService.filaFefo(TipoSanguineo.O_NEGATIVO, id);
        long fimNanos = System.nanoTime();
        long fimMs = System.currentTimeMillis();

        assertEquals(2, fila.size(), "O lote vencido nao deveria entrar na fila FEFO");
        assertTrue(fila.get(0).getDataValidade().isBefore(fila.get(1).getDataValidade()),
                "A fila deveria estar ordenada por validade crescente");
        fila.forEach(lote -> assertFalse(lote.isVencido()));
        System.out.printf(Locale.ROOT, "MEDICAO fila_fefo inicio_epoch_ms=%d fim_epoch_ms=%d "
                        + "duracao_ms=%.3f lotes_processados=%d%n",
                inicioMs, fimMs, (fimNanos - inicioNanos) / 1_000_000.0, fila.size());
    }
}