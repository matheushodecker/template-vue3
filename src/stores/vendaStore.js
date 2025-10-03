// src/stores/vendaStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import VendaApi from '@/api/VendaApi' 

const vendaApi = new VendaApi()

export const useVendaStore = defineStore('venda', () => {
    // STATE:
    const vendas = ref([])
    const funcionariosDisponiveis = ref([]) 
    const produtosDisponiveis = ref([])  
    const meta = ref({ page: 1, total_pages: 1 })
    const isLoading = ref(false)

    // ACTIONS:
    
    // Carrega as dependências necessárias para os dropdowns
    async function loadDependencies() {
        try {
            const [funcionarios, produtos] = await Promise.all([
                vendaApi.buscarFuncionarios(),
                vendaApi.buscarProdutos()
            ]);
            funcionariosDisponiveis.value = funcionarios;
            produtosDisponiveis.value = produtos;
        } catch (error) {
            console.error("Erro ao carregar dependências (Funcionários/Produtos):", error)
        }
    }

    async function getVendas(page = 1, search = '') {
        isLoading.value = true
        try {
            const data = await vendaApi.buscarTodasVendas(page, search)
            vendas.value = data.results
            meta.value.page = page
            meta.value.total_pages = data.total_pages 
        } catch (error) {
            console.error("Erro ao carregar vendas:", error)
        } finally {
            isLoading.value = false
        }
    }

    async function salvarVenda(venda) {
        if (venda.id) {
            await vendaApi.atualizarVenda(venda)
        } else {
            await vendaApi.adicionarVenda(venda)
        }
        await getVendas(meta.value.page); // Atualiza a lista
    }

    async function excluirVenda(id) {
        await vendaApi.excluirVenda(id)
        vendas.value = vendas.value.filter(v => v.id !== id);
    }

    return {
        vendas,
        funcionariosDisponiveis,
        produtosDisponiveis,
        meta,
        isLoading,
        getVendas,
        loadDependencies,
        salvarVenda,
        excluirVenda,
    }
})
