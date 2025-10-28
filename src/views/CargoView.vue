<script setup>
import { reactive, onMounted, ref } from 'vue'
import { useCargoStore } from '@/stores/cargoStore'
const cargoStore = useCargoStore()
const formAberto = ref(false)
const defaultCargo = {
  id: null, nome: '', descricao: '', salario_base: 0.00,
  comissao_percentual: 0.00, ativo: true,
}
const cargo = reactive({ ...defaultCargo })
onMounted(async () => { await cargoStore.getCargos() })
function limpar() {
  Object.assign(cargo, { ...defaultCargo })
  formAberto.value = false
}
async function salvar() {
  if (!cargo.nome.trim() || cargo.salario_base === null) {
    alert("O Nome e o Salário Base são obrigatórios.")
    return
  }
  await cargoStore.salvarCargo({ ...cargo })
  limpar()
}
function editar(cargo_para_editar) {
  Object.assign(cargo, cargo_para_editar)
  formAberto.value = true
}
async function excluir(id) {
  if (confirm("Tem certeza que deseja excluir este cargo?")) {
    await cargoStore.excluirCargo(id)
    limpar() // Fecha o form se estava editando o excluído
  }
}
function toggleForm() {
  if (formAberto.value) { limpar(); }
  else { formAberto.value = true; }
}
function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
</script>

<template>
  <div class="crud-container">
    <h1><span class="icon">💼</span> Gerenciamento de Cargos</h1>

    <div class="crud-header">
       <button class="btn btn-primary" @click="toggleForm">
        {{ formAberto ? 'Fechar Formulário' : 'Novo Cargo' }}
      </button>
    </div>

    <div class="form-container" v-if="formAberto">
      <h2>{{ cargo.id ? 'Editar Cargo' : 'Novo Cargo' }}</h2>
      <form @submit.prevent="salvar">
        <section class="form-section">
          <h3>Detalhes do Cargo</h3>
          <div class="form-grid grid-cols-2">
            <div class="form-group">
              <label for="nome">Nome do Cargo*</label>
              <input id="nome" type="text" v-model="cargo.nome" required placeholder="Ex: Gerente de Vendas" />
            </div>
            <div class="form-group">
              <label for="salarioBase">Salário Base*</label>
              <input id="salarioBase" type="number" step="0.01" v-model.number="cargo.salario_base" required placeholder="0,00" />
            </div>
            <div class="form-group">
              <label for="comissaoPercentual">Comissão (%)</label>
              <input id="comissaoPercentual" type="number" step="0.01" v-model.number="cargo.comissao_percentual" placeholder="0,00" />
            </div>
             <div class="form-group checkbox-group align-end">
              <input id="ativo" type="checkbox" v-model="cargo.ativo" />
              <label for="ativo" class="inline-label">Cargo Ativo</label>
            </div>
          </div>
           <div class="form-group">
              <label for="descricao">Descrição</label>
              <textarea id="descricao" v-model="cargo.descricao" rows="3" placeholder="Detalhes e responsabilidades do cargo."></textarea>
            </div>
        </section>

        <div class="form-actions">
          <button type="button" @click="limpar" class="btn btn-light" :disabled="cargoStore.isLoading">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="cargoStore.isLoading">
            {{ cargo.id ? 'Atualizar Cargo' : 'Salvar Cargo' }}
          </button>
        </div>
      </form>
    </div>

    <hr class="divider" />

    <div v-if="cargoStore.isLoading" class="loading-message">
      Carregando cargos...
    </div>
    <div v-else-if="cargoStore.cargos.length === 0" class="empty-state">
      <p>Nenhum cargo encontrado.</p>
    </div>
    <ul class="crud-list" v-else>
      <li
        v-for="c in cargoStore.cargos"
        :key="c.id"
        class="list-item"
        :class="{ 'status-inactive': !c.ativo }"
        @click="editar(c)"
      >
        <div class="item-main-info">
          <span class="id-tag">#{{ c.id }}</span>
          <span class="item-name">{{ c.nome }}</span>
          <span class="item-status" v-if="!c.ativo">INATIVO</span>
        </div>

        <div class="item-details">
            <span class="detail-tag salary">Salário: {{ formatCurrency(c.salario_base) }}</span>
            <span class="detail-tag commission">Comissão: {{ Number(c.comissao_percentual || 0).toFixed(2) }}%</span>
        </div>

        <div class="item-actions">
          <button @click.stop="editar(c)" class="btn-action btn-edit" title="Editar">✏️</button>
          <button @click.stop="excluir(c.id)" class="btn-action btn-delete" title="Excluir">🗑️</button>
        </div>
      </li>
    </ul>

    <div class="paginator" v-if="!cargoStore.isLoading && cargoStore.meta.total_pages > 1">
       <button class="btn btn-light" :disabled="cargoStore.meta.page <= 1" @click="cargoStore.paginaAnterior">Anterior</button>
      <span>Página {{ cargoStore.meta.page }} de {{ cargoStore.meta.total_pages }}</span>
      <button class="btn btn-light" :disabled="cargoStore.meta.page >= cargoStore.meta.total_pages" @click="cargoStore.proximaPagina">Próxima</button>
    </div>
  </div>
</template>

<style scoped>
/* --- Container Principal --- */
.crud-container {
  max-width: 900px; /* Ajustado para Cargo */
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
  padding-top: var(--spacing-md); /* Alinha com inputs */
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
  grid-template-columns: 1fr auto auto; /* Info | Detalhes | Ações */
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

.item-details {
  display: flex;
  gap: var(--spacing-sm);
}
.detail-tag {
  background-color: var(--color-background);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
}
/* Cores específicas para CargoView */
.detail-tag.salary {
  color: var(--color-success);
  font-weight: var(--font-weight-medium);
  background-color: var(--color-primary-light);
}
.detail-tag.commission {
  color: var(--color-accent-dark);
   background-color: #eff6ff;
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

/* --- Responsividade do CRUD --- */
@media (max-width: 900px) {
  .grid-cols-3, .grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
  
  .list-item {
     grid-template-columns: 1fr auto; /* Info | Ações */
     gap: var(--spacing-sm);
  }
  .item-details {
    grid-column: 1 / 2; /* Detalhes vão para baixo */
    grid-row: 2 / 3;
    flex-wrap: wrap;
    margin-top: var(--spacing-sm); /* Espaço extra */
  }
  .item-actions {
    grid-column: 2 / 3;
    grid-row: 1 / 3; /* Ocupa as duas "linhas" */
    flex-direction: column;
  }
}

@media (max-width: 600px) {
  .grid-cols-2, .grid-cols-3, .grid-cols-4 { 
    grid-template-columns: 1fr; /* Coluna única */
  }
  .form-group.span-2, .form-group.span-3, .form-group.span-4 {
    grid-column: span 1;
  }
  .checkbox-group.align-end {
    align-items: center;
    padding-top: var(--spacing-sm);
    padding-bottom: 0;
  }
}
</style>