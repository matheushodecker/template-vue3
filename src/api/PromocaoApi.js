// src/api/PromocaoApi.js
import axios from "axios";

export default class PromocaoApi {
    // GET: Buscar todas as promoções
    async buscarTodasPromocoes(page = 1, search = "") {
        const { data } = await axios.get(`/promocoes/?page=${page}&search=${search}`);
        return data;
    }

    // POST: Adicionar nova promoção (inclui produtos aninhados)
    async adicionarPromocao(promocao) {
        const { data } = await axios.post("/promocoes/", promocao);
        return data;
    }

    // PUT/PATCH: Atualizar promoção existente (inclui produtos aninhados)
    async atualizarPromocao(promocao) {
        const { data } = await axios.put(`/promocoes/${promocao.id}/`, promocao);
        return data;
    }

    // DELETE: Excluir promoção
    async excluirPromocao(id) {
        await axios.delete(`/promocoes/${id}/`);
    }

    // --- DEPENDÊNCIA PARA DROPDOWNS ---

    // Assume que você tem um endpoint para listar os Produtos
    async buscarProdutosDisponiveis() {
        const { data } = await axios.get(`/produtos/?ativo=true`); 
        return data.results ? data.results : data;
    }
}