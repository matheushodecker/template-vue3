// src/stores/funcionarioStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import FuncionarioApi from '@/api/FuncionarioApi' 

const funcionarioApi = new FuncionarioApi()

export const useFuncionarioStore = defineStore('funcionario', () => {
    // STATE:
    const funcionarios = ref([]) // Lista paginada para o CRUD
    const cargosDisponiveis = ref([]) // Para o formulário de Funcionário
    const meta = ref({
        page: 1,
        page_size: 0,
        total_pages: 1
    })
    const isLoading = ref(false)

    // NOVO: State para a lista completa (usada em dropdowns de *outros* views)
    const listaCompletaFuncionarios = ref([])

    // ACTIONS:
    
    // Ação para buscar Cargos (para o formulário de Funcionário)
    async function getCargosDisponiveis() {
        try {
            const data = await funcionarioApi.buscarCargos()
            cargosDisponiveis.value = data
        } catch (error) {
            console.error("Erro ao carregar cargos para o dropdown:", error)
        }
    }

    // Ação de Leitura Paginada (para o CRUD de Funcionários)
    async function getFuncionarios(page = 1, search = '') {
        isLoading.value = true
        try {
            const data = await funcionarioApi.buscarTodosOsFuncionarios(page, search)
            funcionarios.value = data.results
            meta.value.page = page
            meta.value.page_size = data.page_size 
            meta.value.total_pages = data.total_pages 
        } catch (error) {
            console.error("Erro ao carregar funcionários:", error)
        } finally {
            isLoading.value = false
        }
    }

    // NOVO: Ação para carregar a lista completa (para o dropdown do ComprasView)
    async function getFuncionariosTodos() {
        // Otimização: Se a lista já foi carregada, não busca novamente.
        if (listaCompletaFuncionarios.value.length > 0) {
            return;
        }
        try {
            // Chama a nova função da FuncionarioApi
            const data = await funcionarioApi.buscarListaCompletaFuncionarios()
            listaCompletaFuncionarios.value = data
        } catch (error) {
            console.error("Erro ao carregar lista completa de funcionários:", error)
        }
    }

    // Ação de salvar (Criação/Edição)
    async function salvarFuncionario(funcionario) {
        if (funcionario.id) {
            await funcionarioApi.atualizarFuncionario(funcionario)
            await getFuncionarios(meta.value.page) 
        } else {
            const data = await funcionarioApi.adicionarFuncionario(funcionario)
            funcionarios.value.unshift(data)
        }
    }

    // Ação de Exclusão
    async function excluirFuncionario(id) {
        await funcionarioApi.excluirFuncionario(id)
        const index = funcionarios.value.findIndex((f) => f.id === id)
        if (index !== -1) {
            funcionarios.value.splice(index, 1)
        }
    }
    
    // Ações de paginação (proximaPagina, paginaAnterior...)

    // ATUALIZAÇÃO: Expor os novos states e actions
    return {
        funcionarios,
        cargosDisponiveis,
        meta,
        isLoading,
        getCargosDisponiveis,
        getFuncionarios,
        salvarFuncionario,
        excluirFuncionario,
        
        // NOVO: Itens expostos para o ComprasView
        listaCompletaFuncionarios,
        getFuncionariosTodos
    }
})