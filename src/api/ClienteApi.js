// src/api/ClienteApi.js
import axios from "axios";

export default class ClienteApi {
    // GET: Buscar todos os clientes (com paginação e busca)
    async buscarTodosOsClientes(page = 1, search = "") {
        const { data } = await axios.get(`/clientes/?page=${page}&search=${search}`);
        return data;
    }

    // POST: Adicionar um novo cliente
    async adicionarCliente(cliente) {
        const { data } = await axios.post("/clientes/", cliente);
        return data;
    }

    // PUT: Atualizar um cliente existente
    async atualizarCliente(cliente) {
        const { data } = await axios.put(`/clientes/${cliente.id}/`, cliente);
        return data;
    }

    // DELETE: Excluir um cliente
    async excluirCliente(id) {
        await axios.delete(`/clientes/${id}/`);
    }
}