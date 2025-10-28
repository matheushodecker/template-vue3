<script setup>
import { reactive, onMounted, ref, computed } from 'vue'
import { useProdutoStore } from '@/stores/produtoStore'
const produtoStore = useProdutoStore()
const formAberto = ref(false)
const defaultProduto = {
  id: null,
  nome: '',
  descricao: null,
  codigo_barras: '',
  categoria: null,
  fornecedor: null,
  preco_custo: 0.00,
  preco_venda: 0.00,
  estoque_atual: 0,
  estoque_minimo: 5,
  ativo: true,
}
const produto = reactive({ ...defaultProduto })
const margemLucroCalculada = computed(() => {
  const custo = Number(produto.preco_custo || 0);
  const venda = Number(produto.preco_venda || 0);
  if (custo > 0 && venda > custo) {
    const margem = ((venda - custo) / custo) * 100;
    return margem.toFixed(2);
  }
  return 0;
});
onMounted(async () => {
  await Promise.all([
    produtoStore.getProdutos(1, '', '-id'),
    produtoStore.loadDependencies()
  ]);
})
function limpar() {
  Object.assign(produto, { ...defaultProduto })
  formAberto.value = false
}
function isFieldEmpty(value) {
  if (typeof value === 'string') return value.trim() === '';
  return value === null || value === undefined;
}
async function salvar() {
  if (isFieldEmpty(produto.nome) || isFieldEmpty(produto.codigo_barras) || !produto.categoria || !produto.fornecedor) {
    alert("Nome, Código de Barras, Categoria e Fornecedor são obrigatórios.")
    return
  }
  const dadosParaEnviar = { ...produto };
  if (isFieldEmpty(dadosParaEnviar.descricao)) { dadosParaEnviar.descricao = null; }
  dadosParaEnviar.preco_custo = Number(dadosParaEnviar.preco_custo);
  dadosParaEnviar.preco_venda = Number(dadosParaEnviar.preco_venda);
  dadosParaEnviar.estoque_atual = Number(dadosParaEnviar.estoque_atual);
  dadosParaEnviar.estoque_minimo = Number(dadosParaEnviar.estoque_minimo);
  await produtoStore.salvarProduto(dadosParaEnviar)
  limpar()
}
function editar(produto_para_editar) {
  Object.assign(produto, {
    ...produto_para_editar,
    preco_custo: Number(produto_para_editar.preco_custo),
    preco_venda: Number(produto_para_editar.preco_venda),
    estoque_atual: Number(produto_para_editar.estoque_atual),
    estoque_minimo: Number(produto_para_editar.estoque_minimo),
  })
  formAberto.value = true
}
async function excluir(id) {
  if (confirm("Tem certeza que deseja excluir este Produto?")) {
    await produtoStore.excluirProduto(id)
    limpar()
  }
}
function toggleForm() {
  if (formAberto.value) {
    limpar();
  } else {
    formAberto.value = true;
  }
}
function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
</script>

<template>
  <div class="crud-container">
    <h1><span class="icon">🏷️</span> Gestão de Produtos</h1>

    <div class="crud-header">
      <div class="search-filter">
      </div>
      <button class="btn btn-primary" @click="toggleForm">
        {{ formAberto ? 'Fechar Formulário' : 'Novo Produto' }}
      </button>
    </div>

    <div class="form-container" v-if="formAberto">
      <h2>{{ produto.id ? `Editar Produto #${produto.id}` : 'Novo Produto' }}</h2>
      <form @submit.prevent="salvar">

        <section class="form-section">
          <h3>Dados Básicos</h3>
          <div class="form-grid grid-cols-2">
            <div class="form-group span-2">
              <label for="nome">Nome do Produto*</label>
              <input id="nome" type="text" v-model="produto.nome" required placeholder="Ex: Arroz Branco 5kg" />
            </div>
            <div class="form-group">
              <label for="codigoBarras">Código de Barras*</label>
              <input id="codigoBarras" type="text" v-model="produto.codigo_barras" required
                placeholder="Ex: 7891234567890" />
            </div>
            <div class="form-group">
              <label for="categoria">Categoria*</label>
              <select id="categoria" v-model="produto.categoria" required>
                <option :value="null" disabled>Selecione</option>
                <option v-for="c in produtoStore.categoriasDisponiveis" :key="c.id" :value="c.id">
                  {{ c.nome }}
                </option>
              </select>
            </div>
            <div class="form-group span-2">
              <label for="fornecedor">Fornecedor*</label>
              <select id="fornecedor" v-model="produto.fornecedor" required>
                <option :value="null" disabled>Selecione</option>
                <option v-for="f in produtoStore.fornecedoresDisponiveis" :key="f.id" :value="f.id">
                  {{ f.nome }}
                </option>
              </select>
            </div>
          </div>
        </section>

        <section class="form-section">
          <h3>Preços e Estoque</h3>
          <div class="form-grid grid-cols-3">
            <div class="form-group">
              <label for="precoCusto">Preço de Custo*</label>
              <input id="precoCusto" type="number" step="0.01" v-model.number="produto.preco_custo" required
                placeholder="0,00" />
            </div>
            <div class="form-group">
              <label for="precoVenda">Preço de Venda*</label>
              <input id="precoVenda" type="number" step="0.01" v-model.number="produto.preco_venda" required
                placeholder="0,00" />
            </div>
            <div class="form-group">
              <label>Margem de Lucro (%)</label>
              <input type="text" :value="margemLucroCalculada" disabled class="calculated-field" />
            </div>
            <div class="form-group">
              <label for="estoqueAtual">Estoque Atual*</label>
              <input id="estoqueAtual" type="number" v-model.number="produto.estoque_atual" required
                  placeholder="0" />
            </div>
            <div class="form-group">
              <label for="estoqueMinimo">Estoque Mínimo*</label>
              <input id="estoqueMinimo" type="number" v-model.number="produto.estoque_minimo" required
                placeholder="5" />
            </div>
            <div class="form-group checkbox-group align-end">
              <input id="ativo" type="checkbox" v-model="produto.ativo" />
              <label for="ativo" class="inline-label">Produto Ativo</label>
            </div>
          </div>
        </section>

        <section class="form-section">
          <h3>Descrição</h3>
          <div class="form-group">
            <label for="descricao">Descrição (Opcional)</label>
            <textarea id="descricao" v-model="produto.descricao" rows="3"
              placeholder="Detalhes do produto, ingredientes, etc."></textarea>
          </div>
        </section>

        <div class="form-actions">
          <button type="button" @click="limpar" class="btn btn-light" :disabled="produtoStore.isLoading">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="produtoStore.isLoading">
            {{ produto.id ? 'Atualizar Produto' : 'Salvar Produto' }}
          </button>
        </div>
      </form>
    </div>

    <hr class="divider" />

    <div v-if="produtoStore.isLoading" class="loading-message">
      Carregando produtos...
    </div>

    <div v-else-if="produtoStore.produtos.length === 0" class="empty-state">
      <p>Nenhum produto encontrado.</p>
    </div>

    <ul class="crud-list" v-else>
      <li v-for="p in produtoStore.produtos" :key="p.id" class="list-item" :class="{
        'status-inactive': !p.ativo,
        'status-warning': p.ativo && p.estoque_baixo
      }" @click="editar(p)">
        <div class="item-main-info">
          <span class="id-tag">#{{ p.id }}</span>
          <span class="item-name">{{ p.nome }}</span>
          <span class="item-status" v-if="!p.ativo">INATIVO</span>
          <span class="item-status warning" v-if="p.ativo && p.estoque_baixo">ESTOQUE BAIXO</span>
        </div>

        <div class="item-details">
          <span class="detail-tag">Custo: {{ formatCurrency(p.preco_custo) }}</span>
          <span class="detail-tag price">Venda: {{ formatCurrency(p.preco_venda) }}</span>
          <span class="detail-tag stock">Estoque: {{ p.estoque_atual }}</span>
        </div>

        <div class="item-actions">
          <button @click.stop="editar(p)" class="btn-action btn-edit" title="Editar">
            ✏️
          </button>
          <button @click.stop="excluir(p.id)" class="btn-action btn-delete" title="Excluir">
            🗑️
          </button>
        </div>
      </li>
    </ul>

    <div class="paginator" v-if="!produtoStore.isLoading && produtoStore.meta.total_pages > 1">
      <button class="btn btn-light" :disabled="produtoStore.meta.page <= 1" @click="produtoStore.paginaAnterior">
        Anterior
      </button>
      <span>Página {{ produtoStore.meta.page }} de {{ produtoStore.meta.total_pages }}</span>
      <button class="btn btn-light" :disabled="produtoStore.meta.page >= produtoStore.meta.total_pages"
        @click="produtoStore.proximaPagina">
        Próxima
      </button>
    </div>

  </div>
</template>

<style scoped>
/* --- Container Principal --- */
.crud-container {
  max-width: 1200px;
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
  justify-content: space-between;
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

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.form-group.span-2 {
  grid-column: span 2;
}

.form-group.span-3 {
  grid-column: span 3;
}

.form-group.span-4 {
  grid-column: span 4;
}

/* Checkbox */
.checkbox-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  /* Alinha com inputs */
}

.checkbox-group.align-end {
  align-items: flex-end;
  padding-bottom: 10px;
  /* Ajuste fino */
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
  grid-template-columns: 1fr auto auto;
  /* Info | Detalhes | Ações */
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-left-width: 6px;
  border-left-color: var(--color-accent);
  /* Padrão (Ativo) */
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

.detail-tag.price {
  color: var(--color-success);
  font-weight: var(--font-weight-semibold);
  background-color: var(--color-primary-light);
}

.detail-tag.stock {
  color: var(--color-accent-dark);
  font-weight: var(--font-weight-medium);
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

.btn-edit:hover {
  color: var(--color-accent);
}

.btn-delete:hover {
  color: var(--color-danger);
}

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

  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }

  .list-item {
    grid-template-columns: 1fr auto;
    /* Info | Ações */
    gap: var(--spacing-sm);
  }

  .item-details {
    grid-column: 1 / 2;
    /* Detalhes vão para baixo */
    grid-row: 2 / 3;
    flex-wrap: wrap;
  }

  .item-actions {
    grid-column: 2 / 3;
    grid-row: 1 / 3;
    /* Ocupa as duas "linhas" */
    flex-direction: column;
  }
}

@media (max-width: 600px) {

  .grid-cols-2,
  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: 1fr;
    /* Coluna única */
  }

  .form-group.span-2,
  .form-group.span-3,
  .form-group.span-4 {
    grid-column: span 1;
  }

  .checkbox-group.align-end {
    align-items: center;
    padding-top: var(--spacing-sm);
    padding-bottom: 0;
  }
}
</style>