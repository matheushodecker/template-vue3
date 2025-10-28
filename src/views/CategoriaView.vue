<script setup>
import { reactive, onMounted, ref } from 'vue'
import { useCategoriaStore } from '@/stores/categoriaStore'
const categoriaStore = useCategoriaStore()
const formAberto = ref(false)
const defaultCategoria = { id: null, nome: '', descricao: '', ativo: true }
const categoria = reactive({ ...defaultCategoria })
onMounted(async () => { await categoriaStore.getCategorias() })
function limpar() {
  Object.assign(categoria, { ...defaultCategoria })
  formAberto.value = false
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
  Object.assign(categoria, categoria_para_editar)
  formAberto.value = true
}
async function excluir(id) {
  if (confirm("Tem certeza que deseja excluir esta categoria?")) {
    await categoriaStore.excluirCategoria(id)
    limpar()
  }
}
function toggleForm() {
  if (formAberto.value) { limpar(); }
  else { formAberto.value = true; }
}
</script>

<template>
  <div class="crud-container">
    <h1><span class="icon">📁</span> Gerenciamento de Categorias</h1>

    <div class="crud-header">
      <button class="btn btn-primary" @click="toggleForm">
        {{ formAberto ? 'Fechar Formulário' : 'Nova Categoria' }}
      </button>
    </div>

    <div class="form-container" v-if="formAberto">
      <h2>{{ categoria.id ? 'Editar Categoria' : 'Nova Categoria' }}</h2>
      <form @submit.prevent="salvar">
        <section class="form-section">
          <div class="form-grid grid-cols-1"> <div class="form-group">
              <label for="nome">Nome da Categoria*</label>
              <input id="nome" type="text" v-model="categoria.nome" required placeholder="Ex: Bebidas" />
            </div>
             <div class="form-group">
              <label for="descricao">Descrição (Opcional)</label>
              <textarea id="descricao" v-model="categoria.descricao" rows="3" placeholder="Detalhes sobre a categoria"></textarea>
            </div>
             <div class="form-group checkbox-group">
              <input id="ativo" type="checkbox" v-model="categoria.ativo" />
              <label for="ativo" class="inline-label">Categoria Ativa</label>
            </div>
          </div>
        </section>

        <div class="form-actions">
          <button type="button" @click="limpar" class="btn btn-light" :disabled="categoriaStore.isLoading">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="categoriaStore.isLoading">
            {{ categoria.id ? 'Atualizar' : 'Salvar' }}
          </button>
        </div>
      </form>
    </div>

    <hr class="divider" />

    <div v-if="categoriaStore.isLoading" class="loading-message">
      Carregando categorias...
    </div>
     <div v-else-if="categoriaStore.categorias.length === 0" class="empty-state">
      <p>Nenhuma categoria encontrada.</p>
    </div>
    <ul class="crud-list" v-else>
      <li
        v-for="cat in categoriaStore.categorias"
        :key="cat.id"
        class="list-item"
        :class="{ 'status-inactive': !cat.ativo }"
        @click="editar(cat)"
      >
        <div class="item-main-info">
          <span class="id-tag">#{{ cat.id }}</span>
          <span class="item-name">{{ cat.nome }}</span>
          <span class="item-status" v-if="!cat.ativo">INATIVA</span>
        </div>

         <div class="item-details single-detail"> <span class="detail-text">{{ cat.descricao || 'Sem descrição' }}</span>
        </div>

        <div class="item-actions">
          <button @click.stop="editar(cat)" class="btn-action btn-edit" title="Editar">✏️</button>
          <button @click.stop="excluir(cat.id)" class="btn-action btn-delete" title="Excluir">🗑️</button>
        </div>
      </li>
    </ul>

    <div class="paginator" v-if="!categoriaStore.isLoading && categoriaStore.meta.total_pages > 1">
       <button class="btn btn-light" :disabled="categoriaStore.meta.page <= 1" @click="categoriaStore.paginaAnterior">Anterior</button>
      <span>Página {{ categoriaStore.meta.page }} de {{ categoriaStore.meta.total_pages }}</span>
      <button class="btn btn-light" :disabled="categoriaStore.meta.page >= categoriaStore.meta.total_pages" @click="categoriaStore.proximaPagina">Próxima</button>
    </div>
  </div>
</template>

<style scoped>
/* --- Container Principal --- */
.crud-container {
  max-width: 900px; /* Ajustado para Categoria */
  margin: 0 auto;
  padding: var(--spacing-lg);
  background-color: var(--color-surface);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
}

h1 {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-display);
  font-weight: var(--font-weight-bold);
  color: var(--color-secondary);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--color-border-light);
}
h1 .icon {
  font-size: 2.2rem;
}

/* --- Cabeçalho (Busca e Botão Novo) --- */
.crud-header {
  display: flex;
  justify-content: flex-end; /* Apenas botão novo */
  align-items: center;
  margin-bottom: var(--spacing-lg);
}
.search-filter {
  /* Espaço para futuros filtros */
}

/* --- Formulário --- */
.form-container {
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg);
  background-color: var(--color-background);
}
h2 {
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
  font-weight: var(--font-weight-semibold);
}

.form-section {
  margin-bottom: var(--spacing-lg);
}
.form-section h3 {
  font-size: var(--font-size-lg);
  color: var(--color-secondary);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--spacing-sm);
}

.form-grid {
  display: grid;
  gap: var(--spacing-md);
}
.grid-cols-1 { grid-template-columns: 1fr; } /* Adicionado para Categoria */
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

.form-group.span-2 { grid-column: span 2; }
.form-group.span-3 { grid-column: span 3; }
.form-group.span-4 { grid-column: span 4; }

/* Checkbox */
.checkbox-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  /* padding-top: var(--spacing-md); */ /* Removido para grid 1 col */
}
.checkbox-group.align-end {
  align-items: flex-end;
  padding-bottom: 10px; /* Ajuste fino */
}
.checkbox-group input[type="checkbox"] {
  width: 20px;
  height: 20px;
}
.checkbox-group label.inline-label {
  font-weight: var(--font-weight-regular);
  color: var(--color-text-primary);
  margin: 0;
  cursor: pointer;
}

/* Campo calculado */
.calculated-field {
  background-color: var(--color-primary-light);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-dark);
  border-color: var(--color-primary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
}

/* --- Divisor --- */
.divider {
  border: 0;
  height: 1px;
  background-color: var(--color-border-light);
  margin: var(--spacing-lg) 0;
}

/* --- Lista de Itens --- */
.crud-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: var(--spacing-md);
}
.list-item {
  display: grid;
  grid-template-columns: auto 1fr auto; /* ID | Nome+Desc | Ações */
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-left-width: 6px;
  border-left-color: var(--color-accent); /* Padrão (Ativo) */
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  cursor: pointer;
}
.list-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-left-color: var(--color-primary);
}

/* Status de Cor da Borda */
.list-item.status-inactive {
  border-left-color: var(--color-danger);
  background-color: #fffafa;
}
.list-item.status-warning {
  border-left-color: var(--color-warning);
  background-color: #fffbeb;
}

.item-main-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  overflow: hidden;
}
.id-tag {
  background-color: var(--color-background);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
}
.item-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-status {
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  padding: 4px 10px;
  border-radius: var(--border-radius-full);
  text-transform: uppercase;
  background: var(--color-danger);
  color: var(--color-text-inverse);
}
.item-status.warning {
  background: var(--color-warning);
  color: #4d2506;
}

/* Detalhes (ajustado para Categoria) */
.item-details {
  /* No grid original, esta era a segunda coluna */
   overflow: hidden;
}
/* Nova classe para quando há apenas um detalhe textual */
.single-detail .detail-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


.item-actions {
  display: flex;
  gap: var(--spacing-sm);
}
.btn-action {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: 1.1rem;
  transition: all var(--transition-base);
}
.btn-action:hover {
  background-color: var(--color-background);
}
.btn-edit:hover { color: var(--color-accent); }
.btn-delete:hover { color: var(--color-danger); }

/* --- Paginação --- */
.paginator {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}
.paginator button {
  font-weight: var(--font-weight-medium);
}

/* --- Responsividade do CRUD (simplificada para Categoria) --- */
@media (max-width: 600px) {
 .list-item {
     grid-template-columns: 1fr auto; /* Info | Ações */
     gap: var(--spacing-sm);
  }
  .item-details {
    grid-column: 1 / 2; /* Descrição vai para baixo */
    grid-row: 2 / 3;
    margin-top: var(--spacing-xs);
  }
   .item-actions {
    grid-column: 2 / 3;
    grid-row: 1 / 3; /* Ocupa as duas "linhas" */
    flex-direction: column;
  }
}
</style>