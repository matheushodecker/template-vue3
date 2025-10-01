<script setup>
import { reactive, onMounted } from 'vue'
import { useCategoriaStore } from '@/stores/categoriaStore' // Ajuste o caminho

const categoriaStore = useCategoriaStore()

// 1. Estado Local para o Formulário
const defaultCategoria = { id: null, nome: '', descricao: '', ativo: true }
const categoria = reactive({ ...defaultCategoria })

// 2. Ciclo de Vida: Carregar dados ao montar
onMounted(async () => {
  await categoriaStore.getCategorias()
})

// 3. Funções de Ação
function limpar() {
  Object.assign(categoria, { ...defaultCategoria })
}

async function salvar() {
  if (!categoria.nome.trim()) {
    alert("O nome da categoria é obrigatório.")
    return
  }
  await categoriaStore.salvarCategoria({ ...categoria })
  limpar()
}

function editar(categoria_para_editar) {
  // Garante que o estado local reflita a categoria clicada
  Object.assign(categoria, categoria_para_editar)
}

async function excluir(id) {
  if (confirm("Tem certeza que deseja excluir esta categoria?")) {
    await categoriaStore.excluirCategoria(id)
    limpar()
  }
}
</script>

<template>
  <div class="container">
    <h1>Gerenciamento de Categorias</h1>

    <div class="form-container">
      <h2>{{ categoria.id ? 'Editar Categoria' : 'Nova Categoria' }}</h2>
      <div class="form-group">
        <input type="text" v-model="categoria.nome" placeholder="Nome da Categoria" />
        <textarea v-model="categoria.descricao" placeholder="Descrição (Opcional)"></textarea>
      </div>
      <div class="form-actions">
        <button @click="salvar" :disabled="categoriaStore.isLoading">
          {{ categoria.id ? 'Atualizar' : 'Salvar' }}
        </button>
        <button @click="limpar" class="cancelar" :disabled="categoriaStore.isLoading">
          Cancelar
        </button>
      </div>
    </div>
    
    <hr>

    <div v-if="categoriaStore.isLoading" class="loading-message">
        Carregando dados...
    </div>

    <ul class="categoria-list" v-else>
      <li v-for="cat in categoriaStore.categorias" :key="cat.id" :class="{ 'categoria-inativa': !cat.ativo }">
        <span class="categoria-info" @click="editar(cat)">
          <span class="id-tag">#{{ cat.id }}</span>
          <strong>{{ cat.nome }}</strong> 
          <span class="descricao">{{ cat.descricao }}</span>
        </span>
        <div class="actions">
          <button @click="editar(cat)" class="editar">Editar</button>
          <button @click="excluir(cat.id)" class="excluir">Excluir</button>
        </div>
      </li>
    </ul>

    <div class="paginator" v-if="categoriaStore.meta.total_pages > 1">
      <button 
        :disabled="categoriaStore.meta.page <= 1 || categoriaStore.isLoading" 
        @click="categoriaStore.paginaAnterior"
      >
        Anterior
      </button>
      <span>Página {{ categoriaStore.meta.page }} de {{ categoriaStore.meta.total_pages }}</span>
      <button
        :disabled="categoriaStore.meta.page >= categoriaStore.meta.total_pages || categoriaStore.isLoading"
        @click="categoriaStore.proximaPagina"
      >
        Próxima
      </button>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 40px auto;
  padding: 30px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 25px;
}

h2 {
    font-size: 1.3rem;
    color: #34495e;
    margin-bottom: 15px;
}

/* Formulário */
.form-container {
    padding: 20px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    margin-bottom: 20px;
    background-color: #f7f9fb;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 15px;
}

input[type='text'], textarea {
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 1rem;
    resize: vertical;
}

.form-actions {
    display: flex;
    gap: 10px;
}

button {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    background-color: #41b883;
    color: white;
    transition: background-color 0.3s;
}

button:hover:not(:disabled) {
    background-color: #358a66;
}

button.cancelar {
    background-color: #95a5a6;
}
button.cancelar:hover:not(:disabled) {
    background-color: #7f8c8d;
}

button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Lista */
.loading-message {
    text-align: center;
    color: #41b883;
    font-weight: bold;
    margin: 20px 0;
}

.categoria-list {
  list-style: none;
  padding: 0;
}

.categoria-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  background-color: #fff;
  border: 1px solid #eee;
  border-left: 5px solid #3498db;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.categoria-list li.categoria-inativa {
    border-left-color: #e74c3c;
    opacity: 0.8;
}

.categoria-info {
    flex-grow: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    color:#0004ff
}

.id-tag {
    background-color: #ecf0f1;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.8rem;
    margin-right: 10px;
    color: #7f8c8d;
}

.descricao {
    margin-left: 15px;
    font-size: 0.9rem;
    color: #001516;
}

.actions button {
    margin-left: 8px;
    padding: 8px 12px;
    font-size: 0.9rem;
}

.actions .editar {
    background-color: #3498db;
}

.actions .excluir {
    background-color: #e74c3c;
}

/* Paginação */
.paginator {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-top: 30px;
    font-size: 1rem;
    color: #555;
}
</style>