<script setup>
import { reactive, onMounted, ref } from 'vue'
import { useClienteStore } from '@/stores/clienteStore' 

const clienteStore = useClienteStore()

// --- ESTADO DE CONTROLE DE VISIBILIDADE E DADOS ---
const formAberto = ref(false) 

const defaultCliente = { 
    id: null, 
    nome: '', 
    tipo_pessoa: 'F', // Default: Pessoa Física
    cpf_cnpj: '',
    rg_ie: null,
    
    // Endereço (Todos opcionais no Modelo Django)
    endereco: null,
    bairro: null,
    cidade: null,
    estado: null,
    cep: null,
    
    // Contato (email é obrigatório no Serializer)
    telefone: null,
    celular: null,
    email: '',
    
    // Adicionais
    data_nascimento: null,
    limite_credito: 0.00,
    ativo: true,
    observacoes: null,
}
const cliente = reactive({ ...defaultCliente })

// 2. Ciclo de Vida: Carregar dados
onMounted(async () => {
    await clienteStore.getClientes()
})

// Função auxiliar para verificar se o campo está vazio
function isFieldEmpty(value) {
    if (typeof value === 'string') return value.trim() === '';
    return value === null || value === undefined;
}

// --- Funções de Ação ---
function limpar() {
    Object.assign(cliente, { ...defaultCliente })
    formAberto.value = false
}

async function salvar() {
    // 1. VALIDAÇÃO EXPLÍCITA de campos OBRIGATÓRIOS
    if (isFieldEmpty(cliente.nome) || isFieldEmpty(cliente.cpf_cnpj) || isFieldEmpty(cliente.email)) 
    {
        alert("Nome, CPF/CNPJ e Email são campos obrigatórios.")
        return
    }
    
    // 2. Cria a cópia dos dados
    const dadosParaEnviar = { ...cliente };
    
    // 3. LIMPEZA CRÍTICA: CPF/CNPJ (removendo máscara)
    if (dadosParaEnviar.cpf_cnpj) {
        dadosParaEnviar.cpf_cnpj = dadosParaEnviar.cpf_cnpj.replace(/[^\d]/g, ''); 
    }

    // 4. TRATAMENTO DE CAMPOS OPCIONAIS (Garantindo que "" seja enviado como null)
    // O DRF aceita null para campos opcionais, mas não strings vazias para DateField ou CharField se forem interpretados mal.
    if (isFieldEmpty(dadosParaEnviar.data_nascimento)) {
        dadosParaEnviar.data_nascimento = null;
    }
    // Aplica para todos os CharFields opcionais que estejam vazios (evita erros ambíguos)
    for (const key of ['rg_ie', 'endereco', 'bairro', 'cidade', 'estado', 'cep', 'telefone', 'celular', 'observacoes']) {
        if (isFieldEmpty(dadosParaEnviar[key])) {
            dadosParaEnviar[key] = null;
        }
    }

    await clienteStore.salvarCliente(dadosParaEnviar)
    limpar()
}

function editar(cliente_para_editar) {
    // Formatação da data de nascimento para o input type="date"
    const dataNascimentoFormatada = cliente_para_editar.data_nascimento ? 
                                    cliente_para_editar.data_nascimento.substring(0, 10) : null;
    
    Object.assign(cliente, { 
        ...cliente_para_editar, 
        data_nascimento: dataNascimentoFormatada,
        // Garante que a chave estrangeira seja tratada
        tipo_pessoa: cliente_para_editar.tipo_pessoa || 'F'
    })
    formAberto.value = true
}

async function excluir(id) {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
        await clienteStore.excluirCliente(id)
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
    <h1>Gerenciamento de Clientes</h1>

    <div class="form-toggle">
        <button 
            @click="toggleForm"
            :class="{ 'cancelar': formAberto }"
        >
            {{ cliente.id ? 'Editar Cliente' : formAberto ? 'Fechar Formulário' : 'Novo Cliente' }}
        </button>
    </div>

    <form class="form-container" @submit.prevent="salvar" v-if="formAberto">
      <h2>{{ cliente.id ? 'Editar Cliente' : 'Novo Cliente' }}</h2>

      <section>
        <h3>Dados Básicos</h3>
        <div class="form-group-grid" style="grid-template-columns: 2fr 1fr 1fr 1fr;">
          <div>
            <label for="nome">Nome/Razão Social*</label>
            <input id="nome" type="text" v-model="cliente.nome" required placeholder="Nome do Cliente" />
          </div>
          <div>
            <label for="tipoPessoa">Tipo Pessoa</label>
            <select id="tipoPessoa" v-model="cliente.tipo_pessoa">
              <option value="F">Pessoa Física</option>
              <option value="J">Pessoa Jurídica</option>
            </select>
          </div>
          <div>
            <label for="cpfCnpj">CPF/CNPJ*</label>
            <input id="cpfCnpj" type="tel" v-model="cliente.cpf_cnpj" required placeholder="Apenas números" />
          </div>
          <div>
            <label for="rgIe">RG/Inscrição Estadual</label>
            <input id="rgIe" type="text" v-model="cliente.rg_ie" placeholder="RG ou Inscrição Estadual (Opcional)" />
          </div>
        </div>
      </section>

      <section>
        <h3>Contato e Crédito</h3>
        <div class="form-group-grid">
          <div>
            <label for="email">Email*</label>
            <input id="email" type="email" v-model="cliente.email" required placeholder="email@dominio.com" />
          </div>
          <div>
            <label for="celular">Celular</label>
            <input id="celular" type="tel" v-model="cliente.celular" placeholder="(XX) 9XXXX-XXXX" />
          </div>
          <div>
            <label for="telefone">Telefone</label>
            <input id="telefone" type="tel" v-model="cliente.telefone" placeholder="(XX) XXXX-XXXX" />
          </div>
          <div>
            <label for="limiteCredito">Limite de Crédito</label>
            <input id="limiteCredito" type="number" step="0.01" v-model.number="cliente.limite_credito" placeholder="0.00" />
          </div>
          <div>
            <label for="dataNascimento">Nascimento</label>
            <input id="dataNascimento" type="date" v-model="cliente.data_nascimento" />
          </div>
          <div class="checkbox-group">
            <input id="ativo" type="checkbox" v-model="cliente.ativo" />
            <label for="ativo" class="inline-label">Cliente Ativo</label>
          </div>
        </div>
      </section>

      <section>
        <h3>Endereço (Opcional)</h3>
        <div class="form-group-grid-address">
          <div class="full-width">
            <label for="endereco">Endereço</label>
            <input id="endereco" type="text" v-model="cliente.endereco" placeholder="Rua, Número e Complemento" />
          </div>

          <div>
            <label for="bairro">Bairro</label>
            <input id="bairro" type="text" v-model="cliente.bairro" />
          </div>
          <div>
            <label for="cidade">Cidade</label>
            <input id="cidade" type="text" v-model="cliente.cidade" />
          </div>
          <div>
            <label for="estado">Estado</label>
            <input id="estado" type="text" v-model="cliente.estado" maxlength="2" placeholder="Ex: SC" />
          </div>
          <div>
            <label for="cep">CEP</label>
            <input id="cep" type="text" v-model="cliente.cep" placeholder="00000-000" />
          </div>
        </div>
      </section>
      
      <div class="form-group-full">
        <div>
            <label for="observacoesGerais">Observações</label>
            <textarea id="observacoesGerais" v-model="cliente.observacoes"></textarea>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="clienteStore.isLoading">
          {{ cliente.id ? 'Atualizar' : 'Salvar' }} Cliente
        </button>
        <button type="button" @click="limpar" class="cancelar" :disabled="clienteStore.isLoading">
          Cancelar
        </button>
      </div>
    </form>
    
    <hr>
    
    <div v-if="clienteStore.isLoading" class="loading-message">
        Carregando clientes...
    </div>

    <ul class="cliente-list" v-else>
      <li v-for="c in clienteStore.clientes" :key="c.id" :class="{ 'cliente-inativo': !c.ativo }">
        <span class="cliente-info" @click="editar(c)">
          <span class="id-tag">#{{ c.id }}</span>
          <strong>{{ c.nome }}</strong> 
          <span class="cpf-cnpj">{{ c.cpf_cnpj }}</span>
          <span class="email">{{ c.email }}</span>
        </span>
        <div class="actions">
          <button @click="editar(c)" class="editar">Editar</button>
          <button @click="excluir(c.id)" class="excluir">Excluir</button>
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
  max-width: 1200px; /* Aumentado para acomodar o formulário longo */
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

/* Grid específico para Endereço */
.form-group-grid-address {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 80px 1fr; /* Endereço, Bairro, Cidade, Estado, CEP */
    gap: 15px;
    margin-bottom: 20px;
}

/* Ocupa a largura total */
.form-group-grid-address .full-width, .form-group-full > div {
    grid-column: 1 / -1;
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
input[type='text'], input[type='tel'], input[type='email'], input[type='url'], input[type='number'], input[type='date'], select, textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
  background-color: var(--white);
}

input[type='text']:focus, input[type='tel']:focus, input[type='email']:focus, input[type='url']:focus, input[type='number']:focus, input[type='date']:focus, select:focus, textarea:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(65, 184, 131, 0.2);
}

/* Checkbox e Label Inline */
.checkbox-group {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 25px; 
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

/* --- Lista e Itens (.cliente-list) --- */
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

.cliente-list { /* Estilo da lista principal */
  list-style: none;
  padding: 0;
  display: grid;
  gap: 10px;
}

.cliente-list li {
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

.cliente-list li:hover {
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.cliente-list li.cliente-inativo {
  border-left-color: var(--danger-color);
  opacity: 0.7;
}

.cliente-info {
  flex-grow: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--secondary-color);
  gap: 15px;
}

.cliente-info strong {
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

.cpf-cnpj, .email { /* Estilos para CPF/CNPJ e email na lista */
    font-size: 1rem;
    color: #555;
    margin-left: 10px;
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
