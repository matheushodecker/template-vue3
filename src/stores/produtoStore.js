// src/stores/produtoStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import ProdutoApi from '@/api/ProdutoApi'
// Não precisamos mais importar as outras stores aqui

const produtoApi = new ProdutoApi()

const DEFAULT_ORDERING = '-id'

export const useProdutoStore = defineStore('produto', () => {
  // STATE:
  const produtos = ref([]) 
  // REMOVIDOS:
  // const categoriasDisponiveis = ref([])
  // const fornecedoresDisponiveis = ref([]) 
  const meta = ref({ page: 1, total_pages: 1, total_items: 0 }) 
  const isLoading = ref(false)

  // ACTIONS:

  // REMOVIDO:
  // async function loadDependencies() { ... }

  // (O restante do seu produtoStore.js - getProdutos, getProdutosTodos, salvar, etc.)
  
  async function getProdutos(page = 1, search = '', ordering = DEFAULT_ORDERING) {
    isLoading.value = true
    try {
      const data = await produtoApi.buscarTodosProdutos(page, search, ordering)
      produtos.value = Array.isArray(data?.results) ? data.results : []
      meta.value.page = page
      meta.value.total_pages = typeof data?.total_pages === 'number' ? data.total_pages : 1
      meta.value.total_items = typeof data?.count === 'number' ? data.count : 0
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function getProdutosTodos({ search = '', ordering = DEFAULT_ORDERING } = {}) {
    isLoading.value = true
    try {
      const data = await produtoApi.buscarTodosProdutosSemPaginacao(search, ordering)
      produtos.value = Array.isArray(data) ? data : []
      meta.value.page = 1
      meta.value.total_pages = 1
      meta.value.total_items = produtos.value.length
    } catch (error) {
      console.error('Erro ao carregar todos os produtos:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function salvarProduto(produto) {
    if (produto.id) {
      await produtoApi.atualizarProduto(produto)
    } else {
      await produtoApi.adicionarProduto(produto)
    }
    await getProdutos(meta.value.page, '', DEFAULT_ORDERING)
  }

  async function excluirProduto(id) {
    await produtoApi.excluirProduto(id)
    await getProdutos(meta.value.page, '', DEFAULT_ORDERING)
  }

  async function proximaPagina() {
    if (meta.value.page < meta.value.total_pages) {
      await getProdutos(meta.value.page + 1, '', DEFAULT_ORDERING)
    }
  }

  async function paginaAnterior() {
    if (meta.value.page > 1) {
      await getProdutos(meta.value.page - 1, '', DEFAULT_ORDERING)
    }
  }

  return {
    produtos,
    // REMOVIDOS:
    // categoriasDisponiveis,
    // fornecedoresDisponiveis,
    meta,
    isLoading,
    getProdutos,
    getProdutosTodos,
    // REMOVIDO:
    // loadDependencies,
    salvarProduto,
    excluirProduto,
    proximaPagina,
    paginaAnterior,
  }
})