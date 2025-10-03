// src/stores/funcionarioStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import FuncionarioApi from '@/api/FuncionarioApi' 

const funcionarioApi = new FuncionarioApi()

export const useFuncionarioStore = defineStore('funcionario', () => {
    // STATE:
    const funcionarios = ref([])
    const cargosDisponiveis = ref([]) // Para popular o select (Foreign Key)
    const meta = ref({
        page: 1,
        page_size: 0,
        total_pages: 1
    })
    const isLoading = ref(false)

    // ACTIONS:
    
    // Ação para buscar a lista de Cargos (necessária para o formulário)
    async function getCargosDisponiveis() {
        try {
            const data = await funcionarioApi.buscarCargos()
            cargosDisponiveis.value = data
        } catch (error) {
            console.error("Erro ao carregar cargos para o dropdown:", error)
        }
    }

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

    async function salvarFuncionario(funcionario) {
        // Envia o funcionário. O Serializer do Django cuida da FK (cargo)
        if (funcionario.id) {
            await funcionarioApi.atualizarFuncionario(funcionario)
            // Recarrega a lista para mostrar a atualização
            await getFuncionarios(meta.value.page) 
        } else {
            const data = await funcionarioApi.adicionarFuncionario(funcionario)
            funcionarios.value.unshift(data)
        }
    }

    async function excluirFuncionario(id) {
        await funcionarioApi.excluirFuncionario(id)
        const index = funcionarios.value.findIndex((f) => f.id === id)
        if (index !== -1) {
            funcionarios.value.splice(index, 1)
        }
    }
    
    // Ações de paginação (proximaPagina, paginaAnterior...)

    return {
        funcionarios,
        cargosDisponiveis,
        meta,
        isLoading,
        getCargosDisponiveis,
        getFuncionarios,
        salvarFuncionario,
        excluirFuncionario,
        // ... (retorno das funções de paginação)
    }
})
