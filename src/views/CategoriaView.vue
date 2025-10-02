<script setup>
import { reactive, onMounted, ref } from 'vue' // Importante: adicionar 'ref'
import { useCategoriaStore } from '@/stores/categoriaStore'

const categoriaStore = useCategoriaStore()

// --- NOVO ESTADO DE CONTROLE DE VISIBILIDADE ---
const formAberto = ref(false) // Começa fechado por padrão

// 1. Estado Local para o Formulário
const defaultCategoria = { id: null, nome: '', descricao: '', ativo: true }
const categoria = reactive({ ...defaultCategoria })

// 2. Ciclo de Vida: Carregar dados ao montar
onMounted(async () => {
  await categoriaStore.getCategorias()
})

// 3. Funções de Ação
function limpar() {
  // 1. Reseta os dados
  Object.assign(categoria, { ...defaultCategoria })
  // 2. Fecha o formulário
  formAberto.value = false
}

async function salvar() {
  if (!categoria.nome.trim()) {
    alert("O nome da categoria é obrigatório.")
    return
  }
  await categoriaStore.salvarCategoria({ ...categoria })
  limpar() // Fechará o formulário após o salvamento
}

function editar(categoria_para_editar) {
  // Garante que o estado local reflita a categoria clicada
  Object.assign(categoria, categoria_para_editar)
  // ABRE O FORMULÁRIO
  formAberto.value = true
}

async function excluir(id) {
  if (confirm("Tem certeza que deseja excluir esta categoria?")) {
    await categoriaStore.excluirCategoria(id)
    limpar()
  }
}

function toggleForm() {
  // Se o formulário estiver aberto e for fechado, limpamos o estado para remover a edição
  if (formAberto.value) {
    limpar(); // Chama limpar, que reseta os campos e define formAberto.value = false
  } else {
    formAberto.value = true; // Abre o formulário
  }
}
</script>

<template>
  <div class="container">
    <h1>Gerenciamento de Categorias</h1>

    <div class="form-toggle">
      <button @click="toggleForm" :class="{ 'cancelar': formAberto }">
        {{ formAberto ? 'Fechar Formulário' : 'Nova Categoria / Editar' }}
      </button>
    </div>

    <div class="form-container" v-if="formAberto">
      <form @submit.prevent="salvar">
        <h2>{{ categoria.id ? 'Editar Categoria' : 'Nova Categoria' }}</h2>
        <div class="form-group">
          <input type="text" v-model="categoria.nome" placeholder="Nome da Categoria" />
          <textarea v-model="categoria.descricao" placeholder="Descrição (Opcional)"></textarea>
        </div>
        <div class="form-actions">
          <button type="submit" :disabled="categoriaStore.isLoading">
            {{ categoria.id ? 'Atualizar' : 'Salvar' }}
          </button>
          <button type="button" @click="limpar" class="cancelar" :disabled="categoriaStore.isLoading">
            Cancelar
          </button>
        </div>
      </form>
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
      <button :disabled="categoriaStore.meta.page <= 1 || categoriaStore.isLoading"
        @click="categoriaStore.paginaAnterior">
        Anterior
      </button>
      <span>Página {{ categoriaStore.meta.page }} de {{ categoriaStore.meta.total_pages }}</span>
      <button :disabled="categoriaStore.meta.page >= categoriaStore.meta.total_pages || categoriaStore.isLoading"
        @click="categoriaStore.proximaPagina">
        Próxima
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Variáveis para fácil manutenção de cores */
:root {
  --primary-color: #41b883;
  /* Vue Green */
  --secondary-color: #34495e;
  /* Dark Blue/Gray */
  --accent-color: #3498db;
  /* Blue for Edit */
  --danger-color: #e74c3c;
  /* Red for Delete */
  --light-bg: #f7f9fb;
  --white: #ffffff;
  --border-color: #e0e0e0;
}

.container {
  max-width: 900px;
  /* Aumentado levemente para mais espaço */
  margin: 40px auto;
  padding: 40px;
  /* Mais padding */
  background-color: var(--white);
  border-radius: 12px;
  /* Cantos mais suaves */
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  /* Sombra mais pronunciada */
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  /* Fonte moderna */
}

/* --- Títulos --- */
h1 {
  text-align: center;
  color: var(--secondary-color);
  margin-bottom: 35px;
  font-size: 2.5rem;
  /* Maior destaque */
  font-weight: 700;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 10px;
}

h2 {
  font-size: 1.6rem;
  /* Ajustado */
  color: var(--secondary-color);
  margin-bottom: 20px;
  font-weight: 600;
}

/* --- NOVO: Estilo para o Botão Toggle --- */
.form-toggle {
  margin-bottom: 25px;
  text-align: right;
}

.form-toggle button {
  /* Reutiliza o estilo do botão primário */
  text-transform: none;
}

/* --- Formulário (Formulário agora está dentro de uma div, mas o CSS ainda se aplica) --- */
.form-container {
  padding: 25px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  margin-bottom: 30px;
  background-color: var(--light-bg);
}

/* --- Formulário --- */
.form-container {
  padding: 25px;
  /* Mais padding */
  border: 1px solid var(--border-color);
  border-radius: 10px;
  margin-bottom: 30px;
  background-color: var(--light-bg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
  /* Mais espaço entre campos */
  margin-bottom: 20px;
}

input[type='text'],
textarea {
  padding: 14px;
  /* Maior altura do campo */
  border: 1px solid #ccc;
  border-radius: 8px;
  /* Cantos mais arredondados */
  font-size: 1.1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
  background-color: var(--white);
}

input[type='text']:focus,
textarea:focus {
  border-color: var(--primary-color);
  /* Foco na cor primária */
  outline: none;
  box-shadow: 0 0 0 3px rgba(65, 184, 131, 0.2);
  /* Sutil brilho de foco */
}

/* --- Ações e Botões (Padrão) --- */
.form-actions {
  display: flex;
  gap: 15px;
}

button {
  padding: 12px 25px;
  /* Maior e mais fácil de clicar */
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background-color: var(--primary-color);
  color: var(--white);
  font-weight: 600;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  /* Sutil sombra */
}

button:hover:not(:disabled) {
  background-color: #358a66;
  /* Tom mais escuro */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  /* Sombra maior no hover */
  transform: translateY(-1px);
}

button.cancelar {
  background-color: #95a5a6;
}

button.cancelar:hover:not(:disabled) {
  background-color: #7f8c8d;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

hr {
  border: 0;
  height: 1px;
  background-image: linear-gradient(to right, rgba(0, 0, 0, 0), var(--border-color), rgba(0, 0, 0, 0));
  margin: 30px 0;
}

/* --- Lista e Itens --- */
.loading-message {
  text-align: center;
  color: var(--primary-color);
  font-size: 1.2rem;
  font-weight: 600;
  margin: 30px 0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.8;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.8;
  }
}

.categoria-list {
  list-style: none;
  padding: 0;
  display: grid;
  /* Usando Grid para melhor espaçamento, se quiser pode ser flex */
  gap: 10px;
}

.categoria-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  /* Mais padding */
  background-color: var(--white);
  border: 1px solid var(--border-color);
  border-left: 6px solid var(--accent-color);
  /* Borda mais grossa */
  border-radius: 8px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s, transform 0.3s;
}

.categoria-list li:hover {
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  /* Efeito sutil de elevação */
}

.categoria-list li.categoria-inativa {
  border-left-color: var(--danger-color);
  opacity: 0.7;
  /* Sutilmente mais esmaecido */
}

.categoria-info {
  flex-grow: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--secondary-color);
}

.categoria-info strong {
  font-size: 1.15rem;
  margin-right: 15px;
  color: #2c3e50;
}

.id-tag {
  background-color: #ecf0f1;
  padding: 4px 8px;
  /* Maior e mais legível */
  border-radius: 4px;
  font-size: 0.85rem;
  margin-right: 15px;
  color: #7f8c8d;
  font-weight: 700;
}

.descricao {
  font-size: 1rem;
  color: #555;
  /* Truncar descrição longa */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 400px;
  /* Limite o tamanho da descrição na lista */
}

.actions button {
  margin-left: 10px;
  padding: 8px 15px;
  font-size: 0.95rem;
  text-transform: none;
  /* Não precisa de uppercase nas ações */
}

.actions .editar {
  background-color: var(--accent-color);
}

.actions .editar:hover {
  background-color: #2980b9;
}

.actions .excluir {
  background-color: var(--danger-color);
}

.actions .excluir:hover {
  background-color: #c0392b;
}

/* --- Paginação --- */
.paginator {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  /* Mais espaçamento */
  margin-top: 40px;
  font-size: 1.1rem;
  color: var(--secondary-color);
  font-weight: 500;
}

.paginator button {
  padding: 8px 18px;
  font-size: 1rem;
  background-color: #ecf0f1;
  color: var(--secondary-color);
  box-shadow: none;
  text-transform: none;
}

.paginator button:hover:not(:disabled) {
  background-color: #bdc3c7;
  transform: none;
  box-shadow: none;
}
</style>