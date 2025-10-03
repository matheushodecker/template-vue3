<script setup>
import { reactive, onMounted, ref, computed } from 'vue'
import { useProdutoStore } from '@/stores/produtoStore' 

const produtoStore = useProdutoStore()

// --- ESTADO DE CONTROLE ---
const formAberto = ref(false) 

// --- ESTADO DO FORMULÁRIO (omissão para brevidade) ---
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

// --- COMPUTED PROPERTY (omissão para brevidade) ---
const margemLucroCalculada = computed(() => {
    const custo = Number(produto.preco_custo || 0);
    const venda = Number(produto.preco_venda || 0);
    if (custo > 0) {
        const margem = ((venda - custo) / custo) * 100;
        return margem.toFixed(2);
    }
    return 0;
});


// --- CICLO DE VIDA E FUNÇÕES BÁSICAS ---
onMounted(async () => {
    // CHAMADA INICIAL: Ordenar por ID decrescente (-id)
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


// --- Funções de CRUD do Produto (omissão para brevidade) ---

async function salvar() {
    if (isFieldEmpty(produto.nome) || isFieldEmpty(produto.codigo_barras) || !produto.categoria || !produto.fornecedor) 
    {
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
</script>

<template>
  <div class="container">
    <h1>Gestão de Produtos</h1>

    <div class="form-toggle">
        <button 
            @click="toggleForm"
            :class="{ 'cancelar': formAberto }"
        >
            {{ produto.id ? 'Editar Produto' : formAberto ? 'Fechar Formulário' : 'Novo Produto' }}
        </button>
    </div>

    <form class="form-container" @submit.prevent="salvar" v-if="formAberto">
      <h2>{{ produto.id ? `Editar Produto #${produto.id}` : 'Novo Produto' }}</h2>

      <section>
        <h3>Dados Básicos</h3>
        <div class="form-group-grid" style="grid-template-columns: 2fr 1fr 1fr 1fr;">
          <div>
            <label for="nome">Nome do Produto*</label>
            <input id="nome" type="text" v-model="produto.nome" required placeholder="Ex: Arroz Branco 5kg" />
          </div>
          <div>
            <label for="codigoBarras">Código de Barras*</label>
            <input id="codigoBarras" type="text" v-model="produto.codigo_barras" required placeholder="Ex: 7891234567890" />
          </div>
          <div>
            <label for="categoria">Categoria*</label>
            <select id="categoria" v-model="produto.categoria" required>
              <option :value="null" disabled>Selecione a Categoria</option>
              <option v-for="c in produtoStore.categoriasDisponiveis" :key="c.id" :value="c.id">
                {{ c.nome }}
              </option>
            </select>
          </div>
          <div>
            <label for="fornecedor">Fornecedor*</label>
            <select id="fornecedor" v-model="produto.fornecedor" required>
              <option :value="null" disabled>Selecione o Fornecedor</option>
              <option v-for="f in produtoStore.fornecedoresDisponiveis" :key="f.id" :value="f.id">
                {{ f.nome }}
              </option>
            </select>
          </div>
        </div>
      </section>

      <section>
        <h3>Preços e Estoque</h3>
        <div class="form-group-grid" style="grid-template-columns: 1fr 1fr 1fr 1fr 1fr;">
            <div>
                <label for="precoCusto">Preço de Custo (R$)*</label>
                <input id="precoCusto" type="number" step="0.01" v-model.number="produto.preco_custo" required placeholder="0.00" />
            </div>
            <div>
                <label for="precoVenda">Preço de Venda (R$)*</label>
                <input id="precoVenda" type="number" step="0.01" v-model.number="produto.preco_venda" required placeholder="0.00" />
            </div>
            <div>
                <label>Margem de Lucro (%)</label>
                <input type="text" :value="margemLucroCalculada" disabled class="subtotal-input" />
            </div>
            <div>
                <label for="estoqueAtual">Estoque Atual*</label>
                <input id="estoqueAtual" type="number" v-model.number="produto.estoque_atual" required placeholder="0" />
            </div>
            <div>
                <label for="estoqueMinimo">Estoque Mínimo*</label>
                <input id="estoqueMinimo" type="number" v-model.number="produto.estoque_minimo" required placeholder="5" />
            </div>
        </div>
      </section>

      <div class="form-group-full">
        <div>
            <label for="descricao">Descrição</label>
            <textarea id="descricao" v-model="produto.descricao" placeholder="Detalhes do produto, ingredientes, etc."></textarea>
        </div>
      </div>
      <div class="checkbox-group" style="margin-top: 15px;">
        <input id="ativo" type="checkbox" v-model="produto.ativo" />
        <label for="ativo" class="inline-label">Produto Ativo no Estoque</label>
      </div>


      <div class="form-actions">
        <button type="submit" :disabled="produtoStore.isLoading">
          {{ produto.id ? 'Atualizar' : 'Salvar' }} Produto
        </button>
        <button type="button" @click="limpar" class="cancelar" :disabled="produtoStore.isLoading">
          Cancelar
        </button>
      </div>
    </form>
    
    <hr>
    
    <div v-if="produtoStore.isLoading" class="loading-message">
        Carregando produtos...
    </div>

    <ul class="produto-list" v-else>
      <li v-for="p in produtoStore.produtos" :key="p.id" :class="{ 'produto-inativo': !p.ativo, 'produto-baixo-estoque': p.estoque_baixo }">
        <span class="produto-info" @click="editar(p)">
          <span class="id-tag">#{{ p.id }}</span>
          <strong>{{ p.nome }}</strong> 
          <span class="margem-lucro">ML: {{ Number(p.margem_lucro).toFixed(2) }}%</span>
          <span class="preco-venda">R$ {{ Number(p.preco_venda).toFixed(2) }}</span>
          <span class="estoque">Estoque: {{ p.estoque_atual }}</span>
        </span>
        <div class="actions">
          <button @click="editar(p)" class="editar">Editar</button>
          <button @click="excluir(p.id)" class="excluir">Excluir</button>
        </div>
      </li>
    </ul>

    <div class="paginator" v-if="produtoStore.meta.total_pages > 1">
      <button 
        :disabled="produtoStore.meta.page <= 1 || produtoStore.isLoading" 
        @click="produtoStore.paginaAnterior"
      >
        Anterior
      </button>
      <span>Página {{ produtoStore.meta.page }} de {{ produtoStore.meta.total_pages }}</span>
      <button
        :disabled="produtoStore.meta.page >= produtoStore.meta.total_pages || produtoStore.isLoading"
        @click="produtoStore.proximaPagina"
      >
        Próxima
      </button>
    </div>

  </div>
</template>

<style scoped>
/* Variáveis para fácil manutenção de cores */
:root {
  --primary-color: #41b883; /* Vue Green */
  --secondary-color: #34495e; /* Dark Blue/Gray */
  --accent-color: #3498db; /* Blue for Edit */
  --danger-color: #e74c3c; /* Red for Delete/Inativo */
  --low-stock-color: #f39c12; /* Yellow/Orange para Estoque Baixo */
  --light-bg: #f7f9fb;
  --white: #ffffff;
  --border-color: #e0e0e0;
}

.container {
  max-width: 1200px; /* Mais largo para acomodar os campos de estoque/preço */
  margin: 40px auto;
  padding: 40px;
  background-color: var(--white);
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* --- Títulos e Headers --- */
h1 {
  text-align: center;
  color: var(--secondary-color);
  margin-bottom: 35px;
  font-size: 2.5rem;
  font-weight: 700;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 10px;
}

h2 {
  font-size: 1.6rem;
  color: var(--secondary-color);
  margin-bottom: 20px;
  font-weight: 600;
}

h3 { /* Títulos de Seção */
    font-size: 1.3rem;
    color: var(--secondary-color);
    margin-top: 25px;
    margin-bottom: 15px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 5px;
}

/* --- Toggle Button --- */
.form-toggle {
    margin-bottom: 25px;
    text-align: right;
}
.form-toggle button {
    text-transform: none; 
}

/* --- Formulário Geral e Layout de Grid --- */
.form-container {
  padding: 25px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  margin-bottom: 30px;
  background-color: var(--light-bg);
}

/* Grid Básico (ajustado para Produtos) */
.form-group-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.form-group-full {
    display: flex;
    gap: 15px;
    margin-top: 15px;
}
.form-group-full > div {
    flex: 1;
}

label {
    display: block; 
    font-weight: 600;
    color: var(--secondary-color);
    font-size: 0.95rem;
    margin-bottom: 5px; 
}

/* Estilos de input/select/textarea */
input[type='text'], input[type='number'], select, textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
  background-color: var(--white);
}

input[type='text']:focus, input[type='number']:focus, select:focus, textarea:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(65, 184, 131, 0.2);
}

/* Estilo para campo de margem de lucro (calculado) */
.subtotal-input {
    background-color: #e8f0fe; /* Cor que indica calculado/desabilitado */
    font-weight: 600;
    color: var(--accent-color);
}

/* Checkbox e Label Inline */
.checkbox-group {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 5px; 
}
.checkbox-group input[type="checkbox"] {
    width: 20px;
    height: 20px;
}
.checkbox-group label.inline-label {
    font-weight: normal;
    margin: 0;
    cursor: pointer;
}


/* --- Ações e Botões --- */
.form-actions {
  display: flex;
  justify-content: flex-end; 
  gap: 15px;
  margin-top: 30px;
  padding-top: 15px;
  border-top: 1px solid var(--border-color);
}

button {
  padding: 12px 25px;
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
}

button:hover:not(:disabled) {
  background-color: #358a66;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

button.cancelar {
  background-color: #95a5a6;
  text-transform: none;
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

/* --- Lista e Itens (.produto-list) --- */
.loading-message {
  text-align: center;
  color: var(--primary-color);
  font-size: 1.2rem;
  font-weight: 600;
  margin: 30px 0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}

.produto-list { /* Estilo da lista principal */
  list-style: none;
  padding: 0;
  display: grid;
  gap: 10px;
}

.produto-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  background-color: var(--white);
  border: 1px solid var(--border-color);
  border-left: 6px solid var(--accent-color);
  border-radius: 8px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s, transform 0.3s;
}

.produto-list li:hover {
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* Estilos de Status */
.produto-list li.produto-inativo {
  border-left-color: var(--danger-color);
  opacity: 0.7;
}
.produto-list li.produto-baixo-estoque {
    border-left-color: var(--low-stock-color);
    animation: flash-border 1.5s infinite alternate; /* Efeito de alerta */
}
@keyframes flash-border {
    from { border-color: var(--low-stock-color); }
    to { border-color: #ff9900; }
}


.produto-info {
  flex-grow: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--secondary-color);
  gap: 15px;
}

.produto-info strong {
  font-size: 1.15rem;
  margin-right: 15px;
  color: #2c3e50;
}

.id-tag {
  background-color: #ecf0f1;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  margin-right: 15px;
  color: #7f8c8d;
  font-weight: 700;
}

/* Estilos para Margem de Lucro, Preço e Estoque */
.margem-lucro {
    font-size: 0.95rem;
    color: var(--primary-color);
    font-weight: 600;
}
.preco-venda {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--secondary-color);
    margin-left: 15px;
}
.estoque {
    font-size: 1rem;
    color: #7f8c8d;
    margin-left: 15px;
}


.actions button {
  margin-left: 10px;
  padding: 8px 15px;
  font-size: 0.95rem;
  text-transform: none;
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
