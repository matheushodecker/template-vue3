// src/stores/estoqueStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import EstoqueApi from '@/api/EstoqueApi' 

const estoqueApi = new EstoqueApi()

export const useEstoqueStore = defineStore('estoque', () => {
    // STATE:
    const estoques = ref([])
    const produtosDisponiveis = ref([])
    const funcionariosDisponiveis = ref([])
    const meta = ref({ page: 1, total_pages: 1 })
    const isLoading = ref(false)

    // ACTIONS:
    
    async function loadDependencies() {
        try {
            const [produtos, funcionarios] = await Promise.all([
                estoqueApi.buscarProdutos(),
                estoqueApi.buscarFuncionarios()
            ]);
            produtosDisponiveis.value = produtos;
            funcionariosDisponiveis.value = funcionarios;
        } catch (error) {
            console.error("Erro ao carregar dependências:", error)
        }
    }

    async function getEstoques(page = 1, search = '') {
        isLoading.value = true
        try {
            const data = await estoqueApi.buscarTodosEstoques(page, search)
            estoques.value = data.results
            meta.value.page = page
            meta.value.total_pages = data.total_pages 
        } catch (error) {
            console.error("Erro ao carregar estoques:", error)
        } finally {
            isLoading.value = false
        }
    }
    
    // Ação para registrar uma nova movimentação (Entrada/Saída/Ajuste)
    async function registrarMovimentacao(movimentacao) {
        try {
            // O backend deve calcular a quantidade_anterior, quantidade_atual e atualizar o Estoque.
            const data = await estoqueApi.registrarMovimentacao(movimentacao);
            
            // Após a movimentação, recarrega a lista para refletir a nova quantidade
            await getEstoques(meta.value.page);
            return data;
        } catch (error) {
            console.error("Erro ao registrar movimentação:", error);
            throw error;
        }
    }

    // Ação para atualizar limites e localização (CRUD direto no Estoque)
    async function atualizarLimites(estoque) {
        try {
            await estoqueApi.atualizarEstoque(estoque);
            await getEstoques(meta.value.page);
        } catch (error) {
            console.error("Erro ao atualizar limites:", error);
            throw error;
        }
    }


    return {
        estoques,
        produtosDisponiveis,
        funcionariosDisponiveis,
        meta,
        isLoading,
        getEstoques,
        loadDependencies,
        registrarMovimentacao,
        atualizarLimites,
    }
})
