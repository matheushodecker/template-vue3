<script setup>
import { reactive, onMounted, ref, computed } from 'vue'
import { usePromocaoStore } from '@/stores/promocaoStore'
const promocaoStore = usePromocaoStore()
const formAberto = ref(false)
const itemIndexToEdit = ref(null)
const DESCONTO_OPTIONS = [
  { value: 'P', label: 'Percentual (%)' },
  { value: 'V', label: 'Valor Fixo (R$)' },
];
const defaultPromocao = {
  id: null, nome: '', descricao: null, tipo_desconto: 'P', valor_desconto: 0.00,
  data_inicio: null, data_fim: null, ativo: true, produtos: [],
}
const promocao = reactive({ ...defaultPromocao })
const defaultProdutoItem = { produto: null, preco_promocional: 0.00 }
const produtoAtual = reactive({ ...defaultProdutoItem })
const precoVendaReferencia = computed(() => {
  const produtoSelecionado = promocaoStore.produtosDisponiveis.find(p => p.id === produtoAtual.produto);
  return Number(produtoSelecionado?.preco_venda || 0);
});
function isFieldEmpty(value) {
  if (typeof value === 'string') return value.trim() === '';
  return value === null || value === undefined;
}
onMounted(async () => {
  await Promise.all([
    promocaoStore.getPromocoes(),
    promocaoStore.loadDependencies()
  ]);
})
function limpar() {
  Object.assign(promocao, { ...defaultPromocao, produtos: [] }) // Limpa produtos
  Object.assign(produtoAtual, { ...defaultProdutoItem })
  itemIndexToEdit.value = null;
  formAberto.value = false
}
function adicionarOuAtualizarProduto() {
  if (!produtoAtual.produto || produtoAtual.preco_promocional === null || produtoAtual.preco_promocional < 0) {
    alert("Selecione o Produto e defina um Preço Promocional válido.");
    return;
  }
   if (produtoAtual.preco_promocional >= precoVendaReferencia.value) {
      if (!confirm(`O preço promocional (${formatCurrency(produtoAtual.preco_promocional)}) é maior ou igual ao preço de venda (${formatCurrency(precoVendaReferencia.value)}). Deseja continuar?`)) {
          return;
      }
  }
  const produtoSelecionado = promocaoStore.produtosDisponiveis.find(p => p.id === produtoAtual.produto);
  if (!produtoSelecionado) { alert("Produto inválido."); return; }
  const novoProduto = {
    ...produtoAtual,
    produto_nome: produtoSelecionado.nome,
    preco_venda_original: precoVendaReferencia.value // Guarda o preço original para referência na tabela
  };
  if (itemIndexToEdit.value !== null) {
    promocao.produtos.splice(itemIndexToEdit.value, 1, novoProduto);
  } else {
     const exists = promocao.produtos.some(p => p.produto === novoProduto.produto);
    if (exists) {
        alert(`O produto "${novoProduto.produto_nome}" já está nesta promoção.`);
        return;
    }
    promocao.produtos.push(novoProduto);
  }
  Object.assign(produtoAtual, { ...defaultProdutoItem });
  itemIndexToEdit.value = null;
}
function editarProduto(item, index) {
  Object.assign(produtoAtual, item);
  itemIndexToEdit.value = index;
}
function removerProduto(index) {
  if (confirm("Remover este produto da promoção?")) {
    promocao.produtos.splice(index, 1);
    if (index === itemIndexToEdit.value) { // Limpa se estava editando o removido
         Object.assign(produtoAtual, { ...defaultProdutoItem });
         itemIndexToEdit.value = null;
     }
  }
}
async function salvar() {
  if (isFieldEmpty(promocao.nome) || isFieldEmpty(promocao.valor_desconto) || !promocao.data_inicio || !promocao.data_fim) {
    alert("Nome, Valor/Percentual, Data de Início e Data de Fim são obrigatórios.")
    return
  }
  if (new Date(promocao.data_inicio) >= new Date(promocao.data_fim)) {
    alert("A Data de Fim deve ser posterior à Data de Início.")
    return
  }
  const dadosParaEnviar = { ...promocao };
  if (isFieldEmpty(dadosParaEnviar.descricao)) { dadosParaEnviar.descricao = null; }
  // O serializer aninhado cuida de 'produtos'
  await promocaoStore.salvarPromocao(dadosParaEnviar)
  limpar()
}
function editar(promocao_para_editar) {
  // Formata para datetime-local (YYYY-MM-DDTHH:mm)
  const inicioFormatado = promocao_para_editar.data_inicio ? promocao_para_editar.data_inicio.substring(0, 16) : null;
  const fimFormatado = promocao_para_editar.data_fim ? promocao_para_editar.data_fim.substring(0, 16) : null;
  Object.assign(promocao, {
    ...promocao_para_editar,
    data_inicio: inicioFormatado,
    data_fim: fimFormatado,
     // Garante que 'produtos' seja uma cópia reativa
    produtos: JSON.parse(JSON.stringify(promocao_para_editar.produtos || []))
  })
  formAberto.value = true
}
async function excluir(id) {
  if (confirm("Excluir esta Promoção?")) {
    await promocaoStore.excluirPromocao(id)
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
        // Formata para dd/mm/aaaa HH:MM
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
    <h1><span class="icon">🎉</span> Gestão de Promoções</h1>

    <div class="crud-header">
       <button class="btn btn-primary" @click="toggleForm">
        {{ formAberto ? 'Fechar Formulário' : 'Nova Promoção' }}
      </button>
    </div>

    <div class="form-container" v-if="formAberto">
      <h2>{{ promocao.id ? `Editar Promoção #${promocao.id}` : 'Nova Promoção' }}</h2>
      <form @submit.prevent="salvar">

        <section class="form-section">
          <h3>Configuração</h3>
           <div class="form-grid grid-cols-4">
            <div class="form-group span-2">
              <label for="nome">Nome da Promoção*</label>
              <input id="nome" type="text" v-model="promocao.nome" required placeholder="Ex: Liquidação de Inverno" />
            </div>
            <div class="form-group">
              <label for="tipoDesconto">Tipo de Desconto*</label>
              <select id="tipoDesconto" v-model="promocao.tipo_desconto" required>
                <option v-for="d in DESCONTO_OPTIONS" :key="d.value" :value="d.value">
                  {{ d.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="valorDesconto">Valor/Percentual*</label>
              <input id="valorDesconto" type="number" step="0.01" v-model.number="promocao.valor_desconto" required placeholder="0,00" />
            </div>
             <div class="form-group span-2">
              <label for="dataInicio">Data de Início*</label>
              <input id="dataInicio" type="datetime-local" v-model="promocao.data_inicio" required />
            </div>
            <div class="form-group span-2">
              <label for="dataFim">Data de Fim*</label>
              <input id="dataFim" type="datetime-local" v-model="promocao.data_fim" required />
            </div>
            <div class="form-group span-4">
              <label for="descricao">Observações/Descrição</label>
              <textarea id="descricao" v-model="promocao.descricao" rows="2"></textarea>
            </div>
             <div class="form-group checkbox-group">
              <input id="ativo" type="checkbox" v-model="promocao.ativo" />
              <label for="ativo" class="inline-label">Ativa</label>
            </div>
          </div>
        </section>
        
        <section class="form-section">
           <h3>Produtos em Promoção</h3>
           <div class="item-input-row form-grid grid-cols-4">
             <div class="form-group span-2">
              <label for="produtoItem">Produto</label>
              <select id="produtoItem" v-model="produtoAtual.produto">
                <option :value="null" disabled>Selecione</option>
                 <option v-for="p in promocaoStore.produtosDisponiveis.filter(prod => !promocao.produtos.some(item => item.produto === prod.id) || produtoAtual.produto === prod.id)" :key="p.id" :value="p.id">
                  {{ p.nome }}
                </option>
              </select>
            </div>
             <div class="form-group">
              <label>Preço Venda (Ref.)</label>
              <input type="text" :value="formatCurrency(precoVendaReferencia)" disabled class="calculated-field" />
            </div>
            <div class="form-group">
              <label for="precoPromocional">Preço Promocional*</label>
              <input id="precoPromocional" type="number" step="0.01" v-model.number="produtoAtual.preco_promocional" placeholder="0,00" />
            </div>
             <div class="form-group action-item-button align-end span-4"> <button type="button" @click="adicionarOuAtualizarProduto" :disabled="!produtoAtual.produto" class="btn btn-accent">
                {{ itemIndexToEdit !== null ? 'Atualizar Produto' : 'Adicionar Produto' }}
              </button>
            </div>
           </div>

           <div class="item-list-container" v-if="promocao.produtos.length > 0">
               <h4>Produtos Inclusos ({{ promocao.produtos.length }})</h4>
               <table class="item-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Preço Original</th>
                      <th>Preço Promocional</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in promocao.produtos" :key="index">
                      <td>{{ item.produto_nome }}</td>
                      <td>{{ formatCurrency(item.preco_venda_original || '0') }}</td>
                      <td class="promo-price">{{ formatCurrency(item.preco_promocional) }}</td>
                      <td>
                        <button type="button" @click="editarProduto(item, index)" class="btn-action-table edit">Editar</button>
                        <button type="button" @click="removerProduto(index)" class="btn-action-table delete">Remover</button>
                      </td>
                    </tr>
                  </tbody>
               </table>
           </div>
           <div v-else class="empty-state item-empty">
               <p>Adicione produtos a esta promoção.</p>
           </div>
        </section>

        <div class="form-actions">
          <button type="button" @click="limpar" class="btn btn-light" :disabled="promocaoStore.isLoading">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="promocaoStore.isLoading">
            {{ promocao.id ? 'Atualizar Promoção' : 'Salvar Promoção' }}
          </button>
        </div>
      </form>
    </div>

    <hr class="divider" />

    <div v-if="promocaoStore.isLoading" class="loading-message">
      Carregando promoções...
    </div>
     <div v-else-if="promocaoStore.promocoes.length === 0" class="empty-state">
      <p>Nenhuma promoção encontrada.</p>
    </div>
    <ul class="crud-list" v-else>
      <li
        v-for="p in promocaoStore.promocoes"
        :key="p.id"
        class="list-item"
        :class="{ 'status-inactive': !p.promocao_ativa, 'status-active': p.promocao_ativa }"
        @click="editar(p)"
      >
        <div class="item-main-info">
          <span class="id-tag">#{{ p.id }}</span>
          <span class="item-name">{{ p.nome }}</span>
           <span :class="['item-status', p.promocao_ativa ? 'status-active' : 'status-inactive']">
             {{ p.promocao_ativa ? 'ATIVA' : 'INATIVA' }}
           </span>
        </div>

        <div class="item-details">
           <span class="detail-tag discount">
             {{ p.tipo_desconto_display }}: {{ Number(p.valor_desconto).toFixed(2) }}{{ p.tipo_desconto === 'P' ? '%' : ' R$' }}
           </span>
           <span class="detail-tag date">Início: {{ formatDateTime(p.data_inicio) }}</span>
           <span class="detail-tag date">Fim: {{ formatDateTime(p.data_fim) }}</span>
        </div>

        <div class="item-actions">
          <button @click.stop="editar(p)" class="btn-action btn-edit" title="Editar">✏️</button>
          <button @click.stop="excluir(p.id)" class="btn-action btn-delete" title="Excluir">🗑️</button>
        </div>
      </li>
    </ul>

    <div class="paginator" v-if="!promocaoStore.isLoading && promocaoStore.meta.total_pages > 1">
       <button class="btn btn-light" :disabled="promocaoStore.meta.page <= 1" @click="promocaoStore.paginaAnterior">Anterior</button>
      <span>Página {{ promocaoStore.meta.page }} de {{ promocaoStore.meta.total_pages }}</span>
      <button class="btn btn-light" :disabled="promocaoStore.meta.page >= promocaoStore.meta.total_pages" @click="promocaoStore.proximaPagina">Próxima</button>
    </div>
  </div>
</template>

<style scoped>
/* --- Container Principal --- */
.crud-container {
  max-width: 1200px; /* Ajustado para Promocao */
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
.grid-cols-5 { grid-template-columns: repeat(5, 1fr); }


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
  background-color: var(--color-background); /* Fundo neutro */
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  border-color: var(--color-border);
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

/* Status de Cor da Borda para Lista de Promoções */
.list-item.status-active { border-left-color: var(--color-success); } /* Ativa */
.list-item.status-inactive { border-left-color: var(--color-danger); background-color: #fffafa;} /* Inativa */


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
.item-status.status-active { background-color: var(--color-primary-light); color: var(--color-primary-dark); }
.item-status.status-inactive { background-color: #fff5f5; color: #c0392b; }


.item-details {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: nowrap;
  overflow: hidden;
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
/* Estilos Específicos PromocaoView */
.detail-tag.discount { color: var(--color-primary-dark); background-color: var(--color-primary-light); font-weight: var(--font-weight-medium);}
.detail-tag.date { color: var(--color-accent-dark); background-color: #eff6ff;}


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

/* --- ESTILOS ESPECÍFICOS PARA PROMOCAOVIEW --- */

/* Linha de Input de Item */
.item-input-row {
  background-color: #e6eef6; /* Fundo azul claro */
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg) !important; /* Sobrescreve margem padrão */
}
.action-item-button {
  display: flex;
  justify-content: flex-end; /* Alinha botão à direita */
  align-items: flex-end;
}
.action-item-button button {
  height: 42px; /* Altura igual aos inputs */
  width: auto; /* Largura automática */
  padding-left: var(--spacing-lg);
  padding-right: var(--spacing-lg);
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
.item-table td.promo-price {
    font-weight: var(--font-weight-bold);
    color: var(--color-success);
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


/* --- Responsividade do CRUD (Ajustada para Promocao) --- */
@media (max-width: 900px) {
  .grid-cols-3 { grid-template-columns: repeat(2, 1fr); }
  .grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
  .form-group.span-3, .form-group.span-4 { grid-column: span 2; }
  .item-input-row.grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
  .item-input-row .form-group.span-2 { grid-column: span 2; }
  .action-item-button { grid-column: span 2; } /* Botão ocupa a linha */
  
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
   .action-item-button { grid-column: span 1; }
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