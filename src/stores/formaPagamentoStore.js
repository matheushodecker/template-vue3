// src/stores/formaPagamentoStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import FormaPagamentoApi from '@/api/FormaPagamentoApi' 

const formaPagamentoApi = new FormaPagamentoApi()

export const useFormaPagamentoStore = defineStore('formaPagamento', () => {
    // STATE:
    const formas = ref([])
    const meta = ref({
        page: 1, total_pages: 1
    })
    const isLoading = ref(false)

    // ACTIONS:
    
    async function getFormas(page = 1, search = '') {
        isLoading.value = true
        try {
            const data = await formaPagamentoApi.buscarTodasFormas(page, search)
            
            formas.value = data.results
            meta.value.page = page
            meta.value.total_pages = data.total_pages 

        } catch (error) {
            console.error("Erro ao carregar formas de pagamento:", error)
        } finally {
            isLoading.value = false
        }
    }

    async function salvarForma(forma) {
        if (forma.id) {
            await formaPagamentoApi.atualizarForma(forma)
        } else {
            const data = await formaPagamentoApi.adicionarForma(forma)
            formas.value.unshift(data)
        }
        await getFormas(meta.value.page); // Atualiza a lista
    }

    async function excluirForma(id) {
        await formaPagamentoApi.excluirForma(id)
        // Lógica otimista de remoção (você pode refinar isso)
        formas.value = formas.value.filter(f => f.id !== id);
    }

    // ... (funções de paginação omitidas por brevidade)

    return {
        formas,
        meta,
        isLoading,
        getFormas,
        salvarForma,
        excluirForma,
    }
})