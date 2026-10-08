package com.codigovermelho.config;

import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.LoteHemocomponente;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.models.enums.TipoSanguineo;
import com.codigovermelho.repositories.InstituicaoRepository;
import com.codigovermelho.repositories.LoteHemocomponenteRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.LocalDate;

@Configuration
@Profile("dev")
public class DataInitializer implements CommandLineRunner {

    private final InstituicaoRepository instituicaoRepository;
    private final LoteHemocomponenteRepository loteRepository;

    public DataInitializer(InstituicaoRepository instituicaoRepository,
                           LoteHemocomponenteRepository loteRepository) {
        this.instituicaoRepository = instituicaoRepository;
        this.loteRepository = loteRepository;
    }

    @Override
    public void run(String... args) {
        if (instituicaoRepository.count() > 0) {
            return;
        }

        TipoInstituicao tipoHemocentro = TipoInstituicao.values()[0];
        TipoInstituicao tipoHospital = TipoInstituicao.values().length > 1
                ? TipoInstituicao.values()[1]
                : TipoInstituicao.values()[0];

        // 1. Fundação HEMOPE
        Instituicao hemope = new Instituicao(
                "Fundação HEMOPE",
                tipoHemocentro,
                "0000001",
                -8.0539,
                -34.8999
        );
        hemope.definirEstoqueMinimo(TipoSanguineo.O_NEGATIVO, 30);
        hemope.definirEstoqueMinimo(TipoSanguineo.O_POSITIVO, 50);
        hemope.definirEstoqueMinimo(TipoSanguineo.A_POSITIVO, 40);
        hemope = instituicaoRepository.save(hemope);

        // 2. Hospital da Restauração
        Instituicao hr = new Instituicao(
                "Hospital da Restauração",
                tipoHospital,
                "0000002",
                -8.0573,
                -34.8984
        );
        hr.definirEstoqueMinimo(TipoSanguineo.O_NEGATIVO, 15);
        hr.definirEstoqueMinimo(TipoSanguineo.O_POSITIVO, 25);
        hr = instituicaoRepository.save(hr);

        // 3. Lotes no HEMOPE
        LoteHemocomponente lote1 = new LoteHemocomponente(
                TipoSanguineo.O_NEGATIVO,
                TipoComponente.CONCENTRADO_HEMACIAS,
                LocalDate.now().minusDays(5),
                LocalDate.now().plusDays(30),
                20,
                hemope
        );
        loteRepository.save(lote1);

        LoteHemocomponente lote2 = new LoteHemocomponente(
                TipoSanguineo.A_POSITIVO,
                TipoComponente.PLAQUETAS,
                LocalDate.now().minusDays(1),
                LocalDate.now().plusDays(4),
                15,
                hemope
        );
        loteRepository.save(lote2);

        // 4. Lote no Hospital da Restauração
        LoteHemocomponente lote3 = new LoteHemocomponente(
                TipoSanguineo.O_POSITIVO,
                TipoComponente.CONCENTRADO_HEMACIAS,
                LocalDate.now().minusDays(3),
                LocalDate.now().plusDays(25),
                12,
                hr
        );
        loteRepository.save(lote3);
    }
}