import axios from "axios";

// Configuração base do Axios (ajuste a URL base do seu backend Django)
// Ex: Se o Django estiver rodando em http://localhost:8000
// const api = axios.create({ baseURL: "http://localhost:8000/api" }); 

// Usaremos a URL relativa /categorias/, assumindo que a base foi configurada globalmente no Axios.

export default class CategoriaApi {
  // GET: Buscar todas as categorias (com paginação e busca)
  async buscarTodasAsCategorias(page = 1, search = "") {
    // Utiliza os filtros que o CategoriaViewSet está configurado para receber
    const { data } = await axios.get(`/categorias/?page=${page}&search=${search}`);
    return data;
  }

  // POST: Adicionar uma nova categoria
  async adicionarCategoria(categoria) {
    // O Django espera { nome: '...', descricao: '...' }
    const { data } = await axios.post("/categorias/", categoria);
    return data;
  }

  // PUT: Atualizar uma categoria existente
  async atualizarCategoria(categoria) {
    // Requer o ID na URL
    const { data } = await axios.put(`/categorias/${categoria.id}/`, categoria);
    // Note: O DRF retorna o objeto atualizado no body (data)
    return data; 
  }

  // DELETE: Excluir uma categoria
  async excluirCategoria(id) {
    // O DRF retorna status 204 (No Content)
    await axios.delete(`/categorias/${id}/`);
  }
}