// src/api/VendaApi.js
import axios from "axios";

export default class VendaApi {
    // GET: Buscar todas as vendas
    async buscarTodasVendas(page = 1, search = "") {
        const { data } = await axios.get(`/vendas/?page=${page}&search=${search}`);
        return data;
    }

    // POST: Adicionar nova venda (inclui itens aninhados)
    async adicionarVenda(venda) {
        const { data } = await axios.post("/vendas/", venda);
        return data;
    }

    // PUT/PATCH: Atualizar venda existente (inclui itens aninhados)
    async atualizarVenda(venda) {
        const { data } = await axios.put(`/vendas/${venda.id}/`, venda);
        return data;
    }

    // DELETE: Excluir venda
    async excluirVenda(id) {
        await axios.delete(`/vendas/${id}/`);
    }

    // --- DEPENDÊNCIAS PARA DROPDOWNS ---

    async buscarFuncionarios() {
        const { data } = await axios.get(`/funcionarios/`); // Assumindo endpoint de Funcionário
        return data.results ? data.results : data;
    }

    async buscarProdutos() {
        const { data } = await axios.get(`/produtos/`); // Assumindo endpoint de Produto
        return data.results ? data.results : data;
    }
}