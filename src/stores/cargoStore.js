// src/stores/cargoStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import CargoApi from '@/api/CargoApi' 

const cargoApi = new CargoApi()

export const useCargoStore = defineStore('cargo', () => {
    // STATE:
    const cargos = ref([])
    const meta = ref({
        page: 1,
        page_size: 0,
        total_pages: 1
    })
    const isLoading = ref(false)

    // ACTIONS:
    
    async function getCargos(page = 1, search = '') {
        isLoading.value = true
        try {
            const data = await cargoApi.buscarTodosOsCargos(page, search)
            
            cargos.value = data.results
            
            // Ajuste os metadados conforme o retorno da sua API
            meta.value.page = page
            meta.value.page_size = data.page_size 
            meta.value.total_pages = data.total_pages 

        } catch (error) {
            console.error("Erro ao carregar cargos:", error)
        } finally {
            isLoading.value = false
        }
    }

    async function salvarCargo(cargo) {
        if (cargo.id) {
            // Edição (PUT)
            const data = await cargoApi.atualizarCargo(cargo)
            const index = cargos.value.findIndex((c) => c.id === data.id)
            if (index !== -1) {
                cargos.value.splice(index, 1, data)
            }
        } else {
            // Criação (POST)
            const data = await cargoApi.adicionarCargo(cargo)
            cargos.value.unshift(data)
        }
    }

    async function excluirCargo(id) {
        await cargoApi.excluirCargo(id)
        const index = cargos.value.findIndex((cargo) => cargo.id === id)
        if (index !== -1) {
            cargos.value.splice(index, 1)
        }
    }
    
    async function proximaPagina() {
        if (meta.value.page < meta.value.total_pages) {
            await getCargos(meta.value.page + 1)
        }
    }

    async function paginaAnterior() {
        if (meta.value.page > 1) {
            await getCargos(meta.value.page - 1)
        }
    }

    return {
        cargos,
        meta,
        isLoading,
        getCargos,
        salvarCargo,
        excluirCargo,
        proximaPagina,
        paginaAnterior
    }
})
