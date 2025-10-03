<script setup>
import { reactive, onMounted, ref } from 'vue'
import { useFormaPagamentoStore } from '@/stores/formaPagamentoStore' 

const formaPagamentoStore = useFormaPagamentoStore()

// --- ESTADO DE CONTROLE DE VISIBILIDADE E DADOS ---
const formAberto = ref(false) 

const defaultForma = { 
    id: null, 
    nome: '', 
    descricao: '',
    taxa_percentual: 0.00,
    taxa_fixa: 0.00,
    prazo_recebimento: 0,
    ativo: true,
}
const forma = reactive({ ...defaultForma })

onMounted(async () => {
    await formaPagamentoStore.getFormas() 
})

// --- Funções de Ação ---
function limpar() {
    Object.assign(forma, { ...defaultForma })
    formAberto.value = false
}

async function salvar() {
    if (!forma.nome.trim()) {
        alert("O Nome da Forma de Pagamento é obrigatório.")
        return
    }
    
    // Assegura que o número é enviado corretamente
    const dadosParaEnviar = { ...forma };
    dadosParaEnviar.prazo_recebimento = Number(dadosParaEnviar.prazo_recebimento);
    dadosParaEnviar.taxa_percentual = Number(dadosParaEnviar.taxa_percentual);
    dadosParaEnviar.taxa_fixa = Number(dadosParaEnviar.taxa_fixa);

    await formaPagamentoStore.salvarForma(dadosParaEnviar)
    limpar()
}

function editar(forma_para_editar) {
    Object.assign(forma, forma_para_editar)
    formAberto.value = true
}

async function excluir(id) {
    if (confirm("Tem certeza que deseja excluir esta Forma de Pagamento?")) {
        await formaPagamentoStore.excluirForma(id)
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
    <h1>Gestão de Formas de Pagamento</h1>

    <div class="form-toggle">
        <button 
            @click="toggleForm"
            :class="{ 'cancelar': formAberto }"
        >
            {{ forma.id ? 'Editar Forma' : formAberto ? 'Fechar Formulário' : 'Nova Forma de Pagamento' }}
        </button>
    </div>

    <form class="form-container" @submit.prevent="salvar" v-if="formAberto">
      <h2>{{ forma.id ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento' }}</h2>

      <div class="form-group-grid" style="grid-template-columns: 2fr 1fr;">
        <div>
            <label for="nome">Nome*</label>
            <input 
                id="nome" 
                type="text" 
                v-model="forma.nome" 
                required 
                placeholder="Ex: Cartão de Crédito, Pix"
            />
        </div>
        <div>
            <label for="prazoRecebimento">Prazo Recebimento (dias)</label>
            <input 
                id="prazoRecebimento" 
                type="number" 
                v-model.number="forma.prazo_recebimento" 
                placeholder="Ex: 30"
            />
        </div>
      </div>

      <section>
        <h3>Taxas</h3>
        <div class="form-group-grid" style="grid-template-columns: 1fr 1fr 2fr;">
            <div>
                <label for="taxaPercentual">Taxa Percentual (%)</label>
                <input 
                    id="taxaPercentual" 
                    type="number" 
                    step="0.01" 
                    v-model.number="forma.taxa_percentual" 
                    placeholder="Ex: 2.50"
                />
            </div>
            <div>
                <label for="taxaFixa">Taxa Fixa (R$)</label>
                <input 
                    id="taxaFixa" 
                    type="number" 
                    step="0.01" 
                    v-model.number="forma.taxa_fixa" 
                    placeholder="Ex: 0.50"
                />
            </div>
            <div class="checkbox-group">
                <input id="ativo" type="checkbox" v-model="forma.ativo" />
                <label for="ativo" class="inline-label">Forma Ativa</label>
            </div>
        </div>
      </section>

      <div class="form-group-full">
        <div>
            <label for="descricao">Descrição / Regras</label>
            <textarea 
                id="descricao" 
                v-model="forma.descricao" 
                placeholder="Detalhes sobre quando esta forma de pagamento pode ser usada."
            ></textarea>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="formaPagamentoStore.isLoading">
          {{ forma.id ? 'Atualizar' : 'Salvar' }} Forma
        </button>
        <button type="button" @click="limpar" class="cancelar" :disabled="formaPagamentoStore.isLoading">
          Cancelar
        </button>
      </div>
    </form>
    
    <hr>
    
    <div v-if="formaPagamentoStore.isLoading" class="loading-message">
        Carregando formas de pagamento...
    </div>

    <ul class="forma-pagamento-list" v-else>
      <li v-for="f in formaPagamentoStore.formas" :key="f.id" :class="{ 'forma-inativa': !f.ativo }">
        <span class="forma-info" @click="editar(f)">
          <span class="id-tag">#{{ f.id }}</span>
          <strong>{{ f.nome }}</strong> 
          <span class="taxa">Taxa: {{ Number(f.taxa_percentual).toFixed(2) }}% + R$ {{ Number(f.taxa_fixa).toFixed(2) }}</span>
          <span class="prazo">Recebimento em {{ f.prazo_recebimento }} dias</span>
        </span>
        <div class="actions">
          <button @click="editar(f)" class="editar">Editar</button>
          <button @click="excluir(f.id)" class="excluir">Excluir</button>
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
  --danger-color: #e74c3c; /* Red for Delete */
  --light-bg: #f7f9fb;
  --white: #ffffff;
  --border-color: #e0e0e0;
}

.container {
  max-width: 900px; /* Tamanho ideal para este formulário */
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

/* Grid Básico para os campos (200px por coluna) */
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

/* Checkbox e Label Inline */
.checkbox-group {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 15px; /* Ajustado para alinhar melhor no grid */
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

/* --- Lista e Itens (.forma-pagamento-list) --- */
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

.forma-pagamento-list { /* Estilo da lista principal */
  list-style: none;
  padding: 0;
  display: grid;
  gap: 10px;
}

.forma-pagamento-list li {
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

.forma-pagamento-list li:hover {
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.forma-pagamento-list li.forma-inativa {
  border-left-color: var(--danger-color);
  opacity: 0.7;
}

.forma-info {
  flex-grow: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--secondary-color);
  gap: 15px;
}

.forma-info strong {
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

.taxa, .prazo { /* Estilos para informações adicionais */
    font-size: 0.9rem;
    color: #555;
    margin-left: 10px;
    background-color: #f0f0f0;
    padding: 4px 8px;
    border-radius: 4px;
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
