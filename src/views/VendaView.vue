<script setup>
import { reactive, onMounted, ref, computed } from 'vue'
import { useVendaStore } from '@/stores/vendaStore'
const vendaStore = useVendaStore()
const formAberto = ref(false)
const itemIndexToEdit = ref(null)
const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'finalizada', label: 'Finalizada' },
  { value: 'cancelada', label: 'Cancelada' },
];
const defaultVenda = {
  id: null, funcionario: null, desconto: 0.00,
  status: 'pendente', observacoes: null, itens: [],
}
const venda = reactive({ ...defaultVenda })
const defaultItem = { produto: null, quantidade: 1, preco_unitario: 0.00 }
const itemAtual = reactive({ ...defaultItem })

// Computeds
const subtotalItemAtual = computed(() => {
  return (itemAtual.quantidade || 0) * (itemAtual.preco_unitario || 0);
});
const subtotalVenda = computed(() => {
  return venda.itens.reduce((sum, item) => sum + item.subtotal, 0);
});
const valorFinalVenda = computed(() => {
    const final = subtotalVenda.value - (venda.desconto || 0);
    return Math.max(0, final); // Garante que não seja negativo
});
// Para preencher o preço unitário automaticamente ao selecionar o produto
const produtoSelecionado = computed(() => {
    if (!itemAtual.produto) return null;
    return vendaStore.produtosDisponiveis.find(p => p.id === itemAtual.produto);
});

// Watcher para auto-preencher o preço
import { watch } from 'vue'
watch(produtoSelecionado, (novoProduto) => {
    if (novoProduto && itemIndexToEdit.value === null) { // Só preenche se for novo item
        itemAtual.preco_unitario = Number(novoProduto.preco_venda || 0);
    }
});


onMounted(async () => {
  await Promise.all([
    vendaStore.getVendas(),
    vendaStore.loadDependencies()
  ]);
})
function limpar() {
  Object.assign(venda, { ...defaultVenda, itens: [] }) // Limpa itens
  Object.assign(itemAtual, { ...defaultItem })
  itemIndexToEdit.value = null;
  formAberto.value = false
}
function isFieldEmpty(value) {
  if (typeof value === 'string') return value.trim() === '';
  return value === null || value === undefined;
}
function adicionarOuAtualizarItem() {
  if (!itemAtual.produto || itemAtual.quantidade < 1 || itemAtual.preco_unitario === null || itemAtual.preco_unitario < 0) {
    alert("Selecione o Produto, Quantidade e Preço Unitário válido.");
    return;
  }
  const produtoNome = produtoSelecionado.value?.nome || 'Produto Desconhecido';
  const novoItem = {
    ...itemAtual,
    subtotal: subtotalItemAtual.value,
    produto_nome: produtoNome
  };
  if (itemIndexToEdit.value !== null) {
    venda.itens.splice(itemIndexToEdit.value, 1, novoItem);
  } else {
     // Previne duplicatas
    const exists = venda.itens.some(p => p.produto === novoItem.produto);
    if (exists) {
        alert(`O produto "${novoItem.produto_nome}" já está na lista.`);
        return;
    }
    venda.itens.push(novoItem);
  }
  Object.assign(itemAtual, { ...defaultItem }); // Reseta o form de item
  itemIndexToEdit.value = null;
}
function editarItem(item, index) {
  Object.assign(itemAtual, item);
  itemIndexToEdit.value = index;
}
function removerItem(index) {
  if (confirm("Remover este item da venda?")) {
    venda.itens.splice(index, 1);
     if (index === itemIndexToEdit.value) { // Limpa se estava editando o removido
         Object.assign(itemAtual, { ...defaultItem });
         itemIndexToEdit.value = null;
     }
  }
}
async function salvar() {
  if (!venda.funcionario || venda.itens.length === 0) {
    alert("Selecione o Funcionário e adicione pelo menos um item.")
    return
  }
  const dadosParaEnviar = {
    ...venda,
    total: valorFinalVenda.value, // O serializer recalcula, mas é bom ter
    observacoes: isFieldEmpty(venda.observacoes) ? null : venda.observacoes,
    itens: venda.itens.map(item => ({
      produto: item.produto,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
    }))
  };
  await vendaStore.salvarVenda(dadosParaEnviar)
  limpar()
}
function editar(venda_para_editar) {
  Object.assign(venda, {
      ...venda_para_editar,
      // Garante que 'itens' seja uma cópia reativa
      itens: JSON.parse(JSON.stringify(venda_para_editar.itens || []))
  })
  formAberto.value = true
}
async function excluir(id) {
  if (confirm("Excluir esta Venda? Ela será movida para 'Cancelada' ou excluída permanentemente.")) {
    // Idealmente, a store deveria tentar "Cancelar" primeiro.
    // Assumindo exclusão por enquanto:
    await vendaStore.excluirVenda(id)
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
function formatDateTime(isoString) {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
         if (isNaN(date.getTime())) return 'Data inválida';
        return date.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
            timeZone: 'UTC' // Ajuste se a API retornar UTC
        });
    } catch (e) {
        return 'Data inválida';
    }
}
</script>

<template>
  <div class="crud-container">
    <h1><span class="icon">💰</span> Gestão de Vendas</h1>

    <div class="crud-header">
       <button class="btn btn-primary" @click="toggleForm">
        {{ formAberto ? 'Fechar Formulário' : 'Nova Venda' }}
      </button>
    </div>

    <div class="form-container" v-if="formAberto">
      <h2>{{ venda.id ? `Venda #${venda.id}` : 'Nova Venda' }}</h2>
      <form @submit.prevent="salvar">

        <section class="form-section">
          <h3>Dados da Venda</h3>
          <div class="form-grid grid-cols-3">
             <div class="form-group">
              <label for="funcionario">Funcionário*</label>
              <select id="funcionario" v-model="venda.funcionario" required>
                <option :value="null" disabled>Selecione</option>
                <option v-for="f in vendaStore.funcionariosDisponiveis" :key="f.id" :value="f.id">
                  {{ f.nome }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="status">Status</label>
              <select id="status" v-model="venda.status">
                <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">
                  {{ s.label }}
                </option>
              </select>
            </div>
             <div class="form-group">
              <label for="desconto">Desconto (R$)</label>
              <input
                id="desconto"
                type="number"
                step="0.01"
                min="0"
                v-model.number="venda.desconto"
                placeholder="0,00"
                :max="subtotalVenda"
              />
            </div>
          </div>
        </section>
        
        <section class="form-section">
          <h3>Itens da Venda</h3>
           <div class="item-input-row form-grid grid-cols-5">
             <div class="form-group span-2">
              <label for="produtoItem">Produto</label>
              <select id="produtoItem" v-model="itemAtual.produto">
                <option :value="null" disabled>Selecione</option>
                 <option v-for="p in vendaStore.produtosDisponiveis.filter(prod => !venda.itens.some(item => item.produto === prod.id) || itemAtual.produto === prod.id)" :key="p.id" :value="p.id">
                  {{ p.nome }} ({{ formatCurrency(p.preco_venda) }})
                </option>
              </select>
            </div>
             <div class="form-group">
              <label for="quantidade">Qtd.</label>
              <input id="quantidade" type="number" v-model.number="itemAtual.quantidade" min="1" placeholder="1" />
            </div>
            <div class="form-group">
              <label for="precoUnitario">Preço Unit.</label>
              <input id="precoUnitario" type="number" step="0.01" v-model.number="itemAtual.preco_unitario" placeholder="0,00" />
            </div>
             <div class="form-group action-item-button align-end">
              <button type="button" @click="adicionarOuAtualizarItem" :disabled="!itemAtual.produto" class="btn btn-accent">
                {{ itemIndexToEdit !== null ? 'Atualizar' : 'Adicionar' }}
              </button>
            </div>
          </div>
          
           <div class="item-list-container" v-if="venda.itens.length > 0">
               <h4>Itens na Venda ({{ venda.itens.length }})</h4>
               <table class="item-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Qtd</th>
                      <th>Preço Unit.</th>
                      <th>Subtotal</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in venda.itens" :key="index">
                      <td>{{ item.produto_nome }}</td>
                      <td>{{ item.quantidade }}</td>
                      <td>{{ formatCurrency(item.preco_unitario) }}</td>
                      <td class="subtotal-col">{{ formatCurrency(item.subtotal) }}</td>
                      <td>
                        <button type="button" @click="editarItem(item, index)" class="btn-action-table edit">Editar</button>
                        <button type="button" @click="removerItem(index)" class="btn-action-table delete">Remover</button>
                      </td>
                    </tr>
                  </tbody>
               </table>
           </div>
           <div v-else class="empty-state item-empty">
               <p>Adicione produtos a esta venda.</p>
           </div>
           
           <div class="finance-summary form-grid grid-cols-3">
               <div class="form-group span-2">
                 </div>
               <div class="totals-display">
                  <p>Subtotal Itens: <strong>{{ formatCurrency(subtotalVenda) }}</strong></p>
                  <p class="desconto-valor">Desconto: <strong>- {{ formatCurrency(venda.desconto) }}</strong></p>
                  <p class="valor-final">Total Venda: <strong>{{ formatCurrency(valorFinalVenda) }}</strong></p>
               </div>
           </div>
        </section>
        
         <section class="form-section">
           <h3>Observações</h3>
           <div class="form-group">
              <label for="observacoes">Observações (Opcional)</label>
              <textarea id="observacoes" v-model="venda.observacoes" rows="3"></textarea>
            </div>
        </section>

        <div class="form-actions">
          <button type="button" @click="limpar" class="btn btn-light" :disabled="vendaStore.isLoading">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="vendaStore.isLoading || venda.itens.length === 0">
            {{ venda.id ? 'Atualizar Venda' : 'Salvar Venda' }}
          </button>
        </div>
      </form>
    </div>

    <hr class="divider" />

    <div v-if="vendaStore.isLoading" class="loading-message">
      Carregando vendas...
    </div>
    <div v-else-if="vendaStore.vendas.length === 0" class="empty-state">
      <p>Nenhuma venda encontrada.</p>
    </div>
    <ul class="crud-list" v-else>
      <li
        v-for="v in vendaStore.vendas"
        :key="v.id"
        class="list-item"
        :class="`status-${v.status}`" @click="editar(v)"
      >
        <div class="item-main-info">
          <span class="id-tag">#{{ v.id }}</span>
          <span class="item-name">{{ v.funcionario_nome }}</span>
           <span :class="`item-status status-${v.status}`">{{ v.status_display }}</span>
        </div>

        <div class="item-details">
           <span class="detail-tag date">Data: {{ formatDateTime(v.data_venda) }}</span>
           <span class="detail-tag total">{{ formatCurrency(v.total) }}</span>
        </div>

        <div class="item-actions">
          <button @click.stop="editar(v)" class="btn-action btn-edit" title="Detalhes/Editar">✏️</button>
          <button @click.stop="excluir(v.id)" class="btn-action btn-delete" title="Excluir/Cancelar">🗑️</button>
        </div>
      </li>
    </ul>
    
     <div class="paginator" v-if="!vendaStore.isLoading && vendaStore.meta.total_pages > 1">
       <button class="btn btn-light" :disabled="vendaStore.meta.page <= 1" @click="vendaStore.paginaAnterior">Anterior</button>
      <span>Página {{ vendaStore.meta.page }} de {{ vendaStore.meta.total_pages }}</span>
      <button class="btn btn-light" :disabled="vendaStore.meta.page >= vendaStore.meta.total_pages" @click="vendaStore.proximaPagina">Próxima</button>
    </div>

  </div>
</template>

<style scoped>
/* --- Container Principal --- */
.crud-container {
  max-width: 1200px; /* Ajustado para Venda */
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
  grid-template-columns: 1fr auto auto; /* Info | Detalhes | Ações */
  align-items: center;
  gap: var(--spacing-md);
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
}

/* Status de Cor da Borda para Lista de Vendas */
.list-item.status-pendente { border-left-color: var(--color-warning); }
.list-item.status-finalizada { border-left-color: var(--color-success); }
.list-item.status-cancelada { border-left-color: var(--color-danger); background-color: #fffafa;}

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
.item-status.status-pendente { background-color: #fffbeb; color: #b45309; }
.item-status.status-finalizada { background-color: var(--color-primary-light); color: var(--color-primary-dark); }
.item-status.status-cancelada { background-color: #fff5f5; color: #c0392b; }


.item-details {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}
.detail-tag {
  background-color: var(--color-background);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}
/* Estilos Específicos VendaView */
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

/* --- ESTILOS ESPECÍFICOS PARA VENDA (Formulário) --- */

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
.item-table td.subtotal-col {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
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
    align-items: flex-end; /* Alinha o bloco de totais */
    margin-top: var(--spacing-lg);
    padding-top: var(--spacing-lg);
    border-top: 1px dashed var(--color-border);
}
.totals-display {
    /* Ocupa a coluna 3 (definido no grid-cols-3) */
    grid-column: 3 / 4; 
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
    color: var(--color-success); /* Verde para total de venda */
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--color-border);
}
.totals-display .valor-final strong {
    color: var(--color-success);
}


/* --- Responsividade do CRUD (Ajustada para Venda) --- */
@media (max-width: 900px) {
  .grid-cols-3 { grid-template-columns: repeat(2, 1fr); }
  .grid-cols-5 { grid-template-columns: repeat(3, 1fr); } /* Ajuste para linha de item */
  .item-input-row .form-group.span-2 { grid-column: span 3; } /* Produto ocupa mais espaço */
  
  .finance-summary { grid-template-columns: 1fr; } /* Coluna única */
  .totals-display { grid-column: 1 / -1; } /* Ocupa tudo */


  .list-item {
     grid-template-columns: 1fr auto; /* Info | Ações */
     gap: var(--spacing-sm);
  }
   .item-details {
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
      /* Adicione data-label="Nome" no <td> para funcionar */
      content: attr(data-label); 
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