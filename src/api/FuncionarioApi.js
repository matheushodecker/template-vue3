// src/api/FuncionarioApi.js
import axios from "axios";

export default class FuncionarioApi {
    // GET: Buscar todos os funcionários (com paginação e busca)
    async buscarTodosOsFuncionarios(page = 1, search = "") {
        const { data } = await axios.get(`/funcionarios/?page=${page}&search=${search}`);
        return data;
    }

    // POST: Adicionar um novo funcionário
    async adicionarFuncionario(funcionario) {
        const { data } = await axios.post("/funcionarios/", funcionario);
        return data;
    }

    // PUT: Atualizar um funcionário existente
    async atualizarFuncionario(funcionario) {
        const { data } = await axios.put(`/funcionarios/${funcionario.id}/`, funcionario);
        return data;
    }

    // DELETE: Excluir um funcionário
    async excluirFuncionario(id) {
        await axios.delete(`/funcionarios/${id}/`);
    }

    // GET: Buscar lista de cargos (necessário para o dropdown)
    async buscarCargos() {
        // Assumindo que o endpoint /cargos/ retorna uma lista completa (sem paginação, se for para dropdown)
        const { data } = await axios.get(`/cargos/?ativo=true`);
        // Note: Retorna a lista completa ou a seção 'results' se usar paginação.
        return data.results ? data.results : data;
    }
}