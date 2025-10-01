import { ref } from 'vue'
import { defineStore } from 'pinia'
import CategoriaApi from '@/api/CategoriaApi' // Ajuste o caminho conforme sua estrutura

const categoriaApi = new CategoriaApi()

export const useCategoriaStore = defineStore('categoria', () => {
  // STATE:
  const categorias = ref([])
  const meta = ref({
    page: 1,
    page_size: 0,
    total_pages: 1
  })
  const isLoading = ref(false)

  // ACTIONS:

  // 1. Ação de Leitura e População do Estado (inclui paginação e busca)
  async function getCategorias(page = 1, search = '') {
    isLoading.value = true
    try {
        const data = await categoriaApi.buscarTodasAsCategorias(page, search)
        
        // O DRF com paginação padrão retorna um objeto com 'results' e os metadados
        categorias.value = data.results
        
        // Atualiza os metadados para controle de paginação
        meta.value.page = page
        meta.value.page_size = data.page_size // Exemplo, depende da sua implementação DRF
        meta.value.total_pages = data.total_pages // Exemplo, depende da sua implementação DRF

    } catch (error) {
        console.error("Erro ao carregar categorias:", error)
        // Lógica para tratar erros da API
    } finally {
        isLoading.value = false
    }
  }

  // 2. Ação de Criação e Edição (o coração do CRUD)
  async function salvarCategoria(categoria) {
    if (categoria.id) {
      // Edição (PUT)
      const data = await categoriaApi.atualizarCategoria(categoria)
      // Atualização otimizada no estado local
      const index = categorias.value.findIndex((c) => c.id === data.id)
      if (index !== -1) {
          categorias.value.splice(index, 1, data)
      }
    } else {
      // Criação (POST)
      const data = await categoriaApi.adicionarCategoria(categoria)
      // Adiciona a nova categoria no início da lista (sem recarregar)
      categorias.value.unshift(data)
    }
  }

  // 3. Ação de Exclusão
  async function excluirCategoria(id) {
    await categoriaApi.excluirCategoria(id)
    // Exclusão otimizada no estado local
    const index = categorias.value.findIndex((categoria) => categoria.id === id)
    if (index !== -1) {
        categorias.value.splice(index, 1)
    }
  }
  
  // 4. Ações de Paginação
  async function proximaPagina() {
    if (meta.value.page < meta.value.total_pages) {
        await getCategorias(meta.value.page + 1)
    }
  }

  async function paginaAnterior() {
    if (meta.value.page > 1) {
        await getCategorias(meta.value.page - 1)
    }
  }

  return {
    categorias,
    meta,
    isLoading,
    getCategorias,
    salvarCategoria,
    excluirCategoria,
    proximaPagina,
    paginaAnterior
  }
})