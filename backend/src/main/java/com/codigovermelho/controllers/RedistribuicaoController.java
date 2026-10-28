package com.codigovermelho.controllers;

import com.codigovermelho.controllers.dto.RecomendacaoRedistribuicaoResponse;
import com.codigovermelho.services.RedistribuicaoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/redistribuicoes")
public class RedistribuicaoController {

    private final RedistribuicaoService redistribuicaoService;

    public RedistribuicaoController(RedistribuicaoService redistribuicaoService) {
        this.redistribuicaoService = redistribuicaoService;
    }

    @GetMapping("/sugeridas")
    public ResponseEntity<List<RecomendacaoRedistribuicaoResponse>> listarSugeridas() {
        return ResponseEntity.ok(redistribuicaoService.listarTodas());
    }

    @PostMapping("/gerar")
    public ResponseEntity<RecomendacaoRedistribuicaoResponse> gerarNovaRecomendacao() {
        RecomendacaoRedistribuicaoResponse nova = redistribuicaoService.gerarAutomaticaBaseadaEmEstoque();
        return ResponseEntity.ok(nova);
    }

    @PostMapping("/{id}/aprovar")
    public ResponseEntity<Map<String, Object>> aprovarRedistribuicao(@PathVariable Long id) {
        Optional<RecomendacaoRedistribuicaoResponse> opt = redistribuicaoService.aprovar(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        RecomendacaoRedistribuicaoResponse rec = opt.get();

        // Gera ID único baseado no identificador e timestamp para evitar duplicações no Dashboard
        String idTransferenciaUnico = "#RED-" + rec.getId() + "-" + (System.currentTimeMillis() % 1000);

        Map<String, Object> resposta = new HashMap<>();
        resposta.put("sucesso", true);
        resposta.put("status", "APROVADA");
        resposta.put("mensagem", "Recomendação aprovada com sucesso. Estoque atualizado e transferência despachada.");
        resposta.put("transferenciaCriada", Map.of(
                "id", idTransferenciaUnico,
                "origemId", rec.getOrigemId(),
                "from", rec.getOrigemNome(),
                "destinoId", rec.getDestinoId(),
                "to", rec.getDestinoNome(),
                "comp", rec.getTipoSanguineo(),
                "qty", rec.getQuantidade(),
                "status", "Em transporte"
        ));

        return ResponseEntity.ok(resposta);
    }

    @PostMapping("/{id}/recusar")
    public ResponseEntity<Map<String, Object>> recusarRedistribuicao(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {

        String motivo = (body != null) ? body.get("justificativa") : null;
        Optional<RecomendacaoRedistribuicaoResponse> opt = redistribuicaoService.recusar(id, motivo);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        RecomendacaoRedistribuicaoResponse rec = opt.get();

        Map<String, Object> resposta = new HashMap<>();
        resposta.put("sucesso", true);
        resposta.put("status", "RECUSADA");
        resposta.put("mensagem", "Recomendação recusada. Nenhuma transferência foi gerada.");
        resposta.put("justificativa", rec.getJustificativaRecusa());

        return ResponseEntity.ok(resposta);
    }
}