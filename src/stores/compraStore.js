// src/stores/compraStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import CompraApi from '@/api/CompraApi' 

// --- CORREÇÃO 1: Importar TODAS as stores de dependência ---
import { useFornecedorStore } from '@/stores/fornecedorStore'
import { useProdutoStore } from '@/stores/produtoStore'
import { useFuncionarioStore } from '@/stores/funcionarioStore' 

const compraApi = new CompraApi()

export const useCompraStore = defineStore('compra', () => {
    // STATE:
    const compras = ref([])
    const fornecedoresDisponiveis = ref([])
    const funcionariosDisponiveis = ref([])
    const produtosDisponiveis = ref([])  
    const meta = ref({ page: 1, total_pages: 1 })
    const isLoading = ref(false)

    // --- CORREÇÃO 2: Iniciar TODAS as stores ---
    // (Não precisa iniciar aqui, faremos dentro da action)

    // ACTIONS:
    
    // --- CORREÇÃO 3: A função loadDependencies foi 100% corrigida ---
    async function loadDependencies() {
        try {
            // Inicia as stores aqui dentro
            const fornecedorStore = useFornecedorStore()
            const produtoStore = useProdutoStore()
            const funcionarioStore = useFuncionarioStore()

            // Chama as actions "Todos" das stores de dependência
            // Não precisamos de "const [...] =" pois as stores se preenchem sozinhas
            await Promise.all([
                fornecedorStore.getFornecedoresTodos(),
                produtoStore.getProdutosTodos(),
                funcionarioStore.getFuncionariosTodos() // <-- Usando a store
            ]);
            
            // Atribui os valores lendo o state correto de cada store
            fornecedoresDisponiveis.value = fornecedorStore.listaCompletaFornecedores;
            produtosDisponiveis.value = produtoStore.produtos; // (No produtoStore, usamos o state 'produtos')
            funcionariosDisponiveis.value = funcionarioStore.listaCompletaFuncionarios;

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
    
    async function proximaPagina() {
      if (meta.value.page < meta.value.total_pages) {
        await getCompras(meta.value.page + 1)
      }
    }

    async function paginaAnterior() {
      if (meta.value.page > 1) {
        await getCompras(meta.value.page - 1)
      }
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
        proximaPagina,
        paginaAnterior,
    }
})