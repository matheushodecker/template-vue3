// src/stores/clienteStore.js
import { ref } from 'vue'
import { defineStore } from 'pinia'
import ClienteApi from '@/api/ClienteApi' 

const clienteApi = new ClienteApi()

export const useClienteStore = defineStore('cliente', () => {
    // STATE:
    const clientes = ref([])
    const meta = ref({
        page: 1,
        page_size: 0,
        total_pages: 1
    })
    const isLoading = ref(false)

    // ACTIONS:
    
    async function getClientes(page = 1, search = '') {
        isLoading.value = true
        try {
            const data = await clienteApi.buscarTodosOsClientes(page, search)
            
            clientes.value = data.results
            
            meta.value.page = page
            meta.value.page_size = data.page_size 
            meta.value.total_pages = data.total_pages 

        } catch (error) {
            console.error("Erro ao carregar clientes:", error)
        } finally {
            isLoading.value = false
        }
    }

    async function salvarCliente(cliente) {
        if (cliente.id) {
            // Edição (PUT)
            await clienteApi.atualizarCliente(cliente)
            await getClientes(meta.value.page) // Recarrega a lista para mostrar a atualização
        } else {
            // Criação (POST)
            const data = await clienteApi.adicionarCliente(cliente)
            clientes.value.unshift(data)
        }
    }

    async function excluirCliente(id) {
        await clienteApi.excluirCliente(id)
        const index = clientes.value.findIndex((c) => c.id === id)
        if (index !== -1) {
            clientes.value.splice(index, 1)
        }
    }
    
    // (Ações de paginação omitidas por brevidade)

    return {
        clientes,
        meta,
        isLoading,
        getClientes,
        salvarCliente,
        excluirCliente,
        // ... (funções de paginação)
    }
})