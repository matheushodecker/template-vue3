import { ref } from 'vue'
import { defineStore } from 'pinia'
import CategoriaApi from '@/api/CategoriaApi' // Ajuste o caminho conforme sua estrutura

const categoriaApi = new CategoriaApi()

export const useCategoriaStore = defineStore('categoria', () => {
  // STATE:
  const categorias = ref([]) // Lista paginada para o CRUD
  const meta = ref({
    page: 1,
    page_size: 0,
    total_pages: 1
  })
  const isLoading = ref(false)

  // NOVO: State para a lista completa (usada em dropdowns)
  const listaCompletaCategorias = ref([])

  // ACTIONS:

  // 1. Ação de Leitura Paginada (para o CRUD de Categorias)
  async function getCategorias(page = 1, search = '') {
    isLoading.value = true
    try {
        const data = await categoriaApi.buscarTodasAsCategorias(page, search)
        categorias.value = data.results
        meta.value.page = page
        meta.value.page_size = data.page_size 
        meta.value.total_pages = data.total_pages
    } catch (error) {
        console.error("Erro ao carregar categorias:", error)
    } finally {
        isLoading.value = false
    }
  }

  // NOVO: Ação para carregar a lista completa (para o dropdown do ProdutoView)
  async function getCategoriasTodas() {
      // Otimização: Se a lista já foi carregada, não busca novamente.
      if (listaCompletaCategorias.value.length > 0) {
          return;
      }

      try {
          // Chama a nova função da CategoriaApi
          const data = await categoriaApi.buscarListaCompletaCategorias()
          listaCompletaCategorias.value = data
      } catch (error) {
          console.error("Erro ao carregar lista completa de categorias:", error)
      }
  }

  // 2. Ação de Criação e Edição
  async function salvarCategoria(categoria) {
    if (categoria.id) {
      // Edição (PUT)
      const data = await categoriaApi.atualizarCategoria(categoria)
      const index = categorias.value.findIndex((c) => c.id === data.id)
      if (index !== -1) {
          categorias.value.splice(index, 1, data)
      }
    } else {
      // Criação (POST)
      const data = await categoriaApi.adicionarCategoria(categoria)
      categorias.value.unshift(data)
    }
  }

  // 3. Ação de Exclusão
  async function excluirCategoria(id) {
    await categoriaApi.excluirCategoria(id)
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

  // ATUALIZAÇÃO: Expor os novos states e actions
  return {
    categorias,
    meta,
    isLoading,
    getCategorias,
    salvarCategoria,
    excluirCategoria,
    proximaPagina,
    paginaAnterior,
    
    // NOVO: Itens expostos para o ProdutoView
    listaCompletaCategorias,
    getCategoriasTodas
  }
})