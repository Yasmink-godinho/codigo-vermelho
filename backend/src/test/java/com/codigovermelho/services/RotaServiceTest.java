package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.NovaLigacaoRequest;
import com.codigovermelho.controllers.dto.RotaResultado;
import com.codigovermelho.exceptions.RegraDeNegocioException;
import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.repositories.InstituicaoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// Teste de integracao da US05 com o banco H2. O @Transactional desfaz tudo no fim de cada teste.
@SpringBootTest
@Transactional
class RotaServiceTest {

    @Autowired
    private RotaService rotaService;

    @Autowired
    private LigacaoService ligacaoService;

    @Autowired
    private InstituicaoRepository instituicaoRepository;

    private Instituicao hemocentro;
    private Instituicao hospitalMeio;
    private Instituicao hospitalFim;
    private Instituicao hospitalIsolado;

    @BeforeEach
    void montarMalha() {
        // mesmas coordenadas do seed de dev
        hemocentro = salvar("Teste Hemocentro", TipoInstituicao.HEMOCENTRO, -8.0539, -34.8999);
        hospitalMeio = salvar("Teste Hospital Meio", TipoInstituicao.HOSPITAL_PUBLICO, -8.0573, -34.8984);
        hospitalFim = salvar("Teste Hospital Fim", TipoInstituicao.HOSPITAL_PUBLICO, -8.0409, -34.8896);
        hospitalIsolado = salvar("Teste Hospital Isolado", TipoInstituicao.HOSPITAL_PUBLICO, -8.2760, -35.9760);

        // hemocentro - meio - fim (nao tem ligacao direta entre hemocentro e fim)
        ligacaoService.criar(new NovaLigacaoRequest(hemocentro.getId(), hospitalMeio.getId()));
        ligacaoService.criar(new NovaLigacaoRequest(hospitalMeio.getId(), hospitalFim.getId()));
    }

    private Instituicao salvar(String nome, TipoInstituicao tipo, double lat, double lon) {
        return instituicaoRepository.save(new Instituicao(nome, tipo, "Endereco de teste", lat, lon));
    }

    @Test
    void calculaRotaPassandoPelaInstituicaoDoMeio() {
        RotaResultado rota = rotaService.calcularRota(hemocentro.getId(), hospitalFim.getId());

        assertTrue(rota.rotaEncontrada());
        assertEquals(List.of(hemocentro.getId(), hospitalMeio.getId(), hospitalFim.getId()), rota.instituicoesIds());
        assertEquals(List.of("Teste Hemocentro", "Teste Hospital Meio", "Teste Hospital Fim"), rota.nomesInstituicoes());
        // 0.41 km + 2.06 km (haversine das coordenadas acima), 40 km/h de velocidade media
        assertEquals(2.48, rota.distanciaTotalKm(), 0.01);
        assertEquals(3.7, rota.tempoEstimadoMinutos(), 0.1);
    }

    @Test
    void rotaFuncionaNoSentidoContrario() {
        RotaResultado rota = rotaService.calcularRota(hospitalFim.getId(), hemocentro.getId());

        assertTrue(rota.rotaEncontrada());
        assertEquals(List.of(hospitalFim.getId(), hospitalMeio.getId(), hemocentro.getId()), rota.instituicoesIds());
    }

    @Test
    void informaQueNaoHaRotaQuandoODestinoNaoTemLigacao() {
        RotaResultado rota = rotaService.calcularRota(hemocentro.getId(), hospitalIsolado.getId());

        assertFalse(rota.rotaEncontrada());
        assertTrue(rota.instituicoesIds().isEmpty());
        assertEquals(0.0, rota.distanciaTotalKm(), 0.0);
        assertEquals(0.0, rota.tempoEstimadoMinutos(), 0.0);
        assertTrue(rota.mensagem().contains("Nao ha rota disponivel"));
    }

    @Test
    void naoAceitaOrigemIgualAoDestino() {
        assertThrows(IllegalArgumentException.class,
                () -> rotaService.calcularRota(hemocentro.getId(), hemocentro.getId()));
    }

    @Test
    void naoAceitaOrigemOuDestinoNulos() {
        assertThrows(IllegalArgumentException.class, () -> rotaService.calcularRota(null, hemocentro.getId()));
        assertThrows(IllegalArgumentException.class, () -> rotaService.calcularRota(hemocentro.getId(), null));
    }

    @Test
    void dao404QuandoUmaDasInstituicoesNaoExiste() {
        assertThrows(NoSuchElementException.class, () -> rotaService.calcularRota(hemocentro.getId(), 999999L));
        assertThrows(NoSuchElementException.class, () -> rotaService.calcularRota(999999L, hemocentro.getId()));
    }

    @Test
    void naoDeixaCadastrarAMesmaLigacaoDuasVezesNemNoSentidoInverso() {
        assertThrows(RegraDeNegocioException.class,
                () -> ligacaoService.criar(new NovaLigacaoRequest(hemocentro.getId(), hospitalMeio.getId())));
        assertThrows(RegraDeNegocioException.class,
                () -> ligacaoService.criar(new NovaLigacaoRequest(hospitalMeio.getId(), hemocentro.getId())));
    }

    @Test
    void naoDeixaLigarUmaInstituicaoComElaMesma() {
        assertThrows(IllegalArgumentException.class,
                () -> ligacaoService.criar(new NovaLigacaoRequest(hemocentro.getId(), hemocentro.getId())));
    }

    @Test
    void apagarUmaLigacaoMudaOResultadoDaRota() {
        Long idLigacao = ligacaoService.listar().stream()
                .filter(l -> l.getDestino().getId().equals(hospitalFim.getId()))
                .findFirst().orElseThrow().getId();
        ligacaoService.excluir(idLigacao);

        assertFalse(rotaService.calcularRota(hemocentro.getId(), hospitalFim.getId()).rotaEncontrada());
    }
}
