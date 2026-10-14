package com.codigovermelho.config;

import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.repositories.InstituicaoRepository;
import com.codigovermelho.repositories.LigacaoRepository;
import com.codigovermelho.repositories.LoteHemocomponenteRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

// O perfil de teste nao e o dev, entao o DataInitializer nao roda sozinho aqui:
// cada teste cria o objeto na mao e chama o run(). O @Transactional desfaz tudo no fim.
@SpringBootTest
@Transactional
class DataInitializerTest {

    @Autowired
    private InstituicaoRepository instituicaoRepository;

    @Autowired
    private LoteHemocomponenteRepository loteRepository;

    @Autowired
    private LigacaoRepository ligacaoRepository;

    private DataInitializer novoInicializador() {
        return new DataInitializer(instituicaoRepository, loteRepository, ligacaoRepository);
    }

    private Instituicao buscar(String nome) {
        for (Instituicao inst : instituicaoRepository.findAll()) {
            if (inst.getNome().equals(nome)) {
                return inst;
            }
        }
        return null;
    }

    @Test
    void criaOsDadosDeDemonstracaoEAsLigacoes() {
        long instituicoesAntes = instituicaoRepository.count();
        long ligacoesAntes = ligacaoRepository.count();
        long lotesAntes = loteRepository.count();

        novoInicializador().run();

        assertEquals(instituicoesAntes + 4, instituicaoRepository.count());
        assertEquals(ligacoesAntes + 2, ligacaoRepository.count());
        assertEquals(lotesAntes + 3, loteRepository.count());
        assertNotNull(buscar(DataInitializer.NOME_HEMOPE));
        assertNotNull(buscar(DataInitializer.NOME_AGRESTE));
    }

    @Test
    void rodarDeNovoNaoDuplicaNada() {
        novoInicializador().run();
        long instituicoes = instituicaoRepository.count();
        long ligacoes = ligacaoRepository.count();
        long lotes = loteRepository.count();

        novoInicializador().run();
        novoInicializador().run();

        assertEquals(instituicoes, instituicaoRepository.count());
        assertEquals(ligacoes, ligacaoRepository.count());
        assertEquals(lotes, loteRepository.count());
    }

    @Test
    void criaOsDadosMesmoJaExistindoOutrasInstituicoesENaoMexeNelas() {
        Instituicao existente = instituicaoRepository.save(new Instituicao(
                "Hospital que ja existia", TipoInstituicao.UPA, "Rua X", -8.1, -34.9));
        long instituicoesAntes = instituicaoRepository.count();

        novoInicializador().run();

        assertEquals(instituicoesAntes + 4, instituicaoRepository.count());
        Instituicao depois = buscar("Hospital que ja existia");
        assertNotNull(depois);
        assertEquals(existente.getId(), depois.getId());
        assertEquals("Rua X", depois.getEndereco());
    }

    @Test
    void usaAInstituicaoDeDemonstracaoQueJaExisteSemDuplicarSemMexerNosLotes() {
        // HEMOPE ja cadastrada (por exemplo pelo cadastro da tela) e sem nenhum lote
        Instituicao hemope = instituicaoRepository.save(new Instituicao(
                DataInitializer.NOME_HEMOPE, TipoInstituicao.HEMOCENTRO, "Endereco real", -8.0539, -34.8999));
        long lotesAntes = loteRepository.count();
        long ligacoesAntes = ligacaoRepository.count();

        novoInicializador().run();

        int quantasHemope = 0;
        for (Instituicao inst : instituicaoRepository.findAll()) {
            if (inst.getNome().equals(DataInitializer.NOME_HEMOPE)) {
                quantasHemope++;
            }
        }
        assertEquals(1, quantasHemope);
        assertEquals("Endereco real", buscar(DataInitializer.NOME_HEMOPE).getEndereco());
        // so o lote do Hospital da Restauracao (que foi criado agora), os da HEMOPE nao entram
        assertEquals(lotesAntes + 1, loteRepository.count());
        // e a ligacao da HEMOPE com a Restauracao foi criada mesmo assim
        assertEquals(ligacoesAntes + 2, ligacaoRepository.count());
        assertEquals(hemope.getId(), buscar(DataInitializer.NOME_HEMOPE).getId());
    }

    @Test
    void naoCriaLigacaoDuplicadaNemNoSentidoContrario() {
        novoInicializador().run();
        Instituicao hemope = buscar(DataInitializer.NOME_HEMOPE);
        Instituicao restauracao = buscar(DataInitializer.NOME_RESTAURACAO);
        long ligacoes = ligacaoRepository.count();

        novoInicializador().run();

        assertEquals(ligacoes, ligacaoRepository.count());
        assertTrue(ligacaoRepository.existsByOrigemAndDestino(hemope, restauracao));
    }
}
