// src/stores/pagamentoStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import PagamentoApi from '@/api/PagamentoApi' 

const pagamentoApi = new PagamentoApi()

export const usePagamentoStore = defineStore('pagamento', () => {
    // STATE:
    const pagamentos = ref([])
    const formasDisponiveis = ref([]) // Para o dropdown de FormaPagamento
    const vendasDisponiveis = ref([])  // Para o dropdown de Venda
    const meta = ref({ page: 1, total_pages: 1 })
    const isLoading = ref(false)

    // ACTIONS:
    
    // Carrega as dependências necessárias para os dropdowns
    async function loadDependencies() {
        try {
            const [formas, vendas] = await Promise.all([
                pagamentoApi.buscarFormasPagamento(),
                pagamentoApi.buscarVendasDisponiveis()
            ]);
            formasDisponiveis.value = formas;
            vendasDisponiveis.value = vendas;
        } catch (error) {
            console.error("Erro ao carregar dependências (Formas/Vendas):", error)
        }
    }

    async function getPagamentos(page = 1, search = '') {
        isLoading.value = true
        try {
            const data = await pagamentoApi.buscarTodosPagamentos(page, search)
            pagamentos.value = data.results
            meta.value.page = page
            meta.value.total_pages = data.total_pages 
        } catch (error) {
            console.error("Erro ao carregar pagamentos:", error)
        } finally {
            isLoading.value = false
        }
    }

    async function salvarPagamento(pagamento) {
        // Envia o objeto (o Serializer fará o mapeamento das FKs)
        if (pagamento.id) {
            await pagamentoApi.atualizarPagamento(pagamento)
        } else {
            await pagamentoApi.adicionarPagamento(pagamento)
        }
        await getPagamentos(meta.value.page); // Atualiza a lista
    }

    async function excluirPagamento(id) {
        await pagamentoApi.excluirPagamento(id)
        pagamentos.value = pagamentos.value.filter(p => p.id !== id);
    }

    return {
        pagamentos,
        formasDisponiveis,
        vendasDisponiveis,
        meta,
        isLoading,
        getPagamentos,
        loadDependencies,
        salvarPagamento,
        excluirPagamento,
    }
})
