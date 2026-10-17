package com.codigovermelho.config;

import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.Ligacao;
import com.codigovermelho.models.LoteHemocomponente;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.repositories.InstituicaoRepository;
import com.codigovermelho.repositories.LigacaoRepository;
import com.codigovermelho.repositories.LoteHemocomponenteRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.LocalDate;

// Dados de demonstracao do perfil dev.
// Pode rodar quantas vezes quiser: cada instituicao de demonstracao e procurada pelo nome e so
// e criada se ainda nao existir, o mesmo vale pras ligacoes. Nada que ja esta no banco e
// apagado ou alterado. Os lotes de exemplo so entram junto com a instituicao quando ela e criada.
@Configuration
@Profile("dev")
public class DataInitializer implements CommandLineRunner {

    static final String NOME_HEMOPE = "Fundação HEMOPE";
    static final String NOME_RESTAURACAO = "Hospital da Restauração";
    static final String NOME_OSWALDO_CRUZ = "Hospital Universitário Oswaldo Cruz";
    static final String NOME_AGRESTE = "Hospital Regional do Agreste";

    private final InstituicaoRepository instituicaoRepository;
    private final LoteHemocomponenteRepository loteRepository;
    private final LigacaoRepository ligacaoRepository;

    public DataInitializer(InstituicaoRepository instituicaoRepository,
                           LoteHemocomponenteRepository loteRepository,
                           LigacaoRepository ligacaoRepository) {
        this.instituicaoRepository = instituicaoRepository;
        this.loteRepository = loteRepository;
        this.ligacaoRepository = ligacaoRepository;
    }

    @Override
    public void run(String... args) {
        // 1. Fundação HEMOPE
        Instituicao hemope = buscarPorNome(NOME_HEMOPE);
        if (hemope == null) {
            hemope = new Instituicao(NOME_HEMOPE, TipoInstituicao.HEMOCENTRO, "0000001", -8.0539, -34.8999);
            hemope.definirEstoqueMinimo(TipoSanguineo.O_NEGATIVO, 30);
            hemope.definirEstoqueMinimo(TipoSanguineo.O_POSITIVO, 50);
            hemope.definirEstoqueMinimo(TipoSanguineo.A_POSITIVO, 40);
            hemope = instituicaoRepository.save(hemope);

            loteRepository.save(new LoteHemocomponente(
                    TipoSanguineo.O_NEGATIVO,
                    TipoComponente.CONCENTRADO_HEMACIAS,
                    LocalDate.now().minusDays(5),
                    LocalDate.now().plusDays(30),
                    20,
                    hemope
            ));
            loteRepository.save(new LoteHemocomponente(
                    TipoSanguineo.A_POSITIVO,
                    TipoComponente.PLAQUETAS,
                    LocalDate.now().minusDays(1),
                    LocalDate.now().plusDays(4),
                    15,
                    hemope
            ));
        }

        // 2. Hospital da Restauração
        Instituicao hr = buscarPorNome(NOME_RESTAURACAO);
        if (hr == null) {
            hr = new Instituicao(NOME_RESTAURACAO, TipoInstituicao.HOSPITAL_PUBLICO, "0000002", -8.0573, -34.8984);
            hr.definirEstoqueMinimo(TipoSanguineo.O_NEGATIVO, 15);
            hr.definirEstoqueMinimo(TipoSanguineo.O_POSITIVO, 25);
            hr = instituicaoRepository.save(hr);

            loteRepository.save(new LoteHemocomponente(
                    TipoSanguineo.O_POSITIVO,
                    TipoComponente.CONCENTRADO_HEMACIAS,
                    LocalDate.now().minusDays(3),
                    LocalDate.now().plusDays(25),
                    12,
                    hr
            ));
        }

        // 3. Malha de rotas (US05) - coordenadas aproximadas, so pra teste/demonstracao
        Instituicao oswaldoCruz = buscarPorNome(NOME_OSWALDO_CRUZ);
        if (oswaldoCruz == null) {
            oswaldoCruz = instituicaoRepository.save(new Instituicao(
                    NOME_OSWALDO_CRUZ, TipoInstituicao.HOSPITAL_PUBLICO, "0000003", -8.0409, -34.8896));
        }
        // esse fica sem nenhuma ligacao de proposito, serve pra testar o caso "nao existe rota"
        if (buscarPorNome(NOME_AGRESTE) == null) {
            instituicaoRepository.save(new Instituicao(
                    NOME_AGRESTE, TipoInstituicao.HOSPITAL_PUBLICO, "0000004", -8.2760, -35.9760));
        }

        // HEMOPE - Restauracao - Oswaldo Cruz (nao tem ligacao direta HEMOPE - Oswaldo Cruz,
        // entao a rota entre os dois passa pela Restauracao)
        garantirLigacao(hemope, hr);
        garantirLigacao(hr, oswaldoCruz);
    }

    // procura pelo nome (sem diferenciar maiuscula de minuscula), devolve null se nao existe
    private Instituicao buscarPorNome(String nome) {
        for (Instituicao instituicao : instituicaoRepository.findAll()) {
            if (instituicao.getNome().equalsIgnoreCase(nome)) {
                return instituicao;
            }
        }
        return null;
    }

    // a ligacao nao tem direcao, entao olha A-B e B-A antes de criar
    private void garantirLigacao(Instituicao a, Instituicao b) {
        if (ligacaoRepository.existsByOrigemAndDestino(a, b) || ligacaoRepository.existsByOrigemAndDestino(b, a)) {
            return;
        }
        ligacaoRepository.save(new Ligacao(a, b));
    }
}
