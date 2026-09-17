package com.codigovermelho.service;

public class LoteHemocomponenteService {
    private final LoteHemocomponenteRepository loteRepository;
    private final InstituicaoRepository instituicaoRepository;

    public LoteHemocomponenteService(LoteHemocomponenteRepository loteRepository,
                                     InstituicaoRepository instituicaoRepository) {
        this.loteRepository = loteRepository;
        this.instituicaoRepository = instituicaoRepository;
    }

    public LoteHemocomponente registrar(Long instituicaoId, TipoSanguineo tipoSanguineo,
                                        TipoComponente componente, LocalDate dataColeta, Integer quantidade) {
        Instituicao instituicao = instituicaoRepository.findById(instituicaoId)
                .orElseThrow(() -> new NoSuchElementException("Instituicao nao encontrada: " + instituicaoId));

        LoteHemocomponente lote = new LoteHemocomponente(tipoSanguineo, componente, dataColeta, quantidade, instituicao);
        return loteRepository.save(lote);
    }

    public List<LoteHemocomponente> listarPorInstituicao(Long instituicaoId) {
        return loteRepository.findByInstituicaoId(instituicaoId);
    }

    public List<LoteHemocomponente> filaFefo(TipoSanguineo tipoSanguineo) {
        return loteRepository.findByTipoSanguineoOrderByDataValidadeAsc(tipoSanguineo);
    }
}
}
