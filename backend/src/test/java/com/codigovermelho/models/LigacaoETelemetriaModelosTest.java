package com.codigovermelho.models;

import com.codigovermelho.models.enums.NivelAlerta;
import com.codigovermelho.models.enums.TipoComponente;
import com.codigovermelho.models.enums.TipoInstituicao;
import com.codigovermelho.models.enums.TipoSanguineo;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

// Regras de construcao de Ligacao e AlertaTermico
class LigacaoETelemetriaModelosTest {

    private final Instituicao a = new Instituicao("Hemocentro A", TipoInstituicao.HEMOCENTRO, "Rua A", -8.0539, -34.8999);
    private final Instituicao b = new Instituicao("Hospital B", TipoInstituicao.HOSPITAL_PUBLICO, "Rua B", -8.0573, -34.8984);

    @Test
    void ligacaoPrecisaDeOrigemEDestino() {
        assertThrows(IllegalArgumentException.class, () -> new Ligacao(null, b));
        assertThrows(IllegalArgumentException.class, () -> new Ligacao(a, null));
    }

    @Test
    void ligacaoCalculaADistanciaPelasCoordenadas() {
        // mesmo valor do teste de Haversine do RotaServiceTest (0.41 km)
        assertEquals(0.4126, new Ligacao(a, b).getDistanciaKm(), 0.001);
    }

    @Test
    void alertaPrecisaDeLeituraEMensagem() {
        Transferencia t = new Transferencia(a, b, TipoSanguineo.O_NEGATIVO, TipoComponente.PLASMA,
                1, "A -> B", 0.4, LocalDateTime.now().plusMinutes(5));
        LeituraTelemetria leitura = new LeituraTelemetria(t, 7.4);

        assertThrows(IllegalArgumentException.class, () -> new AlertaTermico(null, "msg"));
        assertThrows(IllegalArgumentException.class, () -> new AlertaTermico(leitura, " "));
    }

    @Test
    void alertaNasceCriticoECopiaATemperaturaDaLeitura() {
        Transferencia t = new Transferencia(a, b, TipoSanguineo.O_NEGATIVO, TipoComponente.PLASMA,
                1, "A -> B", 0.4, LocalDateTime.now().plusMinutes(5));
        AlertaTermico alerta = new AlertaTermico(new LeituraTelemetria(t, 7.4), "fora da faixa");

        assertEquals(NivelAlerta.CRITICO, alerta.getNivel());
        assertEquals(7.4, alerta.getTemperatura(), 0.0001);
    }
}
