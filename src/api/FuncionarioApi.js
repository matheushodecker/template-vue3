// src/api/FuncionarioApi.js
import axios from "axios";

export default class FuncionarioApi {
    // GET: Buscar todos os funcionários (com paginação e busca)
    async buscarTodosOsFuncionarios(page = 1, search = "") {
        const { data } = await axios.get(`/funcionarios/?page=${page}&search=${search}`);
        return data;
    }

    // --- NOVO MÉTODO ---
    // GET: Buscar TODOS os funcionários (SEM paginação, para dropdowns)
    async buscarListaCompletaFuncionarios() {
        // Esta URL /todos/ deve ser criada no seu backend (Django/DRF)
        const { data } = await axios.get("/funcionarios/todos/");
        return data;
    }
    // --- FIM DO NOVO MÉTODO ---

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

    // GET: Buscar lista de cargos (necessário para o dropdown do *próprio* funcionário)
    async buscarCargos() {
        const { data } = await axios.get(`/cargos/?ativo=true`);
        return data.results ? data.results : data;
    }
}