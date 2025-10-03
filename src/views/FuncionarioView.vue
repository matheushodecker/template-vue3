<script setup>
import { reactive, onMounted, ref } from 'vue'
import { useFuncionarioStore } from '@/stores/funcionarioStore' 

const funcionarioStore = useFuncionarioStore()

// --- ESTADO DE CONTROLE DE VISIBILIDADE E DADOS ---
const formAberto = ref(false) 

// ... (defaultFuncionario permanece o mesmo) ...
const defaultFuncionario = { 
    id: null, 
    nome: '', 
    cpf: '',
    rg: '',
    data_nascimento: null,
    estado_civil: 'S', 
    endereco: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    celular: '',
    email: '',
    cargo: null, 
    salario: 0.00,
    data_admissao: null,
    data_demissao: null,
    ativo: true,
    observacoes: '', 
}
const funcionario = reactive({ ...defaultFuncionario })

// Função auxiliar para verificar se um campo obrigatório está vazio
function isFieldEmpty(value) {
    // Retorna true se for null, undefined, string vazia, ou número 0/null (para a FK 'cargo')
    if (typeof value === 'string') return value.trim() === '';
    return value === null || value === undefined;
}

// 2. Ciclo de Vida: Carregar dados
onMounted(async () => {
    await Promise.all([
        funcionarioStore.getFuncionarios(),
        funcionarioStore.getCargosDisponiveis()
    ]);
})

// --- Funções de Ação ---
function limpar() {
    Object.assign(funcionario, { ...defaultFuncionario })
    formAberto.value = false
}

async function salvar() {
    // 1. VALIDAÇÃO EXPLÍCITA DE TODOS OS CAMPOS OBRIGATÓRIOS
    if (isFieldEmpty(funcionario.nome) || isFieldEmpty(funcionario.cpf) || isFieldEmpty(funcionario.cargo) ||
        isFieldEmpty(funcionario.data_nascimento) || isFieldEmpty(funcionario.data_admissao) || isFieldEmpty(funcionario.rg) ||
        isFieldEmpty(funcionario.estado_civil) || isFieldEmpty(funcionario.endereco) || isFieldEmpty(funcionario.bairro) ||
        isFieldEmpty(funcionario.cidade) || isFieldEmpty(funcionario.estado) || isFieldEmpty(funcionario.cep) ||
        isFieldEmpty(funcionario.celular) || isFieldEmpty(funcionario.email) || isFieldEmpty(funcionario.salario)) 
    {
        alert("Todos os campos obrigatórios (marcados com *) devem ser preenchidos.")
        return
    }
    
    // 2. Cria a cópia dos dados
    const dadosParaEnviar = { ...funcionario };
    
    // 3. Limpeza de máscaras (CPF/RG)
    if (dadosParaEnviar.cpf) {
        dadosParaEnviar.cpf = dadosParaEnviar.cpf.replace(/[^\d]/g, ''); 
    }
    if (dadosParaEnviar.rg) {
        dadosParaEnviar.rg = dadosParaEnviar.rg.replace(/[^\w]/g, ''); 
    }
    
    // 4. CORREÇÃO CRÍTICA: Trata data_demissao (OPCIONAL) vazia como NULL, permitindo o salvamento.
    if (isFieldEmpty(dadosParaEnviar.data_demissao)) {
        dadosParaEnviar.data_demissao = null;
    }

    // NENHUMA LÓGICA DE CONVERSÃO PARA NULL PARA data_nascimento (Obrigatório)

    await funcionarioStore.salvarFuncionario(dadosParaEnviar)
    limpar()
}

function editar(funcionario_para_editar) {
    const dataNascimentoFormatada = funcionario_para_editar.data_nascimento ? 
                                    funcionario_para_editar.data_nascimento.substring(0, 10) : null;
    const dataAdmissaoFormatada = funcionario_para_editar.data_admissao ? 
                                  funcionario_para_editar.data_admissao.substring(0, 10) : null;
    
    Object.assign(funcionario, { 
        ...funcionario_para_editar, 
        data_nascimento: dataNascimentoFormatada,
        data_admissao: dataAdmissaoFormatada,
        // Garante que o campo de data opcional seja NULL se estiver vazio
        data_demissao: funcionario_para_editar.data_demissao ? funcionario_para_editar.data_demissao.substring(0, 10) : null
    })
    formAberto.value = true
}

async function excluir(id) {
    if (confirm("Tem certeza que deseja excluir este funcionário?")) {
        await funcionarioStore.excluirFuncionario(id)
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
    <h1>Gerenciamento de Funcionários</h1>

    <div class="form-toggle">
        <button 
            @click="toggleForm"
            :class="{ 'cancelar': formAberto }"
        >
            {{ funcionario.id ? 'Editar Funcionário' : formAberto ? 'Fechar Formulário' : 'Novo Funcionário' }}
        </button>
    </div>

    <form class="form-container" @submit.prevent="salvar" v-if="formAberto">
      <h2>{{ funcionario.id ? 'Editar Funcionário' : 'Novo Funcionário' }}</h2>

      <section>
        <h3>Dados Pessoais</h3>
        <div class="form-group-grid" style="grid-template-columns: 2fr 1fr 1fr 1fr 1fr;">
          <div>
            <label for="nome">Nome Completo*</label>
            <input id="nome" type="text" v-model="funcionario.nome" required />
          </div>
          <div>
            <label for="cpf">CPF*</label>
            <input id="cpf" type="tel" v-model="funcionario.cpf" required placeholder="Apenas números" maxlength="14" />
          </div>
          <div>
            <label for="rg">RG*</label>
            <input id="rg" type="text" v-model="funcionario.rg" required />
          </div>
          <div>
            <label for="dataNascimento">Nascimento*</label>
            <input id="dataNascimento" type="date" v-model="funcionario.data_nascimento" required />
          </div>
          <div>
            <label for="estadoCivil">Estado Civil*</label>
            <select id="estadoCivil" v-model="funcionario.estado_civil" required>
              <option value="S">Solteiro</option>
              <option value="C">Casado</option>
              <option value="D">Divorciado</option>
              <option value="V">Viúvo</option>
            </select>
          </div>
        </div>
      </section>

      <section>
        <h3>Dados Profissionais e Contato</h3>
        <div class="form-group-grid" style="grid-template-columns: 2fr 1fr 1fr 1fr;">
          <div>
            <label for="cargo">Cargo*</label>
            <select id="cargo" v-model="funcionario.cargo" required>
              <option :value="null" disabled>Selecione o Cargo</option>
              <option v-for="c in funcionarioStore.cargosDisponiveis" :key="c.id" :value="c.id">
                {{ c.nome }}
              </option>
            </select>
          </div>
          <div>
            <label for="salario">Salário*</label>
            <input id="salario" type="number" step="0.01" v-model.number="funcionario.salario" required placeholder="0.00" />
          </div>
          <div>
            <label for="dataAdmissao">Admissão*</label>
            <input id="dataAdmissao" type="date" v-model="funcionario.data_admissao" required />
          </div>
          <div>
            <label for="dataDemissao">Demissão</label>
            <input id="dataDemissao" type="date" v-model="funcionario.data_demissao" />
          </div>
          
          <div>
            <label for="email">Email*</label>
            <input id="email" type="email" v-model="funcionario.email" required placeholder="email@empresa.com" />
          </div>
          <div>
            <label for="celular">Celular*</label>
            <input id="celular" type="tel" v-model="funcionario.celular" required placeholder="(XX) 9XXXX-XXXX" />
          </div>
          <div>
            <label for="telefone">Telefone</label>
            <input id="telefone" type="tel" v-model="funcionario.telefone" placeholder="(XX) XXXX-XXXX" />
          </div>
          <div class="checkbox-group">
            <input id="ativo" type="checkbox" v-model="funcionario.ativo" />
            <label for="ativo" class="inline-label">Funcionário Ativo</label>
          </div>
        </div>
      </section>

      <section>
        <h3>Endereço</h3>
        <div class="form-group-grid-address">
          <div class="full-width">
            <label for="endereco">Endereço*</label>
            <input id="endereco" type="text" v-model="funcionario.endereco" required placeholder="Rua, Número e Complemento" />
          </div>

          <div>
            <label for="bairro">Bairro*</label>
            <input id="bairro" type="text" v-model="funcionario.bairro" required />
          </div>
          <div>
            <label for="cidade">Cidade*</label>
            <input id="cidade" type="text" v-model="funcionario.cidade" required />
          </div>
          <div>
            <label for="estado">Estado*</label>
            <input id="estado" type="text" v-model="funcionario.estado" required maxlength="2" placeholder="Ex: SC" />
          </div>
          <div>
            <label for="cep">CEP*</label>
            <input id="cep" type="text" v-model="funcionario.cep" required placeholder="00000-000" />
          </div>
        </div>
      </section>
      
      <div class="form-group-full">
        <div>
            <label for="observacoesGerais">Observações</label>
            <textarea id="observacoesGerais" v-model="funcionario.observacoes"></textarea>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="funcionarioStore.isLoading">
          {{ funcionario.id ? 'Atualizar' : 'Salvar' }} Funcionário
        </button>
        <button type="button" @click="limpar" class="cancelar" :disabled="funcionarioStore.isLoading">
          Cancelar
        </button>
      </div>
    </form>
    
    <hr>
    
    <div v-if="funcionarioStore.isLoading" class="loading-message">
        Carregando funcionários...
    </div>

    <ul class="funcionario-list" v-else>
      <li v-for="f in funcionarioStore.funcionarios" :key="f.id" :class="{ 'funcionario-inativo': !f.ativo }">
        <span class="funcionario-info" @click="editar(f)">
          <span class="id-tag">#{{ f.id }}</span>
          <strong>{{ f.nome }}</strong> 
          <span class="cargo">{{ f.cargo_nome }}</span>
          <span class="email">{{ f.email }}</span>
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

/* Grid Básico para os campos (Ex: 4 a 5 colunas) */
.form-group-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

/* Grid específico para Endereço (ajustado para os 4 campos + CEP) */
.form-group-grid-address {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 80px 1fr; /* Endereço, Bairro, Cidade, Estado, CEP */
    gap: 15px;
    margin-bottom: 20px;
}

/* Ocupa a linha toda (usado para o campo Endereço) */
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
    padding-top: 25px; /* Alinha com os outros campos */
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

/* --- Lista e Itens (.funcionario-list) --- */
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

.funcionario-list { /* Estilo da lista principal */
  list-style: none;
  padding: 0;
  display: grid;
  gap: 10px;
}

.funcionario-list li {
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

.funcionario-list li:hover {
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.funcionario-list li.funcionario-inativo {
  border-left-color: var(--danger-color);
  opacity: 0.7;
}

.funcionario-info {
  flex-grow: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--secondary-color);
  gap: 15px;
}

.funcionario-info strong {
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

.cargo, .email { /* Estilos para o cargo e email na lista */
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