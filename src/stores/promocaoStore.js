// src/stores/promocaoStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import PromocaoApi from '@/api/PromocaoApi' 

const promocaoApi = new PromocaoApi()

export const usePromocaoStore = defineStore('promocao', () => {
    // STATE:
    const promocoes = ref([])
    const produtosDisponiveis = ref([]) // Para o dropdown de produtos
    const meta = ref({ page: 1, total_pages: 1 })
    const isLoading = ref(false)

    // ACTIONS:
    
    // Carrega os Produtos (para o detalhe da promoção)
    async function loadDependencies() {
        try {
            const produtos = await promocaoApi.buscarProdutosDisponiveis()
            produtosDisponiveis.value = produtos;
        } catch (error) {
            console.error("Erro ao carregar produtos:", error)
        }
    }

    async function getPromocoes(page = 1, search = '') {
        isLoading.value = true
        try {
            const data = await promocaoApi.buscarTodasPromocoes(page, search)
            promocoes.value = data.results
            meta.value.page = page
            meta.value.total_pages = data.total_pages 
        } catch (error) {
            console.error("Erro ao carregar promoções:", error)
        } finally {
            isLoading.value = false
        }
    }

    async function salvarPromocao(promocao) {
        if (promocao.id) {
            await promocaoApi.atualizarPromocao(promocao)
        } else {
            await promocaoApi.adicionarPromocao(promocao)
        }
        await getPromocoes(meta.value.page); 
    }

    async function excluirPromocao(id) {
        await promocaoApi.excluirPromocao(id)
        promocoes.value = promocoes.value.filter(p => p.id !== id);
    }

    return {
        promocoes,
        produtosDisponiveis,
        meta,
        isLoading,
        getPromocoes,
        loadDependencies,
        salvarPromocao,
        excluirPromocao,
    }
})
