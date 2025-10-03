// src/stores/produtoStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import ProdutoApi from '@/api/ProdutoApi' 

const produtoApi = new ProdutoApi()

// Define a ordenação padrão
const DEFAULT_ORDERING = '-id'; 

export const useProdutoStore = defineStore('produto', () => {
    // STATE:
    const produtos = ref([])
    const categoriasDisponiveis = ref([]) 
    const fornecedoresDisponiveis = ref([])  
    const meta = ref({ page: 1, total_pages: 1 })
    const isLoading = ref(false)

    // ACTIONS:
    
    async function loadDependencies() {
        try {
            const [categorias, fornecedores] = await Promise.all([
                produtoApi.buscarCategorias(),
                produtoApi.buscarFornecedores()
            ]);
            categoriasDisponiveis.value = categorias;
            fornecedoresDisponiveis.value = fornecedores;
        } catch (error) {
            console.error("Erro ao carregar dependências (Categorias/Fornecedores):", error)
        }
    }

    // Adiciona o parâmetro 'ordering' com valor padrão '-id'
    async function getProdutos(page = 1, search = '', ordering = DEFAULT_ORDERING) {
        isLoading.value = true
        try {
            const data = await produtoApi.buscarTodosProdutos(page, search, ordering)
            produtos.value = data.results
            meta.value.page = page
            meta.value.total_pages = data.total_pages 
        } catch (error) {
            console.error("Erro ao carregar produtos:", error)
        } finally {
            isLoading.value = false
        }
    }

    async function salvarProduto(produto) {
        if (produto.id) {
            await produtoApi.atualizarProduto(produto)
        } else {
            await produtoApi.adicionarProduto(produto)
        }
        // Ao salvar, atualiza a lista mantendo a ordenação
        await getProdutos(meta.value.page, '', DEFAULT_ORDERING); 
    }

    async function excluirProduto(id) {
        await produtoApi.excluirProduto(id)
        produtos.value = produtos.value.filter(p => p.id !== id);
    }
    
    // Funções de Paginação (mantêm a ordenação padrão)
    async function proximaPagina() {
        if (meta.value.page < meta.value.total_pages) {
            await getProdutos(meta.value.page + 1, '', DEFAULT_ORDERING);
        }
    }

    async function paginaAnterior() {
        if (meta.value.page > 1) {
            await getProdutos(meta.value.page - 1, '', DEFAULT_ORDERING);
        }
    }

    return {
        produtos,
        categoriasDisponiveis,
        fornecedoresDisponiveis,
        meta,
        isLoading,
        getProdutos,
        loadDependencies,
        salvarProduto,
        excluirProduto,
        proximaPagina, // Exporta para o template
        paginaAnterior, // Exporta para o template
    }
})
