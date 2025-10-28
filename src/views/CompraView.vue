<script setup>
import { reactive, onMounted, ref, computed } from 'vue'
import { useCompraStore } from '@/stores/compraStore'
const compraStore = useCompraStore()
const formAberto = ref(false)
const itemIndexToEdit = ref(null)
const STATUS_OPTIONS = [
  { value: 'P', label: 'Pendente' }, { value: 'A', label: 'Aprovada' },
  { value: 'R', label: 'Recebida' }, { value: 'C', label: 'Cancelada' },
];
const defaultCompra = {
  id: null, numero_pedido: '', fornecedor: null, funcionario: null,
  data_entrega_prevista: null, data_entrega_real: null, desconto: 0.00,
  frete: 0.00, status: 'P', observacoes: null, itens: [],
}
const compra = reactive({ ...defaultCompra })
const defaultItem = { produto: null, quantidade: 1, preco_unitario: 0.00 }
const itemAtual = reactive({ ...defaultItem })

const subtotalItemAtual = computed(() => {
  return (itemAtual.quantidade || 0) * (itemAtual.preco_unitario || 0);
});
const subtotalItensCompra = computed(() => {
  return compra.itens.reduce((sum, item) => sum + item.subtotal, 0);
});
const valorFinalCompra = computed(() => {
  const totalBruto = subtotalItensCompra.value;
  const frete = Number(compra.frete || 0);
  const desconto = Number(compra.desconto || 0);
  return totalBruto + frete - desconto;
});

onMounted(async () => {
  await Promise.all([ compraStore.getCompras(), compraStore.loadDependencies() ]);
})
function limpar() {
  Object.assign(compra, { ...defaultCompra, itens: [] }) // Limpa itens também
  Object.assign(itemAtual, { ...defaultItem })
  itemIndexToEdit.value = null;
  formAberto.value = false
}
function isFieldEmpty(value) {
  if (typeof value === 'string') return value.trim() === '';
  return value === null || value === undefined;
}
function adicionarOuAtualizarItem() {
  if (!itemAtual.produto || itemAtual.quantidade < 1 || itemAtual.preco_unitario === null) {
    alert("Selecione o Produto, Quantidade e Preço Unitário.");
    return;
  }
  const produtoSelecionado = compraStore.produtosDisponiveis.find(p => p.id === itemAtual.produto);
  const novoItem = {
    ...itemAtual,
    subtotal: subtotalItemAtual.value,
    produto_nome: produtoSelecionado?.nome || 'Desconhecido'
  };
  if (itemIndexToEdit.value !== null) {
    compra.itens.splice(itemIndexToEdit.value, 1, novoItem);
  } else {
     // Previne duplicatas
    const exists = compra.itens.some(p => p.produto === novoItem.produto);
    if (exists) {
        alert(`O produto "${novoItem.produto_nome}" já está na lista.`);
        return;
    }
    compra.itens.push(novoItem);
  }
  Object.assign(itemAtual, { ...defaultItem });
  itemIndexToEdit.value = null;
}
function editarItem(item, index) {
  Object.assign(itemAtual, item);
  itemIndexToEdit.value = index;
}
function removerItem(index) {
  if (confirm("Remover este item?")) {
    compra.itens.splice(index, 1);
     if (index === itemIndexToEdit.value) { // Limpa se estava editando o removido
         Object.assign(itemAtual, { ...defaultItem });
         itemIndexToEdit.value = null;
     }
  }
}
async function salvar() {
  if (isFieldEmpty(compra.numero_pedido) || !compra.fornecedor || !compra.funcionario || !compra.data_entrega_prevista || compra.itens.length === 0) {
    alert("Nº Pedido, Fornecedor, Funcionário, Data Prevista e ao menos um item são obrigatórios.")
    return
  }
  const dadosParaEnviar = {
    ...compra,
    valor_total: valorFinalCompra.value,
    data_entrega_real: isFieldEmpty(compra.data_entrega_real) ? null : compra.data_entrega_real,
    observacoes: isFieldEmpty(compra.observacoes) ? null : compra.observacoes,
    itens: compra.itens.map(item => ({
      produto: item.produto, quantidade: item.quantidade, preco_unitario: item.preco_unitario,
    }))
  };
  await compraStore.salvarCompra(dadosParaEnviar)
  limpar()
}
function editar(compra_para_editar) {
  const dataEntregaPrevistaFormatada = compra_para_editar.data_entrega_prevista ? compra_para_editar.data_entrega_prevista.substring(0, 10) : null;
  const dataEntregaRealFormatada = compra_para_editar.data_entrega_real ? compra_para_editar.data_entrega_real.substring(0, 10) : null;
  Object.assign(compra, {
    ...compra_para_editar,
    data_entrega_prevista: dataEntregaPrevistaFormatada,
    data_entrega_real: dataEntregaRealFormatada,
    // Garante que 'itens' seja uma cópia reativa, se necessário
    itens: JSON.parse(JSON.stringify(compra_para_editar.itens || []))
  })
  formAberto.value = true
}
async function excluir(id) {
  if (confirm("Excluir esta Compra?")) {
    await compraStore.excluirCompra(id)
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
        // Adiciona verificação para datas inválidas que podem vir da API
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
    <h1><span class="icon">🚚</span> Gestão de Compras</h1>

    <div class="crud-header">
       <button class="btn btn-primary" @click="toggleForm">
        {{ formAberto ? 'Fechar Formulário' : 'Nova Compra' }}
      </button>
    </div>

    <div class="form-container" v-if="formAberto">
      <h2>{{ compra.id ? `Editar Compra #${compra.numero_pedido}` : 'Nova Compra' }}</h2>
      <form @submit.prevent="salvar">

        <section class="form-section">
          <h3>Dados do Pedido</h3>
          <div class="form-grid grid-cols-3">
             <div class="form-group">
              <label for="numeroPedido">Nº Pedido*</label>
              <input id="numeroPedido" type="text" v-model="compra.numero_pedido" required placeholder="Ex: PO-2025-001" />
            </div>
            <div class="form-group">
              <label for="fornecedor">Fornecedor*</label>
              <select id="fornecedor" v-model="compra.fornecedor" required>
                <option :value="null" disabled>Selecione</option>
                <option v-for="f in compraStore.fornecedoresDisponiveis" :key="f.id" :value="f.id">
                  {{ f.nome }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="funcionario">Funcionário Responsável*</label>
              <select id="funcionario" v-model="compra.funcionario" required>
                <option :value="null" disabled>Selecione</option>
                <option v-for="f in compraStore.funcionariosDisponiveis" :key="f.id" :value="f.id">
                  {{ f.nome }}
                </option>
              </select>
            </div>
             <div class="form-group">
              <label for="dataEntregaPrevista">Entrega Prevista*</label>
              <input id="dataEntregaPrevista" type="date" v-model="compra.data_entrega_prevista" required />
            </div>
            <div class="form-group">
              <label for="dataEntregaReal">Entrega Real</label>
              <input id="dataEntregaReal" type="date" v-model="compra.data_entrega_real" />
            </div>
             <div class="form-group">
               <label for="status">Status</label>
                <select id="status" v-model="compra.status" required>
                  <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">
                    {{ s.label }}
                  </option>
                </select>
            </div>
          </div>
        </section>

        <section class="form-section">
          <h3>Itens e Custos</h3>
          <div class="item-input-row form-grid grid-cols-5">
             <div class="form-group span-2">
              <label for="produtoItem">Produto</label>
              <select id="produtoItem" v-model="itemAtual.produto">
                <option :value="null" disabled>Selecione</option>
                 <option v-for="p in compraStore.produtosDisponiveis.filter(prod => !compra.itens.some(item => item.produto === prod.id) || itemAtual.produto === prod.id)" :key="p.id" :value="p.id">
                  {{ p.nome }} (Custo Ref: {{ formatCurrency(p.preco_custo) }})
                </option>
              </select>
            </div>
             <div class="form-group">
              <label for="quantidade">Qtd.</label>
              <input id="quantidade" type="number" v-model.number="itemAtual.quantidade" min="1" placeholder="1" />
            </div>
            <div class="form-group">
              <label for="precoUnitario">Custo Unit.</label>
              <input id="precoUnitario" type="number" step="0.01" v-model.number="itemAtual.preco_unitario" placeholder="0,00" />
            </div>
             <div class="form-group action-item-button align-end">
              <button type="button" @click="adicionarOuAtualizarItem" :disabled="!itemAtual.produto" class="btn btn-accent">
                {{ itemIndexToEdit !== null ? 'Atualizar' : 'Adicionar' }}
              </button>
            </div>
          </div>

           <div class="item-list-container" v-if="compra.itens.length > 0">
               <h4>Itens do Pedido ({{ compra.itens.length }})</h4>
               <table class="item-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Qtd</th>
                      <th>Custo Unit.</th>
                      <th>Subtotal</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in compra.itens" :key="index">
                      <td>{{ item.produto_nome }}</td>
                      <td>{{ item.quantidade }}</td>
                      <td>{{ formatCurrency(item.preco_unitario) }}</td>
                      <td>{{ formatCurrency(item.subtotal) }}</td>
                      <td>
                        <button type="button" @click="editarItem(item, index)" class="btn-action-table edit">Editar</button>
                        <button type="button" @click="removerItem(index)" class="btn-action-table delete">Remover</button>
                      </td>
                    </tr>
                  </tbody>
               </table>
           </div>
           <div v-else class="empty-state item-empty">
               <p>Adicione produtos a esta compra usando o formulário acima.</p>
           </div>

           <div class="finance-summary form-grid grid-cols-3">
               <div class="form-group">
                  <label for="frete">Frete (R$)</label>
                  <input id="frete" type="number" step="0.01" v-model.number="compra.frete" placeholder="0,00" />
               </div>
               <div class="form-group">
                  <label for="desconto">Desconto (R$)</label>
                  <input id="desconto" type="number" step="0.01" v-model.number="compra.desconto" placeholder="0,00" :max="subtotalItensCompra + (compra.frete || 0)" />
               </div>
               <div class="totals-display">
                  <p>Subtotal Itens: <strong>{{ formatCurrency(subtotalItensCompra) }}</strong></p>
                  <p>Frete: <strong>+ {{ formatCurrency(compra.frete) }}</strong></p>
                  <p class="desconto-valor">Desconto: <strong>- {{ formatCurrency(compra.desconto) }}</strong></p>
                  <p class="valor-final">Total Pedido: <strong>{{ formatCurrency(valorFinalCompra) }}</strong></p>
               </div>
           </div>
        </section>

         <section class="form-section">
           <h3>Observações</h3>
           <div class="form-group">
              <label for="observacoes">Observações Gerais</label>
              <textarea id="observacoes" v-model="compra.observacoes" rows="3"></textarea>
            </div>
        </section>

        <div class="form-actions">
           <button type="button" @click="limpar" class="btn btn-light" :disabled="compraStore.isLoading">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="compraStore.isLoading || compra.itens.length === 0">
            {{ compra.id ? 'Atualizar Compra' : 'Salvar Compra' }}
          </button>
        </div>
      </form>
    </div>

    <hr class="divider" />

    <div v-if="compraStore.isLoading" class="loading-message">
      Carregando compras...
    </div>
     <div v-else-if="compraStore.compras.length === 0" class="empty-state">
      <p>Nenhuma compra encontrada.</p>
    </div>
    <ul class="crud-list" v-else>
      <li
        v-for="c in compraStore.compras"
        :key="c.id"
        class="list-item"
        :class="`status-${c.status}`" @click="editar(c)"
      >
        <div class="item-main-info compra-info">
          <span class="id-tag">#{{ c.id }}</span>
          <span class="item-name">Pedido {{ c.numero_pedido }}</span>
           <span :class="`item-status status-${c.status}`">{{ c.status_display }}</span>
        </div>

        <div class="item-details compra-details">
            <span class="detail-tag fornecedor">Fornecedor: {{ c.fornecedor_nome }}</span>
            <span class="detail-tag date">Previsto: {{ formatDate(c.data_entrega_prevista) }}</span>
            <span class="detail-tag total">{{ formatCurrency(c.valor_total) }}</span>
        </div>

        <div class="item-actions">
           <button @click.stop="editar(c)" class="btn-action btn-edit" title="Detalhes/Editar">✏️</button>
           <button @click.stop="excluir(c.id)" class="btn-action btn-delete" title="Excluir">🗑️</button>
        </div>
      </li>
    </ul>

     <div class="paginator" v-if="!compraStore.isLoading && compraStore.meta.total_pages > 1">
       <button class="btn btn-light" :disabled="compraStore.meta.page <= 1" @click="compraStore.paginaAnterior">Anterior</button>
      <span>Página {{ compraStore.meta.page }} de {{ compraStore.meta.total_pages }}</span>
      <button class="btn btn-light" :disabled="compraStore.meta.page >= compraStore.meta.total_pages" @click="compraStore.proximaPagina">Próxima</button>
    </div>

  </div>
</template>

<style scoped>
/* --- Container Principal --- */
.crud-container {
  max-width: 1200px; /* Ajustado para Compra */
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
.form-section h4 { /* Subtítulo para Itens */
    font-size: var(--font-size-md);
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-sm);
}


.form-grid {
  display: grid;
  gap: var(--spacing-md);
}
.grid-cols-1 { grid-template-columns: 1fr; }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
.grid-cols-5 { grid-template-columns: repeat(5, 1fr); } /* Para linha de item */


.form-group.span-2 { grid-column: span 2; }
.form-group.span-3 { grid-column: span 3; }
.form-group.span-4 { grid-column: span 4; }
.form-group.span-5 { grid-column: span 5; }

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
  /* Grid ajustado para Compra: Info | Detalhes | Ações */
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--spacing-lg); /* Mais espaço entre colunas */
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-left-width: 6px;
  /* Cor da borda será definida pela classe de status */
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  cursor: pointer;
}
.list-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  /* A cor da borda de status não muda no hover */
}

/* Status de Cor da Borda para Lista de Compras */
.list-item.status-P { border-left-color: var(--color-warning); } /* Pendente */
.list-item.status-A { border-left-color: var(--color-accent); } /* Aprovada */
.list-item.status-R { border-left-color: var(--color-success); } /* Recebida */
.list-item.status-C { border-left-color: var(--color-danger); background-color: #fffafa;} /* Cancelada */

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
  font-size: var(--font-size-md); /* Reduzido para dar espaço */
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
.item-status.status-A { background-color: #eff6ff; color: #2563eb; }
.item-status.status-R { background-color: var(--color-primary-light); color: var(--color-primary-dark); }
.item-status.status-C { background-color: #fff5f5; color: #c0392b; }


.item-details {
  display: flex;
  gap: var(--spacing-md); /* Mais espaço entre detalhes */
  flex-wrap: nowrap; /* Não quebrar linha */
  overflow: hidden; /* Esconder overflow */
  justify-content: flex-end; /* Alinha tags à direita */
}
.detail-tag {
  background-color: var(--color-background);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  flex-shrink: 0; /* Não encolher */
}
/* Estilos Específicos CompraView */
.detail-tag.fornecedor { color: var(--color-secondary); background-color: #e5e7eb;}
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

/* --- ESTILOS ESPECÍFICOS PARA COMPRAVIEW --- */

/* Linha de Input de Item */
.item-input-row {
  background-color: #e6eef6; /* Fundo azul claro */
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg) !important; /* Sobrescreve margem padrão */
}
.action-item-button {
  display: flex;
  align-items: flex-end;
}
.action-item-button button {
  height: 42px; /* Altura igual aos inputs */
  width: 100%;
}

/* Tabela de Itens no Formulário */
.item-list-container {
    margin-top: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
}
.item-table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--color-surface);
  border-radius: var(--border-radius-md);
  overflow: hidden; /* Para border-radius funcionar */
  border: 1px solid var(--color-border);
}
.item-table th, .item-table td {
  padding: var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--color-border-light);
}
.item-table th {
  background-color: var(--color-background);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}
.item-table td {
  font-size: var(--font-size-sm);
}
.item-table tbody tr:last-child td {
  border-bottom: none;
}
.btn-action-table {
  padding: 4px 8px;
  font-size: 0.8rem;
  border: none;
  border-radius: var(--border-radius-sm);
  color: white;
  cursor: pointer;
  margin-right: var(--spacing-xs);
}
.btn-action-table.edit { background-color: var(--color-accent); }
.btn-action-table.delete { background-color: var(--color-danger); }

.item-empty {
    margin: var(--spacing-lg) 0;
}

/* Resumo Financeiro */
.finance-summary {
    align-items: flex-end; /* Alinha o bloco de totais com os inputs */
    margin-top: var(--spacing-lg);
    padding-top: var(--spacing-lg);
    border-top: 1px dashed var(--color-border);
}
.totals-display {
    background-color: var(--color-surface);
    padding: var(--spacing-md);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--color-border);
    text-align: right;
}
.totals-display p {
    margin: var(--spacing-sm) 0;
    font-size: var(--font-size-md);
    color: var(--color-text-secondary);
}
.totals-display strong {
    color: var(--color-text-primary);
}
.totals-display .desconto-valor strong {
    color: var(--color-danger);
}
.totals-display .valor-final {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary-dark);
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--color-border);
}
.totals-display .valor-final strong {
    color: var(--color-primary-dark);
}


/* --- Responsividade do CRUD (Ajustada para Compra) --- */
@media (max-width: 900px) {
  .grid-cols-3 { grid-template-columns: repeat(2, 1fr); }
  .grid-cols-5 { grid-template-columns: repeat(3, 1fr); } /* Ajuste para linha de item */
  .item-input-row .form-group.span-2 { grid-column: span 3; } /* Produto ocupa mais espaço */
  .finance-summary { grid-template-columns: repeat(2, 1fr); }
  .totals-display { grid-column: span 2; }


  .list-item {
     grid-template-columns: 1fr auto; /* Info | Ações */
     gap: var(--spacing-sm);
  }
   .compra-details {
    grid-column: 1 / 2; /* Detalhes vão para baixo */
    grid-row: 2 / 3;
    flex-wrap: wrap; /* Permite quebrar linha */
    justify-content: flex-start; /* Alinha à esquerda */
    margin-top: var(--spacing-sm);
  }
  .item-actions {
    grid-column: 2 / 3;
    grid-row: 1 / 3;
    flex-direction: column;
  }
}

@media (max-width: 600px) {
  .grid-cols-2, .grid-cols-3, .grid-cols-4, .grid-cols-5 {
    grid-template-columns: 1fr; /* Coluna única */
  }
  .form-group.span-2, .form-group.span-3, .form-group.span-4, .form-group.span-5 {
    grid-column: span 1;
  }
  .finance-summary { grid-template-columns: 1fr; }
  .checkbox-group.align-end {
    align-items: center;
    padding-top: var(--spacing-sm);
    padding-bottom: 0;
  }
  /* Ajustes na tabela de itens em telas pequenas */
  .item-table thead { display: none; } /* Esconde cabeçalho */
  .item-table tr {
      display: block;
      margin-bottom: var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
      padding: var(--spacing-sm);
  }
  .item-table td {
      display: block;
      text-align: right; /* Alinha valor à direita */
      border-bottom: none;
      padding: var(--spacing-xs) 0;
  }
  .item-table td::before {
      content: attr(data-label); /* Usa um atributo data-label (precisa adicionar no :key) */
      float: left;
      font-weight: bold;
      color: var(--color-text-secondary);
      margin-right: var(--spacing-sm);
  }
   .item-table td:last-child {
       text-align: center; /* Centraliza botões */
       padding-top: var(--spacing-sm);
   }

}
</style>