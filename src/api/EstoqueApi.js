// src/api/EstoqueApi.js
import axios from "axios";

export default class EstoqueApi {
    // --- ESTOQUE (Listagem Principal) ---
    async buscarTodosEstoques(page = 1, search = "") {
        const { data } = await axios.get(`/estoques/?page=${page}&search=${search}`);
        return data;
    }

    // PUT/PATCH: Atualiza limites e localização
    async atualizarEstoque(estoque) {
        const { data } = await axios.put(`/estoques/${estoque.id}/`, estoque);
        return data;
    }

    // --- MOVIMENTAÇÃO (Entrada/Saída) ---
    async registrarMovimentacao(movimentacao) {
        // Assume que a URL é /movimentacoes-estoque/
        const { data } = await axios.post("/movimentacoes-estoque/", movimentacao);
        return data;
    }
    
    // Lista de Movimentações para uma tabela separada (opcional)
    async buscarMovimentacoes(produtoId) {
        const { data } = await axios.get(`/movimentacoes-estoque/?produto=${produtoId}&ordering=-data_movimentacao`);
        return data.results ? data.results : data;
    }

    // --- DEPENDÊNCIAS ---
    async buscarProdutos() {
        const { data } = await axios.get(`/produtos/?ativo=true`);
        return data.results ? data.results : data;
    }
    async buscarFuncionarios() {
        const { data } = await axios.get(`/funcionarios/?ativo=true`);
        return data.results ? data.results : data;
    }
}