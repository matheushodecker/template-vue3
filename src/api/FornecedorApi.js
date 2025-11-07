import axios from "axios";

// Assume que a URL base do Axios já foi configurada globalmente
// Ex: axios.defaults.baseURL = "http://localhost:8000/api";

export default class FornecedorApi {
    // GET: Buscar todos os fornecedores (com paginação e busca)
    async buscarTodosOsFornecedores(page = 1, search = "") {
        // Utiliza os filtros que o FornecedorViewSet deve estar configurado para receber
        const { data } = await axios.get(`/fornecedores/?page=${page}&search=${search}`);
        return data;
    }
    
    // --- NOVO MÉTODO ---
    // GET: Buscar TODOS os fornecedores (SEM paginação, para dropdowns)
    async buscarListaCompletaFornecedores() {
        // Chama a sua action @action 'todos' do ViewSet
        const { data } = await axios.get("/fornecedores/todos/");
        return data;
    }
    // --- FIM DO NOVO MÉTODO ---

    // POST: Adicionar um novo fornecedor
    async adicionarFornecedor(fornecedor) {
        // Envia o objeto Fornecedor completo
        const { data } = await axios.post("/fornecedores/", fornecedor);
        return data;
    }

    // PUT: Atualizar um fornecedor existente
    async atualizarFornecedor(fornecedor) {
        // Requer o ID na URL
        const { data } = await axios.put(`/fornecedores/${fornecedor.id}/`, fornecedor);
        return data;
    }

    // DELETE: Excluir um fornecedor
    async excluirFornecedor(id) {
        await axios.delete(`/fornecedores/${id}/`);
    }
}