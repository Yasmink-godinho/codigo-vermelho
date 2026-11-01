package com.codigovermelho.services;

import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoSanguineo;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

public final class AlocacaoCompatibilidade {
    private AlocacaoCompatibilidade() {}
    public record Candidato(Long loteId, String codigoLote, TipoSanguineo tipo, TipoComponente componente,
                            LocalDate validade, Integer quantidade, Long instituicaoId, String instituicaoNome) {}
    public record Veredito(boolean compativel, String motivo) {}
    public static Veredito verificar(TipoSanguineo receptor, TipoComponente componenteRequisitado,
                                     TipoSanguineo doador, TipoComponente componenteDisponivel) {
        if (receptor == null || doador == null || componenteRequisitado == null || componenteDisponivel == null)
            return new Veredito(false, "Tipo sanguineo e hemocomponente sao obrigatorios.");
        if (componenteRequisitado != componenteDisponivel)
            return new Veredito(false, "Hemocomponente incompativel: o componente do lote deve corresponder ao solicitado.");
        if (!CompatibilidadeSanguinea.compativel(doador, receptor))
            return new Veredito(false, CompatibilidadeSanguinea.motivo(doador, receptor));
        return new Veredito(true, "Lote compativel com a requisicao.");
    }
    public static List<Candidato> alternativas(TipoSanguineo receptor, TipoComponente componente,
                                                List<Candidato> estoque, LocalDate hoje, Long excluirId) {
        return estoque.stream().filter(c -> !java.util.Objects.equals(c.loteId(), excluirId))
                .filter(c -> c.quantidade() != null && c.quantidade() > 0)
                .filter(c -> c.validade() != null && !c.validade().isBefore(hoje))
                .filter(c -> verificar(receptor, componente, c.tipo(), c.componente()).compativel())
                .sorted(Comparator.comparing(Candidato::validade))
                .toList();
    }
}
