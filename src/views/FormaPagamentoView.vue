<script setup>
import { reactive, onMounted, ref } from 'vue'
import { useFormaPagamentoStore } from '@/stores/formaPagamentoStore'
const formaPagamentoStore = useFormaPagamentoStore()
const formAberto = ref(false)
const defaultForma = {
  id: null, nome: '', descricao: '', taxa_percentual: 0.00,
  taxa_fixa: 0.00, prazo_recebimento: 0, ativo: true,
}
const forma = reactive({ ...defaultForma })
onMounted(async () => { await formaPagamentoStore.getFormas() })
function limpar() {
  Object.assign(forma, { ...defaultForma })
  formAberto.value = false
}
async function salvar() {
  if (!forma.nome.trim()) {
    alert("O Nome da Forma de Pagamento é obrigatório.")
    return
  }
  const dadosParaEnviar = { ...forma };
  dadosParaEnviar.prazo_recebimento = Number(dadosParaEnviar.prazo_recebimento || 0); // Garante número
  dadosParaEnviar.taxa_percentual = Number(dadosParaEnviar.taxa_percentual || 0);
  dadosParaEnviar.taxa_fixa = Number(dadosParaEnviar.taxa_fixa || 0);
  await formaPagamentoStore.salvarForma(dadosParaEnviar)
  limpar()
}
function editar(forma_para_editar) {
  Object.assign(forma, forma_para_editar)
  formAberto.value = true
}
async function excluir(id) {
  if (confirm("Excluir esta Forma de Pagamento?")) {
    await formaPagamentoStore.excluirForma(id)
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
</script>

<template>
  <div class="crud-container">
    <h1><span class="icon">💳</span> Gestão de Formas de Pagamento</h1>

    <div class="crud-header">
       <button class="btn btn-primary" @click="toggleForm">
        {{ formAberto ? 'Fechar Formulário' : 'Nova Forma Pag.' }}
      </button>
    </div>

    <div class="form-container" v-if="formAberto">
      <h2>{{ forma.id ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento' }}</h2>
      <form @submit.prevent="salvar">
         <section class="form-section">
          <h3>Detalhes</h3>
           <div class="form-grid grid-cols-2">
            <div class="form-group span-2">
              <label for="nome">Nome*</label>
              <input id="nome" type="text" v-model="forma.nome" required placeholder="Ex: Cartão de Crédito, Pix" />
            </div>
             <div class="form-group span-2">
              <label for="descricao">Descrição / Regras</label>
              <textarea id="descricao" v-model="forma.descricao" rows="2" placeholder="Detalhes sobre taxas, parcelamento, etc."></textarea>
            </div>
           </div>
         </section>

         <section class="form-section">
          <h3>Taxas e Prazos</h3>
          <div class="form-grid grid-cols-3">
            <div class="form-group">
              <label for="taxaPercentual">Taxa Percentual (%)</label>
              <input id="taxaPercentual" type="number" step="0.01" v-model.number="forma.taxa_percentual" placeholder="0,00" />
            </div>
            <div class="form-group">
              <label for="taxaFixa">Taxa Fixa (R$)</label>
              <input id="taxaFixa" type="number" step="0.01" v-model.number="forma.taxa_fixa" placeholder="0,00" />
            </div>
            <div class="form-group">
              <label for="prazoRecebimento">Prazo Recebimento (dias)</label>
              <input id="prazoRecebimento" type="number" v-model.number="forma.prazo_recebimento" placeholder="Ex: 30" min="0" />
            </div>
             <div class="form-group checkbox-group align-end span-3">
              <input id="ativo" type="checkbox" v-model="forma.ativo" />
              <label for="ativo" class="inline-label">Forma Ativa</label>
            </div>
          </div>
        </section>

        <div class="form-actions">
           <button type="button" @click="limpar" class="btn btn-light" :disabled="formaPagamentoStore.isLoading">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="formaPagamentoStore.isLoading">
            {{ forma.id ? 'Atualizar' : 'Salvar' }}
          </button>
        </div>
      </form>
    </div>

    <hr class="divider" />

    <div v-if="formaPagamentoStore.isLoading" class="loading-message">
      Carregando formas de pagamento...
    </div>
     <div v-else-if="formaPagamentoStore.formas.length === 0" class="empty-state">
      <p>Nenhuma forma de pagamento encontrada.</p>
    </div>
    <ul class="crud-list" v-else>
      <li
        v-for="f in formaPagamentoStore.formas"
        :key="f.id"
        class="list-item"
        :class="{ 'status-inactive': !f.ativo }"
        @click="editar(f)"
      >
        <div class="item-main-info">
          <span class="id-tag">#{{ f.id }}</span>
          <span class="item-name">{{ f.nome }}</span>
           <span class="item-status" v-if="!f.ativo">INATIVA</span>
        </div>

        <div class="item-details">
          <span class="detail-tag tax">
            Taxa: {{ Number(f.taxa_percentual).toFixed(2) }}% + {{ formatCurrency(f.taxa_fixa) }}
          </span>
           <span class="detail-tag term">Receb.: {{ f.prazo_recebimento }} dias</span>
        </div>

        <div class="item-actions">
          <button @click.stop="editar(f)" class="btn-action btn-edit" title="Editar">✏️</button>
          <button @click.stop="excluir(f.id)" class="btn-action btn-delete" title="Excluir">🗑️</button>
        </div>
      </li>
    </ul>

     <div class="paginator" v-if="!formaPagamentoStore.isLoading && formaPagamentoStore.meta?.total_pages > 1">
       <button class="btn btn-light" :disabled="formaPagamentoStore.meta.page <= 1" @click="formaPagamentoStore.paginaAnterior">Anterior</button>
      <span>Página {{ formaPagamentoStore.meta.page }} de {{ formaPagamentoStore.meta.total_pages }}</span>
      <button class="btn btn-light" :disabled="formaPagamentoStore.meta.page >= formaPagamentoStore.meta.total_pages" @click="formaPagamentoStore.proximaPagina">Próxima</button>
    </div>

  </div>
</template>

<style scoped>
/* --- Container Principal --- */
.crud-container {
  max-width: 900px; /* Ajustado para FormaPagamento */
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
/* Estilos Específicos FormaPagamentoView */
.detail-tag.tax { color: var(--color-primary-dark); background-color: var(--color-primary-light);}
.detail-tag.term { color: var(--color-accent-dark); background-color: #eff6ff;}

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
/* --- Padrão CRUD Responsivo - Adicionar ao final --- */
@media (max-width: 768px) {
  .crud-container {
    padding: 10px;
  }

  h1 {
    font-size: 1.5rem;
    flex-wrap: wrap;
  }

  /* --- Formulários: Uma coluna só --- */
  .form-grid, 
  .grid-cols-2, .grid-cols-3, .grid-cols-4, .grid-cols-5 {
    grid-template-columns: 1fr !important; /* Força 1 coluna */
    gap: 16px;
  }
  
  .form-group.span-2, .form-group.span-3, .form-group.span-4 {
    grid-column: span 1 !important;
  }

  /* Ajuste de Checkbox para ficar alinhado */
  .checkbox-group.align-end {
    align-items: center;
    padding-top: 0;
    margin-top: 10px;
  }

  /* Botões de Ação do Formulário (Salvar/Cancelar) */
  .form-actions {
    flex-direction: column-reverse; /* Salvar em cima, Cancelar embaixo */
    gap: 12px;
  }
  .form-actions button {
    width: 100%;
    height: 48px;
  }

  /* --- Listas: Transformar linhas em CARDS --- */
  .list-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
    gap: 12px;
    border-radius: 12px;
    background: white;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    margin-bottom: 12px;
  }

  /* Cabeçalho do Card */
  .item-main-info {
    width: 100%;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-border-light);
    padding-bottom: 8px;
    margin-bottom: 4px;
  }
  .item-name {
    font-size: 1.1rem;
    font-weight: bold;
  }

  /* Detalhes do Card */
  .item-details {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-start; /* Alinha tags à esquerda */
  }

  .detail-tag {
    font-size: 0.85rem;
    padding: 4px 10px;
  }

  /* Ações do Card (Botões Editar/Excluir) */
  .item-actions {
    width: 100%;
    display: flex;
    justify-content: flex-end; /* Botões à direita */
    gap: 16px;
    margin-top: 8px;
    border-top: 1px dashed var(--color-border-light);
    padding-top: 8px;
  }

  .btn-action {
    font-size: 1.4rem; /* Ícones maiores para toque */
    padding: 8px 16px;
    background-color: var(--color-background); /* Fundo cinza para parecer botão */
    border-radius: 8px;
  }
}
</style>