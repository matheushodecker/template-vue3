// src/stores/compraStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import CompraApi from '@/api/CompraApi' 

const compraApi = new CompraApi()

export const useCompraStore = defineStore('compra', () => {
    // STATE:
    const compras = ref([])
    const fornecedoresDisponiveis = ref([])
    const funcionariosDisponiveis = ref([])
    const produtosDisponiveis = ref([])  
    const meta = ref({ page: 1, total_pages: 1 })
    const isLoading = ref(false)

    // ACTIONS:
    
    // Carrega as dependências necessárias para os dropdowns
    async function loadDependencies() {
        try {
            const [fornecedores, funcionarios, produtos] = await Promise.all([
                compraApi.buscarFornecedores(),
                compraApi.buscarFuncionarios(),
                compraApi.buscarProdutos()
            ]);
            fornecedoresDisponiveis.value = fornecedores;
            funcionariosDisponiveis.value = funcionarios;
            produtosDisponiveis.value = produtos;
        } catch (error) {
            console.error("Erro ao carregar dependências (Fornecedores/Funcionários/Produtos):", error)
        }
    }

    async function getCompras(page = 1, search = '') {
        isLoading.value = true
        try {
            const data = await compraApi.buscarTodasCompras(page, search)
            compras.value = data.results
            meta.value.page = page
            meta.value.total_pages = data.total_pages 
        } catch (error) {
            console.error("Erro ao carregar compras:", error)
        } finally {
            isLoading.value = false
        }
    }

    async function salvarCompra(compra) {
        if (compra.id) {
            await compraApi.atualizarCompra(compra)
        } else {
            await compraApi.adicionarCompra(compra)
        }
        await getCompras(meta.value.page); 
    }

    async function excluirCompra(id) {
        await compraApi.excluirCompra(id)
        compras.value = compras.value.filter(c => c.id !== id);
    }

    return {
        compras,
        fornecedoresDisponiveis,
        funcionariosDisponiveis,
        produtosDisponiveis,
        meta,
        isLoading,
        getCompras,
        loadDependencies,
        salvarCompra,
        excluirCompra,
    }
})