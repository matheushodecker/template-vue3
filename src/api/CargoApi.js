// src/api/CargoApi.js
import axios from "axios";

// Assumindo que axios.defaults.baseURL já está configurado globalmente

export default class CargoApi {
    // GET: Buscar todos os cargos (com paginação e busca)
    async buscarTodosOsCargos(page = 1, search = "") {
        // Utiliza os filtros definidos no CargoViewSet
        const { data } = await axios.get(`/cargos/?page=${page}&search=${search}`);
        return data;
    }

    // POST: Adicionar um novo cargo
    async adicionarCargo(cargo) {
        // Envia o objeto Cargo completo
        const { data } = await axios.post("/cargos/", cargo);
        return data;
    }

    // PUT: Atualizar um cargo existente
    async atualizarCargo(cargo) {
        // Requer o ID na URL
        const { data } = await axios.put(`/cargos/${cargo.id}/`, cargo);
        return data;
    }

    // DELETE: Excluir um cargo
    async excluirCargo(id) {
        await axios.delete(`/cargos/${id}/`);
    }
}