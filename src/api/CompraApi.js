// src/api/CompraApi.js
import axios from "axios";

export default class CompraApi {
    // GET: Buscar todas as compras
    async buscarTodasCompras(page = 1, search = "") {
        const { data } = await axios.get(`/compras/?page=${page}&search=${search}`);
        return data;
    }

    // POST: Adicionar nova compra (inclui itens aninhados)
    async adicionarCompra(compra) {
        const { data } = await axios.post("/compras/", compra);
        return data;
    }

    // PUT/PATCH: Atualizar compra existente (inclui itens aninhados)
    async atualizarCompra(compra) {
        const { data } = await axios.put(`/compras/${compra.id}/`, compra);
        return data;
    }

    // DELETE: Excluir compra
    async excluirCompra(id) {
        await axios.delete(`/compras/${id}/`);
    }

    // --- DEPENDÊNCIAS PARA DROPDOWNS ---
    
    // Assumindo endpoints dos módulos anteriores
    async buscarFornecedores() {
        const { data } = await axios.get(`/fornecedores/?ativo=true`);
        return data.results ? data.results : data;
    }
    async buscarFuncionarios() {
        const { data } = await axios.get(`/funcionarios/?ativo=true`);
        return data.results ? data.results : data;
    }
    async buscarProdutos() {
        const { data } = await axios.get(`/produtos/?ativo=true`);
        return data.results ? data.results : data;
    }
}