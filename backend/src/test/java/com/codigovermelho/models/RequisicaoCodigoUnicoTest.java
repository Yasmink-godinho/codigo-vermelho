package com.codigovermelho.models;

import com.codigovermelho.models.enums.NivelUrgencia;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.repositories.InstituicaoRepository;
import com.codigovermelho.repositories.RequisicaoRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;

// Regressao: o codigo REQ-... era baseado so em System.currentTimeMillis() e colidia (coluna unica)
// quando duas requisicoes eram gravadas no mesmo milissegundo.
@SpringBootTest
@Transactional
class RequisicaoCodigoUnicoTest {

    @Autowired
    private InstituicaoRepository instituicaoRepository;

    @Autowired
    private RequisicaoRepository requisicaoRepository;

    @Test
    void requisicoesGravadasEmSequenciaRapidaRecebemCodigosDistintosComPrefixoREQ() {
        Instituicao destino = instituicaoRepository.save(new Instituicao(
                "Codigo Unico Hospital " + System.nanoTime(), TipoInstituicao.HOSPITAL_PUBLICO,
                "Endereco de teste", -8.0573, -34.8984));

        Set<String> codigos = new HashSet<>();
        for (int i = 0; i < 300; i++) {
            Requisicao salva = requisicaoRepository.save(new Requisicao(destino, TipoSanguineo.O_NEGATIVO,
                    TipoComponente.CONCENTRADO_HEMACIAS, 1, NivelUrgencia.EMERGENCIA, null));
            assertTrue(salva.getCodigoRequisicao().startsWith("REQ-"), "prefixo REQ- preservado");
            assertTrue(codigos.add(salva.getCodigoRequisicao()),
                    "codigo duplicado gerado: " + salva.getCodigoRequisicao());
        }
    }
}
