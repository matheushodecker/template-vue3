<template>
  <div class="container">
    <h1>Gerenciamento de Fornecedores</h1>

    <div class="form-toggle">
      <button @click="toggleForm" :class="{ 'cancelar': formAberto }">
        {{ formAberto ? 'Fechar Formulário' : 'Novo Fornecedor / Editar' }}
      </button>
    </div>

    <form class="form-container" @submit.prevent="salvar" v-if="formAberto">
      <h2>{{ fornecedor.id ? 'Editar Fornecedor' : 'Novo Fornecedor' }}</h2>

      <section>
        <h3>Dados Básicos</h3>
        <div class="form-group-grid">
          <div>
            <label for="nomeFantasia">Nome Fantasia*</label>
            <input id="nomeFantasia" type="text" v-model="fornecedor.nome" required
              placeholder="Nome comumente usado" />
          </div>
          <div>
            <label for="razaoSocial">Razão Social</label>
            <input id="razaoSocial" type="text" v-model="fornecedor.razao_social"
              placeholder="Nome legal/completo da empresa" />
          </div>
          <div>
            <label for="tipoPessoa">Tipo Pessoa</label>
            <select id="tipoPessoa" v-model="fornecedor.tipo_pessoa">
              <option value="J">Pessoa Jurídica</option>
              <option value="F">Pessoa Física</option>
            </select>
          </div>
          <div>
            <label for="cnpjCpf">CNPJ/CPF*</label>
            <input id="cnpjCpf" type="tel" v-model="fornecedor.cnpj_cpf" required
              placeholder="Apenas números (Ex: 00000000000000)" />
          </div>
          <div>
            <label for="inscricaoEstadual">Inscrição Estadual</label>
            <input id="inscricaoEstadual" type="text" v-model="fornecedor.inscricao_estadual"
              placeholder="Número da inscrição" />
          </div>
        </div>
      </section>

      <section>
        <h3>Contato</h3>
        <div class="form-group-grid">
          <div>
            <label for="telefone">Telefone</label>
            <input id="telefone" type="tel" v-model="fornecedor.telefone" placeholder="(XX) XXXX-XXXX" />
          </div>
          <div>
            <label for="celular">Celular</label>
            <input id="celular" type="tel" v-model="fornecedor.celular" placeholder="(XX) 9XXXX-XXXX" />
          </div>
          <div>
            <label for="email">Email</label>
            <input id="email" type="email" v-model="fornecedor.email" placeholder="exemplo@dominio.com" />
          </div>
          <div>
            <label for="site">Site</label>
            <input id="site" type="url" v-model="fornecedor.site" placeholder="Ex: https://www.empresa.com.br" />
          </div>
          <div>
            <label for="nomeContato">Nome do Contato</label>
            <input id="nomeContato" type="text" v-model="fornecedor.nome_contato"
              placeholder="Pessoa de contato na empresa" />
          </div>
        </div>
      </section>

      <section>
        <h3>Endereço</h3>
        <div class="form-group-grid-address">
          <div class="full-width">
            <label for="endereco">Endereço</label>
            <input id="endereco" type="text" v-model="fornecedor.endereco" placeholder="Rua, Número e Complemento" />
          </div>

          <div>
            <label for="bairro">Bairro</label>
            <input id="bairro" type="text" v-model="fornecedor.bairro" />
          </div>
          <div>
            <label for="cidade">Cidade</label>
            <input id="cidade" type="text" v-model="fornecedor.cidade" />
          </div>
          <div>
            <label for="estado">Estado</label>
            <input id="estado" type="text" v-model="fornecedor.estado" maxlength="2" placeholder="Ex: SP" />
          </div>
          <div>
            <label for="cep">CEP</label>
            <input id="cep" type="text" v-model="fornecedor.cep" placeholder="00000-000" />
          </div>
        </div>
      </section>

      <section>
        <h3>Dados Comerciais e Controle</h3>
        <div class="form-group-grid">
          <div>
            <label for="prazoPagamento">Prazo Pagamento (dias)</label>
            <input id="prazoPagamento" type="number" v-model.number="fornecedor.prazo_pagamento" placeholder="Ex: 30" />
          </div>

          <div>
            <label for="limiteCredito">Limite Crédito</label>
            <input id="limiteCredito" type="number" step="0.01" v-model.number="fornecedor.limite_credito"
              placeholder="Ex: 10000.00" />
          </div>

          <div class="checkbox-group">
            <input id="ativo" type="checkbox" v-model="fornecedor.ativo" />
            <label for="ativo" class="inline-label">Ativo</label>
          </div>
        </div>

        <div class="form-group-full">
          <div>
            <label for="condicoesPagamento">Condições de Pagamento</label>
            <textarea id="condicoesPagamento" v-model="fornecedor.condicoes_pagamento"
              placeholder="Ex: Boleto 30/60/90"></textarea>
          </div>
          <div>
            <label for="observacoesGerais">Observações Gerais</label>
            <textarea id="observacoesGerais" v-model="fornecedor.observacoes"></textarea>
          </div>
        </div>
      </section>

      <div class="form-actions">
        <button type="submit" :disabled="fornecedorStore.isLoading">
          {{ fornecedor.id ? 'Atualizar' : 'Salvar' }} Fornecedor
        </button>
        <button type="button" @click="limpar" class="cancelar" :disabled="fornecedorStore.isLoading">
          Cancelar
        </button>
      </div>
    </form>

    <hr>

    <div v-if="fornecedorStore.isLoading" class="loading-message">
      Carregando dados...
    </div>

    <ul class="fornecedor-list" v-else>
      <li v-for="f in fornecedorStore.fornecedores" :key="f.id" :class="{ 'fornecedor-inativo': !f.ativo }">
        <span class="fornecedor-info" @click="editar(f)">
          <span class="id-tag">#{{ f.id }}</span>
          <strong>{{ f.nome }}</strong>
          <span class="descricao">{{ f.cnpj_cpf }}</span>
          <span class="descricao">{{ f.email }}</span>
        </span>
        <div class="actions">
          <button @click="editar(f)" class="editar">Editar</button>
          <button @click="excluir(f.id)" class="excluir">Excluir</button>
        </div>
      </li>
    </ul>

    <div class="paginator" v-if="fornecedorStore.meta.total_pages > 1">
      <button :disabled="fornecedorStore.meta.page <= 1 || fornecedorStore.isLoading"
        @click="fornecedorStore.paginaAnterior">
        Anterior
      </button>
      <span>Página {{ fornecedorStore.meta.page }} de {{ fornecedorStore.meta.total_pages }}</span>
      <button :disabled="fornecedorStore.meta.page >= fornecedorStore.meta.total_pages || fornecedorStore.isLoading"
        @click="fornecedorStore.proximaPagina">
        Próxima
      </button>
    </div>
  </div>
</template>

<script setup>
// ... (script original sem alterações na lógica)
import { reactive, onMounted, ref } from 'vue'
import { useFornecedorStore } from '@/stores/fornecedorStore'

const fornecedorStore = useFornecedorStore()

const formAberto = ref(false) // Começa fechado por padrão (ou true, se preferir)

// --- ESTADO LOCAL PARA O FORMULÁRIO (DEFAULTS) ---
const defaultFornecedor = {
  id: null,
  nome: '',
  razao_social: '',
  tipo_pessoa: 'J',
  cnpj_cpf: '',
  inscricao_estadual: '',
  endereco: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  telefone: '',
  celular: '',
  email: '',
  site: '',
  nome_contato: '',
  prazo_pagamento: 30,
  condicoes_pagamento: '',
  limite_credito: 0.00,
  ativo: true,
  observacoes: '',
}
const fornecedor = reactive({ ...defaultFornecedor })

// 2. Ciclo de Vida: Carregar dados ao montar
onMounted(async () => {
  await fornecedorStore.getFornecedores()
})

// 3. Funções de Ação
function limpar() {
  Object.assign(fornecedor, { ...defaultFornecedor })
  formAberto.value = false // Fecha o formulário após limpar/cancelar
}

async function salvar() {
  if (!fornecedor.nome.trim() || !fornecedor.cnpj_cpf.trim()) {
    alert("O Nome e o CNPJ/CPF são campos obrigatórios.")
    return
  }

  // ATENÇÃO: É VITAL que a limpeza do CNPJ/CPF seja feita AQUI (no Vue)
  // ou no Serializer do Django. Se for feita aqui:
  /*
  const dadosParaEnviar = { ...fornecedor };
  if (dadosParaEnviar.cnpj_cpf) {
      dadosParaEnviar.cnpj_cpf = dadosParaEnviar.cnpj_cpf.replace(/[^\d]/g, ''); 
  }
  await fornecedorStore.salvarFornecedor(dadosParaEnviar);
  */

  // Se a limpeza estiver no Serializer (Opção 2):
  await fornecedorStore.salvarFornecedor({ ...fornecedor })
  limpar()
}

function editar(fornecedor_para_editar) {
  Object.assign(fornecedor, fornecedor_para_editar)
}

async function excluir(id) {
  if (confirm("Tem certeza que deseja excluir este fornecedor?")) {
    await fornecedorStore.excluirFornecedor(id)
    limpar()
  }
}

function toggleForm() {
  // Se o formulário for fechado manualmente, limpa o estado
  if (formAberto.value) {
    limpar(); // Isso também define formAberto.value = false
  } else {
    formAberto.value = true;
  }
}
</script>
<style scoped>
/* Variáveis para fácil manutenção de cores */
:root {
  --primary-color: #41b883;
  /* Vue Green */
  --secondary-color: #34495e;
  /* Dark Blue/Gray */
  --accent-color: #3498db;
  /* Blue for Edit */
  --danger-color: #e74c3c;
  /* Red for Delete */
  --light-bg: #f7f9fb;
  --white: #ffffff;
  --border-color: #e0e0e0;
}

/* --- NOVO: Estilo para o Botão Toggle --- */
.form-toggle {
  margin-bottom: 25px;
  text-align: right;
}

.form-toggle button {
  /* Reutiliza o estilo do botão primário */
  text-transform: none;
}

/* --- Formulário (Formulário agora está dentro de uma div, mas o CSS ainda se aplica) --- */
.form-container {
  padding: 25px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  margin-bottom: 30px;
  background-color: var(--light-bg);
}

/* ---------------------------------------------------- */
/* --- ESTILOS DE LAYOUT DO FORMULÁRIO (Adições) --- */
/* ---------------------------------------------------- */

.form-group-grid {
  /* Cria um grid responsivo de no mínimo 200px por coluna */
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.form-group-grid-address {
  /* Layout fixo para endereço: largo, 3 médios, 1 pequeno */
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 80px 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

/* Ocupa a linha toda (usado para Endereço) */
.form-group-grid-address .full-width,
.form-group-full>div {
  grid-column: 1 / -1;
}

.form-group-full {
  display: flex;
  gap: 15px;
  margin-top: 15px;
}

.form-group-full>div {
  flex: 1;
}

label {
  display: block;
  /* Garante que a label ocupe sua própria linha */
  font-weight: 600;
  color: var(--secondary-color);
  font-size: 0.95rem;
  margin-bottom: 5px;
  /* Espaço entre label e input */
}

/* Estilo para label e input/select/textarea */
input,
select,
textarea {
  width: 100%;
  box-sizing: border-box;
  /* Garante que o padding não aumente a largura */
  margin-top: 0;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 25px;
  /* Alinha com os outros campos */
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

/* Estilos de campo de entrada - reutilizados do original */
input[type='text'],
input[type='tel'],
input[type='email'],
input[type='url'],
input[type='number'],
select,
textarea {
  padding: 10px 14px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
  background-color: var(--white);
  /* Corrigido o `margin-top: 5px;` da versão anterior */
}

input[type='text']:focus,
input[type='tel']:focus,
input[type='email']:focus,
input[type='url']:focus,
input[type='number']:focus,
select:focus,
textarea:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(65, 184, 131, 0.2);
}

h3 {
  /* Adicionado para estilos das seções */
  font-size: 1.3rem;
  color: var(--secondary-color);
  margin-top: 25px;
  margin-bottom: 15px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 5px;
}

/* ---------------------------------------------------- */
/* --- ESTILOS RESTANTES (Ações, Lista, Paginação) --- */
/* ---------------------------------------------------- */

.container {
  max-width: 1000px;
  margin: 40px auto;
  padding: 40px;
  background-color: var(--white);
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

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

.form-container {
  padding: 25px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  margin-bottom: 30px;
  background-color: var(--light-bg);
}

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

.loading-message {
  text-align: center;
  color: var(--primary-color);
  font-size: 1.2rem;
  font-weight: 600;
  margin: 30px 0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.8;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.8;
  }
}

.fornecedor-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 10px;
}

.fornecedor-list li {
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

.fornecedor-list li:hover {
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.fornecedor-list li.fornecedor-inativo {
  border-left-color: var(--danger-color);
  opacity: 0.7;
}

.fornecedor-info {
  flex-grow: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--secondary-color);
  gap: 15px;
}

.fornecedor-info strong {
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

.descricao {
  font-size: 1rem;
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 400px;
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