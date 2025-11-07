// src/stores/fornecedorStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import FornecedorApi from '@/api/FornecedorApi'

const fornecedorApi = new FornecedorApi()

export const useFornecedorStore = defineStore('fornecedor', () => {
    // STATE:
    const fornecedores = ref([]) // Lista paginada para o CRUD
    const meta = ref({
        page: 1,
        page_size: 0,
        total_pages: 1
    })
    const isLoading = ref(false)
    
    // NOVO: State para a lista completa (usada em dropdowns)
    const listaCompletaFornecedores = ref([])

    // ACTIONS:

    // Ação de Leitura paginada (para o CRUD de Fornecedores)
    async function getFornecedores(page = 1, search = '') {
        isLoading.value = true
        try {
            const data = await fornecedorApi.buscarTodosOsFornecedores(page, search)
            fornecedores.value = data.results
            meta.value.page = page
            meta.value.page_size = data.page_size 
            meta.value.total_pages = data.total_pages 
        } catch (error) {
            console.error("Erro ao carregar fornecedores:", error)
        } finally {
            isLoading.value = false
        }
    }
    
    // NOVO: Ação para carregar a lista completa (para o dropdown do ProdutoView)
    async function getFornecedoresTodos() {
        // Se a lista já foi carregada uma vez, não busca novamente.
        if (listaCompletaFornecedores.value.length > 0) {
            return;
        }

        try {
            // Chama a API que busca a lista não paginada
            const data = await fornecedorApi.buscarListaCompletaFornecedores()
            listaCompletaFornecedores.value = data
        } catch (error) {
            console.error("Erro ao carregar lista completa de fornecedores:", error)
        }
    }

    // (O restante das suas ações - salvar, excluir, paginação - permanece igual)
    async function salvarFornecedor(fornecedor) {
        if (fornecedor.id) {
            const data = await fornecedorApi.atualizarFornecedor(fornecedor)
            const index = fornecedores.value.findIndex((f) => f.id === data.id)
            if (index !== -1) {
                fornecedores.value.splice(index, 1, data)
            }
        } else {
            const data = await fornecedorApi.adicionarFornecedor(fornecedor)
            fornecedores.value.unshift(data)
        }
    }

    async function excluirFornecedor(id) {
        await fornecedorApi.excluirFornecedor(id)
        const index = fornecedores.value.findIndex((fornecedor) => fornecedor.id === id)
        if (index !== -1) {
            fornecedores.value.splice(index, 1)
        }
    }
    
    async function proximaPagina() {
        if (meta.value.page < meta.value.total_pages) {
            await getFornecedores(meta.value.page + 1)
        }
    }

    async function paginaAnterior() {
        if (meta.value.page > 1) {
            await getFornecedores(meta.value.page - 1)
        }
    }

    // Expondo os novos dados no return:
    return {
        fornecedores,
        meta,
        isLoading,
        listaCompletaFornecedores, // NOVO: Expor o state
        getFornecedores,
        salvarFornecedor,
        excluirFornecedor,
        proximaPagina,
        paginaAnterior,
        getFornecedoresTodos      // NOVO: Expor a action
    }
})