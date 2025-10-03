// src/api/PagamentoApi.js
import axios from "axios";

export default class PagamentoApi {
    // GET: Buscar todos os pagamentos
    async buscarTodosPagamentos(page = 1, search = "") {
        const { data } = await axios.get(`/pagamentos/?page=${page}&search=${search}`);
        return data;
    }

    // POST: Adicionar novo pagamento
    async adicionarPagamento(pagamento) {
        const { data } = await axios.post("/pagamentos/", pagamento);
        return data;
    }

    // PUT: Atualizar pagamento existente
    async atualizarPagamento(pagamento) {
        const { data } = await axios.put(`/pagamentos/${pagamento.id}/`, pagamento);
        return data;
    }

    // DELETE: Excluir pagamento
    async excluirPagamento(id) {
        await axios.delete(`/pagamentos/${id}/`);
    }

    // --- DEPENDÊNCIAS PARA DROPDOWNS ---

    // Assume que a forma de pagamento já tem um endpoint
    async buscarFormasPagamento() {
        const { data } = await axios.get(`/formas-pagamento/?ativo=true`);
        return data.results ? data.results : data;
    }

    // Assumindo que você tem um endpoint para listar as vendas (usando a PK 'id')
    async buscarVendasDisponiveis() {
        const { data } = await axios.get(`/vendas/?status=P`); // Exemplo: Buscar apenas vendas pendentes
        return data.results ? data.results : data;
    }
}