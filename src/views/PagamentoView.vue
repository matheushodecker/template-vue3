<script setup>
import { reactive, onMounted, ref } from 'vue'
import { usePagamentoStore } from '@/stores/pagamentoStore'
const pagamentoStore = usePagamentoStore()
const formAberto = ref(false)
const STATUS_OPTIONS = [
  { value: 'P', label: 'Pendente' },
  { value: 'R', label: 'Recebido' },
  { value: 'C', label: 'Cancelado' },
];
const defaultPagamento = {
  id: null, venda: null, forma_pagamento: null, valor: 0.00,
  data_vencimento: null, data_recebimento: null, status: 'P', observacoes: null,
}
const pagamento = reactive({ ...defaultPagamento })
onMounted(async () => {
  await Promise.all([
    pagamentoStore.getPagamentos(),
    pagamentoStore.loadDependencies()
  ]);
})
function limpar() {
  Object.assign(pagamento, { ...defaultPagamento })
  formAberto.value = false
}
function isFieldEmpty(value) {
  if (typeof value === 'string') return value.trim() === '';
  return value === null || value === undefined;
}
async function salvar() {
  if (!pagamento.venda || !pagamento.forma_pagamento || !pagamento.valor || !pagamento.data_vencimento) {
    alert("Venda, Forma de Pagamento, Valor e Data de Vencimento são obrigatórios.")
    return
  }
  const dadosParaEnviar = { ...pagamento };
  if (isFieldEmpty(dadosParaEnviar.data_recebimento)) { dadosParaEnviar.data_recebimento = null; }
  if (isFieldEmpty(dadosParaEnviar.observacoes)) { dadosParaEnviar.observacoes = null; }

  await pagamentoStore.salvarPagamento(dadosParaEnviar)
  limpar()
}
function editar(pagamento_para_editar) {
  const dataVencimentoFormatada = pagamento_para_editar.data_vencimento?.substring(0, 10) || null;
  const dataRecebimentoFormatada = pagamento_para_editar.data_recebimento?.substring(0, 10) || null;
  Object.assign(pagamento, {
    ...pagamento_para_editar,
    data_vencimento: dataVencimentoFormatada,
    data_recebimento: dataRecebimentoFormatada,
  })
  formAberto.value = true
}
async function excluir(id) {
  if (confirm("Excluir este Pagamento?")) {
    await pagamentoStore.excluirPagamento(id)
    limpar()
  }
}
function toggleForm() {
  if (formAberto.value) { limpar(); }
  else { formAberto.value = true; }
}
function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatDate(isoString) {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'Data inválida';
        // Formata para dd/mm/aaaa
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (e) {
        return 'Data inválida';
    }
}
</script>

<template>
  <div class="crud-container">
    <h1><span class="icon">💸</span> Gestão de Pagamentos</h1>

    <div class="crud-header">
      <button class="btn btn-primary" @click="toggleForm">
        {{ formAberto ? 'Fechar Formulário' : 'Novo Pagamento' }}
      </button>
    </div>

    <div class="form-container" v-if="formAberto">
      <h2>{{ pagamento.id ? 'Editar Pagamento' : 'Novo Pagamento' }}</h2>
      <form @submit.prevent="salvar">
        <section class="form-section">
          <h3>Detalhes do Pagamento</h3>
          <div class="form-grid grid-cols-3">
            <div class="form-group">
              <label for="venda">Venda Relacionada*</label>
              <select id="venda" v-model="pagamento.venda" required>
                <option :value="null" disabled>Selecione a Venda</option>
                <option v-for="v in pagamentoStore.vendasDisponiveis" :key="v.id" :value="v.id">
                  Venda #{{ v.id }} - {{ formatCurrency(v.valor_total) }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="formaPagamento">Forma de Pagamento*</label>
              <select id="formaPagamento" v-model="pagamento.forma_pagamento" required>
                <option :value="null" disabled>Selecione</option>
                <option v-for="f in pagamentoStore.formasDisponiveis" :key="f.id" :value="f.id">
                  {{ f.nome }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="valor">Valor (R$)*</label>
              <input id="valor" type="number" step="0.01" v-model.number="pagamento.valor" required placeholder="0,00" />
            </div>
            <div class="form-group">
              <label for="dataVencimento">Data de Vencimento*</label>
              <input id="dataVencimento" type="date" v-model="pagamento.data_vencimento" required />
            </div>
            <div class="form-group">
              <label for="dataRecebimento">Data de Recebimento</label>
              <input id="dataRecebimento" type="date" v-model="pagamento.data_recebimento" />
            </div>
            <div class="form-group">
              <label for="status">Status*</label>
              <select id="status" v-model="pagamento.status" required>
                <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">
                  {{ s.label }}
                </option>
              </select>
            </div>
          </div>
        </section>

        <section class="form-section">
           <h3>Observações</h3>
           <div class="form-group">
              <label for="observacoes">Observações (Opcional)</label>
              <textarea id="observacoes" v-model="pagamento.observacoes" rows="3"></textarea>
            </div>
        </section>

        <div class="form-actions">
          <button type="button" @click="limpar" class="btn btn-light" :disabled="pagamentoStore.isLoading">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="pagamentoStore.isLoading">
            {{ pagamento.id ? 'Atualizar Pagamento' : 'Salvar Pagamento' }}
          </button>
        </div>
      </form>
    </div>

    <hr class="divider" />

    <div v-if="pagamentoStore.isLoading" class="loading-message">
      Carregando pagamentos...
    </div>
     <div v-else-if="pagamentoStore.pagamentos.length === 0" class="empty-state">
      <p>Nenhum pagamento encontrado.</p>
    </div>
    <ul class="crud-list" v-else>
      <li
        v-for="p in pagamentoStore.pagamentos"
        :key="p.id"
        class="list-item"
        :class="`status-${p.status}`" @click="editar(p)"
      >
        <div class="item-main-info">
          <span class="id-tag">#{{ p.id }}</span>
          <span class="item-name">{{ p.forma_pagamento_nome }}</span>
           <span :class="`item-status status-${p.status}`">{{ p.status_display }}</span>
        </div>

        <div class="item-details">
           <span class="detail-tag sale-id">Venda: #{{ p.venda }}</span>
           <span class="detail-tag date">Venc.: {{ formatDate(p.data_vencimento) }}</span>
           <span class="detail-tag total">{{ formatCurrency(p.valor) }}</span>
        </div>

        <div class="item-actions">
          <button @click.stop="editar(p)" class="btn-action btn-edit" title="Editar">✏️</button>
          <button @click.stop="excluir(p.id)" class="btn-action btn-delete" title="Excluir">🗑️</button>
        </div>
      </li>
    </ul>

    <div class="paginator" v-if="!pagamentoStore.isLoading && pagamentoStore.meta.total_pages > 1">
       <button class="btn btn-light" :disabled="pagamentoStore.meta.page <= 1" @click="pagamentoStore.paginaAnterior">Anterior</button>
      <span>Página {{ pagamentoStore.meta.page }} de {{ pagamentoStore.meta.total_pages }}</span>
      <button class="btn btn-light" :disabled="pagamentoStore.meta.page >= pagamentoStore.meta.total_pages" @click="pagamentoStore.proximaPagina">Próxima</button>
    </div>
  </div>
</template>

<style scoped>
/* --- Container Principal --- */
.crud-container {
  max-width: 1000px; /* Ajustado para Pagamento */
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
.grid-cols-1 { grid-template-columns: 1fr; }
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
  /* Cor da borda definida pela classe de status */
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  cursor: pointer;
}
.list-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* Status de Cor da Borda */
.list-item.status-P { border-left-color: var(--color-warning); } /* Pendente */
.list-item.status-R { border-left-color: var(--color-success); } /* Recebido */
.list-item.status-C { border-left-color: var(--color-danger); background-color: #fffafa; } /* Cancelado */

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

/* Tag de Status na Lista */
.item-status {
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  padding: 4px 10px;
  border-radius: var(--border-radius-full);
  text-transform: uppercase;
  margin-left: var(--spacing-sm); /* Espaço antes do status */
}
/* Cores da Tag de Status */
.item-status.status-P { background-color: #fffbeb; color: #b45309; }
.item-status.status-R { background-color: var(--color-primary-light); color: var(--color-primary-dark); }
.item-status.status-C { background-color: #fff5f5; color: #c0392b; }

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
/* Estilos Específicos PagamentoView */
.detail-tag.sale-id { color: var(--color-secondary); background-color: #e5e7eb;}
.detail-tag.date { color: var(--color-accent-dark); background-color: #eff6ff;}
.detail-tag.total {
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
    background-color: var(--color-primary-light);
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