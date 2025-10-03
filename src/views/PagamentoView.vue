<script setup>
import { reactive, onMounted, ref } from 'vue'
import { usePagamentoStore } from '@/stores/pagamentoStore' 

const pagamentoStore = usePagamentoStore()

// --- ESTADO DE CONTROLE DE VISIBILIDADE E DADOS ---
const formAberto = ref(false) 

// Opções de Status (do Modelo Django)
const STATUS_OPTIONS = [
    { value: 'P', label: 'Pendente' },
    { value: 'R', label: 'Recebido' },
    { value: 'C', label: 'Cancelado' },
];

const defaultPagamento = { 
    id: null, 
    venda: null, // FK ID da Venda
    forma_pagamento: null, // FK ID da FormaPagamento
    valor: 0.00,
    data_vencimento: null, // Campo obrigatório
    data_recebimento: null, // Campo opcional
    status: 'P', // Default: Pendente
    observacoes: null,
}
const pagamento = reactive({ ...defaultPagamento })

onMounted(async () => {
    // Carrega a lista de pagamentos e as dependências (Vendas e Formas)
    await Promise.all([
        pagamentoStore.getPagamentos(),
        pagamentoStore.loadDependencies()
    ]);
})

// --- Funções de Ação ---
function limpar() {
    Object.assign(pagamento, { ...defaultPagamento })
    formAberto.value = false
}

async function salvar() {
    // Validação de campos obrigatórios: Venda, Forma, Valor, Data de Vencimento
    if (!pagamento.venda || !pagamento.forma_pagamento || !pagamento.valor || !pagamento.data_vencimento) 
    {
        alert("Venda, Forma de Pagamento, Valor e Data de Vencimento são obrigatórios.")
        return
    }
    
    const dadosParaEnviar = { ...pagamento };
    
    // Tratamento de campos opcionais vazios (como data_recebimento e observacoes)
    if (dadosParaEnviar.data_recebimento === '') {
        dadosParaEnviar.data_recebimento = null;
    }
    if (dadosParaEnviar.observacoes === '') {
        dadosParaEnviar.observacoes = null;
    }
    
    await pagamentoStore.salvarPagamento(dadosParaEnviar)
    limpar()
}

function editar(pagamento_para_editar) {
    // Formatação das datas para o input type="date"
    const dataVencimentoFormatada = pagamento_para_editar.data_vencimento ? 
                                    pagamento_para_editar.data_vencimento.substring(0, 10) : null;
    const dataRecebimentoFormatada = pagamento_para_editar.data_recebimento ? 
                                     pagamento_para_editar.data_recebimento.substring(0, 10) : null;
    
    Object.assign(pagamento, { 
        ...pagamento_para_editar,
        data_vencimento: dataVencimentoFormatada,
        data_recebimento: dataRecebimentoFormatada,
    })
    formAberto.value = true
}

async function excluir(id) {
    if (confirm("Tem certeza que deseja excluir este Pagamento?")) {
        await pagamentoStore.excluirPagamento(id)
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
    <h1>Gestão de Pagamentos</h1>

    <div class="form-toggle">
        <button 
            @click="toggleForm"
            :class="{ 'cancelar': formAberto }"
        >
            {{ pagamento.id ? 'Editar Pagamento' : formAberto ? 'Fechar Formulário' : 'Novo Pagamento' }}
        </button>
    </div>

    <form class="form-container" @submit.prevent="salvar" v-if="formAberto">
      <h2>{{ pagamento.id ? 'Editar Pagamento' : 'Novo Pagamento' }}</h2>

      <section>
        <h3>Detalhes do Pagamento</h3>
        <div class="form-group-grid" style="grid-template-columns: 1fr 1fr 1fr;">
          <div>
            <label for="venda">Venda Relacionada*</label>
            <select id="venda" v-model="pagamento.venda" required>
              <option :value="null" disabled>Selecione a Venda</option>
              <option v-for="v in pagamentoStore.vendasDisponiveis" :key="v.id" :value="v.id">
                Venda #{{ v.id }} - R$ {{ Number(v.valor_total || 0).toFixed(2) }}
              </option>
            </select>
          </div>
          <div>
            <label for="formaPagamento">Forma de Pagamento*</label>
            <select id="formaPagamento" v-model="pagamento.forma_pagamento" required>
              <option :value="null" disabled>Selecione a Forma</option>
              <option v-for="f in pagamentoStore.formasDisponiveis" :key="f.id" :value="f.id">
                {{ f.nome }}
              </option>
            </select>
          </div>
          <div>
            <label for="valor">Valor (R$)*</label>
            <input 
                id="valor" 
                type="number" 
                step="0.01" 
                v-model.number="pagamento.valor" 
                required 
                placeholder="Ex: 150.00"
            />
          </div>
          <div>
            <label for="dataVencimento">Data de Vencimento*</label>
            <input id="dataVencimento" type="date" v-model="pagamento.data_vencimento" required />
          </div>
          <div>
            <label for="dataRecebimento">Data de Recebimento</label>
            <input id="dataRecebimento" type="date" v-model="pagamento.data_recebimento" />
          </div>
          <div>
            <label for="status">Status*</label>
            <select id="status" v-model="pagamento.status" required>
              <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">
                {{ s.label }}
              </option>
            </select>
          </div>
        </div>
      </section>

      <div class="form-group-full">
        <div>
            <label for="observacoes">Observações</label>
            <textarea id="observacoes" v-model="pagamento.observacoes"></textarea>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="pagamentoStore.isLoading">
          {{ pagamento.id ? 'Atualizar' : 'Salvar' }} Pagamento
        </button>
        <button type="button" @click="limpar" class="cancelar" :disabled="pagamentoStore.isLoading">
          Cancelar
        </button>
      </div>
    </form>
    
    <hr>
    
    <div v-if="pagamentoStore.isLoading" class="loading-message">
        Carregando pagamentos...
    </div>

    <ul class="pagamento-list" v-else>
      <li v-for="p in pagamentoStore.pagamentos" :key="p.id" :class="`pagamento-status-${p.status}`">
        <span class="pagamento-info" @click="editar(p)">
          <span class="id-tag">#{{ p.id }}</span>
          <strong>{{ p.forma_pagamento_nome }} (Venda #{{ p.venda }})</strong> 
          <span class="valor">R$ {{ Number(p.valor || 0).toFixed(2) }}</span>
          <span class="status-tag">{{ p.status_display }}</span>
          <span class="vencimento">Vencimento: {{ p.data_vencimento }}</span>
        </span>
        <div class="actions">
          <button @click="editar(p)" class="editar">Editar</button>
          <button @click="excluir(p.id)" class="excluir">Excluir</button>
        </div>
      </li>
    </ul>

    </div>
</template>
<style scoped>
/* Variáveis para fácil manutenção de cores */
:root {
  --primary-color: #41b883; /* Vue Green */
  --secondary-color: #34495e; /* Dark Blue/Gray */
  --accent-color: #3498db; /* Blue for Edit */
  --danger-color: #e74c3c; /* Red for Delete/Cancelado */
  --success-color: #27ae60; /* Green for Recebido */
  --warning-color: #f39c12; /* Yellow/Orange for Pendente */
  --light-bg: #f7f9fb;
  --white: #ffffff;
  --border-color: #e0e0e0;
}

.container {
  max-width: 1000px; /* Tamanho ideal para este formulário */
  margin: 40px auto;
  padding: 40px;
  background-color: var(--white);
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* --- Títulos --- */
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

h3 { /* Estilo para títulos de seção */
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

/* Grid Básico para os campos */
.form-group-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

/* Estilo para Textareas/Observações */
.form-group-full {
    display: flex;
    gap: 15px;
    margin-top: 15px;
}
.form-group-full > div {
    flex: 1;
}

/* Estilo para as Labels */
label {
    display: block; 
    font-weight: 600;
    color: var(--secondary-color);
    font-size: 0.95rem;
    margin-bottom: 5px; 
}

/* Estilos de input/select/textarea */
input[type='text'], input[type='number'], input[type='date'], select, textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
  background-color: var(--white);
}

input[type='text']:focus, input[type='number']:focus, input[type='date']:focus, select:focus, textarea:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(65, 184, 131, 0.2);
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

/* --- Lista e Itens (.pagamento-list) --- */
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

.pagamento-list { /* Estilo da lista principal */
  list-style: none;
  padding: 0;
  display: grid;
  gap: 10px;
}

.pagamento-list li {
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

.pagamento-list li:hover {
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* Estilos de Borda de Status */
.pagamento-list li.pagamento-status-P { /* Pendente */
  border-left-color: var(--warning-color);
}
.pagamento-list li.pagamento-status-R { /* Recebido */
  border-left-color: var(--success-color);
}
.pagamento-list li.pagamento-status-C { /* Cancelado */
  border-left-color: var(--danger-color);
  opacity: 0.7;
}

.pagamento-info {
  flex-grow: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--secondary-color);
  gap: 15px;
}

.pagamento-info strong {
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

.valor { /* Destaque para o valor */
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--success-color);
}

.status-tag { /* Tag de Status */
    font-size: 0.9rem;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 5px;
    margin-left: 10px;
    /* Estilos dinâmicos (serão definidos por classes de status) */
}

/* Estilos para o Status Display */
.pagamento-status-P .status-tag { background-color: #fef0cd; color: var(--warning-color); }
.pagamento-status-R .status-tag { background-color: #d4edda; color: var(--success-color); }
.pagamento-status-C .status-tag { background-color: #f8d7da; color: var(--danger-color); }


.vencimento {
    font-size: 0.9rem;
    color: #7f8c8d;
    margin-left: 20px;
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