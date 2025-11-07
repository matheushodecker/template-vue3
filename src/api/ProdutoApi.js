// src/api/ProdutoApi.js
import axios from "axios";

export default class ProdutoApi {
    // GET: Buscar TODOS os produtos (sem paginação, via /todos/)
    async buscarTodosProdutosSemPaginacao(search = "", ordering = "") {
        let url = "/produtos/todos/?";
        if (search) {
            url += `search=${search}&`;
        }
        if (ordering) {
            url += `ordering=${ordering}`;
        }
        const { data } = await axios.get(url);
        return data;
    }
    
    // GET: Buscar todos os produtos (PAGINADO)
    async buscarTodosProdutos(page = 1, search = "", ordering = "") { 
        let url = `/produtos/?page=${page}&search=${search}`;
        // Adiciona o parâmetro de ordenação
        if (ordering) {
            url += `&ordering=${ordering}`;
        }
        const { data } = await axios.get(url);
        return data;
    }

    // POST: Adicionar novo produto
    async adicionarProduto(produto) {
        const { data } = await axios.post("/produtos/", produto);
        return data;
    }

    // PUT: Atualizar produto existente
    async atualizarProduto(produto) {
        const { data } = await axios.put(`/produtos/${produto.id}/`, produto);
        return data;
    }

    // DELETE: Excluir produto
    async excluirProduto(id) {
        await axios.delete(`/produtos/${id}/`);
    }

    // --- DEPENDÊNCIAS PARA DROPDOWNS ---

    async buscarCategorias() {
        const { data } = await axios.get(`/categorias/`); 
        return data.results ? data.results : data;
    }

    async buscarFornecedores() {
        const { data } = await axios.get(`/fornecedores/`); 
        return data.results ? data.results : data;
    }
}