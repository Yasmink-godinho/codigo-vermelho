package com.codigovermelho.services;

import com.codigovermelho.controllers.dto.AtualizarRequisicaoRequest;
import com.codigovermelho.controllers.dto.NovaRequisicaoRequest;
import com.codigovermelho.models.Instituicao;
import com.codigovermelho.models.Requisicao;
import com.codigovermelho.models.enums.NivelUrgencia;
import com.codigovermelho.models.enums.StatusRequisicao;
import com.codigovermelho.repositories.InstituicaoRepository;
import com.codigovermelho.repositories.RequisicaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class RequisicaoService {
    private final RequisicaoRepository requisicaoRepository;
    private final InstituicaoRepository instituicaoRepository;

    public RequisicaoService(RequisicaoRepository requisicaoRepository,
                             InstituicaoRepository instituicaoRepository) {
        this.requisicaoRepository = requisicaoRepository;
        this.instituicaoRepository = instituicaoRepository;
    }

    /**
     * Metodo original mantido (assinatura por parametros soltos), usado
     * pelos testes existentes de RequisicaoService/Controller. O novo
     * metodo emitir(NovaRequisicaoRequest) abaixo e so uma sobrecarga que
     * usa o DTO validado, delegando para este mesmo metodo.
     */
    @Transactional
    public Requisicao emitir(Long instituicaoId, com.codigovermelho.models.enums.TipoSanguineo tipoSanguineo,
                             com.codigovermelho.models.enums.TipoComponente componente,
                             Integer volume, NivelUrgencia nivelUrgencia, String observacoes) {
        Instituicao instituicao = instituicaoRepository.findById(instituicaoId)
                .orElseThrow(() -> new NoSuchElementException("Instituicao nao encontrada: " + instituicaoId));

        Requisicao requisicao = new Requisicao(instituicao, tipoSanguineo, componente, volume, nivelUrgencia, observacoes);
        return requisicaoRepository.save(requisicao);
    }

    /**
     * Sobrecarga que aceita o DTO validado (@Valid ja rodou no Controller
     * antes de chegar aqui). Mantida separada do metodo acima para nao
     * quebrar quem ja chama a versao antiga.
     */
    @Transactional
    public Requisicao emitir(NovaRequisicaoRequest request) {
        return emitir(request.instituicaoId(), request.tipoSanguineo(), request.componente(),
                request.volume(), request.nivelUrgencia(), request.observacoes());
    }

    @Transactional(readOnly = true)
    public List<Requisicao> listar(StatusRequisicao status, NivelUrgencia nivelUrgencia) {
        List<Requisicao> base;
        if (status != null) {
            base = requisicaoRepository.findByStatus(status);
        } else if (nivelUrgencia != null) {
            base = requisicaoRepository.findByNivelUrgencia(nivelUrgencia);
        } else {
            base = requisicaoRepository.findAll();
        }
        if (status != null && nivelUrgencia != null) {
            base = base.stream().filter(r -> r.getNivelUrgencia() == nivelUrgencia).toList();
        }
        return base;
    }

    @Transactional(readOnly = true)
    public Requisicao buscarPorId(Long id) {
        return requisicaoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Requisicao nao encontrada: " + id));
    }

    /**
     * Atualiza o status de uma requisicao (ex: PENDENTE -> APROVADA).
     * Nao ha regra de transicao restrita aqui de proposito (ex: impedir
     * pular de PENDENTE direto para ATENDIDA) - se o time quiser essa
     * regra de negocio, e um bom proximo passo para o Service.
     */
    @Transactional
    public Requisicao atualizarStatus(Long id, AtualizarRequisicaoRequest request) {
        Requisicao requisicao = buscarPorId(id);
        requisicao.setStatus(request.status());
        return requisicaoRepository.save(requisicao);
    }

    @Transactional
    public void excluir(Long id) {
        Requisicao requisicao = buscarPorId(id);
        requisicaoRepository.delete(requisicao);
    }
}
