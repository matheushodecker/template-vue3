// src/stores/fornecedorStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import FornecedorApi from '@/api/FornecedorApi' // O novo arquivo de API

const fornecedorApi = new FornecedorApi()

export const useFornecedorStore = defineStore('fornecedor', () => {
    // STATE:
    const fornecedores = ref([])
    const meta = ref({
        page: 1,
        page_size: 0,
        total_pages: 1
    })
    const isLoading = ref(false)

    // ACTIONS:

    // 1. Ação de Leitura e População do Estado (inclui paginação e busca)
    async function getFornecedores(page = 1, search = '') {
        isLoading.value = true
        try {
            const data = await fornecedorApi.buscarTodosOsFornecedores(page, search)
            
            // Assume que o DRF com paginação padrão retorna 'results' e os metadados
            fornecedores.value = data.results
            
            // Atualiza os metadados para controle de paginação
            // Nota: Se você estiver usando o CustomPagination do DRF, ajuste estes campos.
            meta.value.page = page
            meta.value.page_size = data.page_size 
            meta.value.total_pages = data.total_pages 

        } catch (error) {
            console.error("Erro ao carregar fornecedores:", error)
        } finally {
            isLoading.value = false
        }
    }

    // 2. Ação de Criação e Edição
    async function salvarFornecedor(fornecedor) {
        if (fornecedor.id) {
            // Edição (PUT)
            const data = await fornecedorApi.atualizarFornecedor(fornecedor)
            // Atualização otimizada no estado local
            const index = fornecedores.value.findIndex((f) => f.id === data.id)
            if (index !== -1) {
                fornecedores.value.splice(index, 1, data)
            }
        } else {
            // Criação (POST)
            const data = await fornecedorApi.adicionarFornecedor(fornecedor)
            // Adiciona o novo fornecedor no início da lista (sem recarregar)
            fornecedores.value.unshift(data)
        }
    }

    // 3. Ação de Exclusão
    async function excluirFornecedor(id) {
        await fornecedorApi.excluirFornecedor(id)
        // Exclusão otimizada no estado local
        const index = fornecedores.value.findIndex((fornecedor) => fornecedor.id === id)
        if (index !== -1) {
            fornecedores.value.splice(index, 1)
        }
    }
    
    // 4. Ações de Paginação
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

    return {
        fornecedores,
        meta,
        isLoading,
        getFornecedores,
        salvarFornecedor,
        excluirFornecedor,
        proximaPagina,
        paginaAnterior
    }
})