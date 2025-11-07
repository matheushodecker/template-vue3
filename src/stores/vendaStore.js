// src/stores/vendaStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import VendaApi from '@/api/VendaApi' 
// 1. Importar a store de produto (que tem a nova função /todos/)
import { useProdutoStore } from '@/stores/produtoStore'

const vendaApi = new VendaApi()

export const useVendaStore = defineStore('venda', () => {
    // STATE:
    const vendas = ref([])
    const funcionariosDisponiveis = ref([]) 
    const produtosDisponiveis = ref([])  
    const meta = ref({ page: 1, total_pages: 1 })
    const isLoading = ref(false)

    // 2. Inicializar a store de produto
    const produtoStore = useProdutoStore()

    // ACTIONS:
    
    // Carrega as dependências necessárias para os dropdowns
    async function loadDependencies() {
        try {
            // 3. Modificamos o Promise.all:
            // - Removemos vendaApi.buscarProdutos()
            // - Adicionamos produtoStore.getProdutosTodos()
            const [funcionarios] = await Promise.all([
                vendaApi.buscarFuncionarios(),
                produtoStore.getProdutosTodos() // <-- USA A FUNÇÃO CORRETA
            ]);
            
            funcionariosDisponiveis.value = funcionarios;
            
            // 4. Atribuímos o resultado da produtoStore ao nosso ref local
            produtosDisponiveis.value = produtoStore.produtos;

        } catch (error) {
            console.error("Erro ao carregar dependências (Funcionários/Produtos):", error)
        }
    }

    async function getVendas(page = 1, search = '') {
        isLoading.value = true
        try {
            // (Sugestão: Adicionar ordenação padrão '-id' para ver as mais novas)
            const data = await vendaApi.buscarTodasVendas(page, search, '-id') 
            
            // (Mais seguro verificar 'data.results')
            vendas.value = Array.isArray(data?.results) ? data.results : []
            meta.value.page = page
            meta.value.total_pages = data.total_pages || 1
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
    
    // (Sugestão: Adicionar funções de paginação que faltavam no seu original)
    async function proximaPagina() {
      if (meta.value.page < meta.value.total_pages) {
        await getVendas(meta.value.page + 1)
      }
    }

    async function paginaAnterior() {
      if (meta.value.page > 1) {
        await getVendas(meta.value.page - 1)
      }
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
        proximaPagina,  // Adicionado
        paginaAnterior, // Adicionado
    }
})