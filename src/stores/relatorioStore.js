// src/stores/relatorioStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import RelatorioApi from '@/api/RelatorioApi' 

const relatorioApi = new RelatorioApi()

export const useRelatorioStore = defineStore('relatorio', () => {
    // STATE:
    const relatoriosVenda = ref([])
    const relatoriosEstoque = ref([])
    const funcionariosDisponiveis = ref([])
    const metaVenda = ref({ page: 1, total_pages: 1 })
    const metaEstoque = ref({ page: 1, total_pages: 1 })
    const isLoading = ref(false)
    
    // NOVO: Estado para capturar e exibir erros da API de Vendas
    const erroVenda = ref(null) 

    // ACTIONS:
    
    async function loadDependencies() {
        // ... (lógica de carregamento de funcionários mantida) ...
        try {
            const funcionarios = await relatorioApi.buscarFuncionarios();
            funcionariosDisponiveis.value = funcionarios;
        } catch (error) {
            console.error("Erro ao carregar funcionários:", error)
        }
    }

    // --- VENDAS ---
    async function getRelatoriosVenda(page = 1) {
        isLoading.value = true
        erroVenda.value = null // Limpa o erro anterior
        try {
            const data = await relatorioApi.buscarRelatoriosVenda(page);
            relatoriosVenda.value = data.results
            metaVenda.value.page = page
            metaVenda.value.total_pages = data.total_pages 
        } catch (error) {
            console.error("Erro ao carregar relatórios de venda:", error)
            // CRÍTICO: Armazena a mensagem de erro para exibição
            erroVenda.value = "Não foi possível carregar os Relatórios de Venda. Verifique a API ou o console."
        } finally {
            isLoading.value = false
        }
    }
    async function gerarRelatorioVenda(relatorio) {
        await relatorioApi.gerarRelatorioVenda(relatorio);
        await getRelatoriosVenda(1); 
    }

    // --- ESTOQUE ---
    async function getRelatoriosEstoque(page = 1) {
        isLoading.value = true
        try {
            const data = await relatorioApi.buscarRelatoriosEstoque(page);
            relatoriosEstoque.value = data.results
            metaEstoque.value.page = page
            metaEstoque.value.total_pages = data.total_pages 
        } catch (error) {
            console.error("Erro ao carregar relatórios de estoque:", error)
        } finally {
            isLoading.value = false
        }
    }
    async function gerarRelatorioEstoque(relatorio) {
        await relatorioApi.gerarRelatorioEstoque(relatorio);
        await getRelatoriosEstoque(1);
    }

    return {
        relatoriosVenda,
        relatoriosEstoque,
        funcionariosDisponiveis,
        metaVenda,
        metaEstoque,
        isLoading,
        erroVenda, // EXPOR O NOVO STATE
        loadDependencies,
        getRelatoriosVenda,
        gerarRelatorioVenda,
        getRelatoriosEstoque,
        gerarRelatorioEstoque,
    }
})