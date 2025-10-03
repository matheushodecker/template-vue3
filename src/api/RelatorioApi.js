// src/api/RelatorioApi.js
import axios from "axios";

export default class RelatorioApi {
    // --- RELATÓRIO DE VENDAS ---
    async buscarRelatoriosVenda(page = 1) {
        const { data } = await axios.get(`/relatorios-vendas/?page=${page}`);
        return data;
    }
    async gerarRelatorioVenda(relatorio) {
        // Usa POST para disparar o cálculo no backend
        const { data } = await axios.post("/relatorios-vendas/", relatorio);
        return data;
    }

    // --- RELATÓRIO DE ESTOQUE ---
    async buscarRelatoriosEstoque(page = 1) {
        const { data } = await axios.get(`/relatorios-estoque/?page=${page}`);
        return data;
    }
    async gerarRelatorioEstoque(relatorio) {
        // Usa POST para disparar o cálculo no backend
        const { data } = await axios.post("/relatorios-estoque/", relatorio);
        return data;
    }

    // --- DEPENDÊNCIA ---
    async buscarFuncionarios() {
        const { data } = await axios.get(`/funcionarios/?ativo=true`);
        return data.results ? data.results : data;
    }
}