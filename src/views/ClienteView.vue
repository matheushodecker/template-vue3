<script setup>
import { reactive, onMounted, ref } from 'vue'
import { useClienteStore } from '@/stores/clienteStore'
const clienteStore = useClienteStore()
const formAberto = ref(false)
const defaultCliente = {
  id: null, nome: '', tipo_pessoa: 'F', cpf_cnpj: '', rg_ie: null,
  endereco: null, bairro: null, cidade: null, estado: null, cep: null,
  telefone: null, celular: null, email: '', data_nascimento: null,
  limite_credito: 0.00, ativo: true, observacoes: null,
}
const cliente = reactive({ ...defaultCliente })
onMounted(async () => { await clienteStore.getClientes() })
function isFieldEmpty(value) {
  if (typeof value === 'string') return value.trim() === '';
  return value === null || value === undefined;
}
function limpar() {
  Object.assign(cliente, { ...defaultCliente })
  formAberto.value = false
}
async function salvar() {
  if (isFieldEmpty(cliente.nome) || isFieldEmpty(cliente.cpf_cnpj) || isFieldEmpty(cliente.email)) {
    alert("Nome, CPF/CNPJ e Email são campos obrigatórios.")
    return
  }
  const dadosParaEnviar = { ...cliente };
  if (dadosParaEnviar.cpf_cnpj) {
    dadosParaEnviar.cpf_cnpj = dadosParaEnviar.cpf_cnpj.replace(/[^\d]/g, '');
  }
  if (isFieldEmpty(dadosParaEnviar.data_nascimento)) { dadosParaEnviar.data_nascimento = null; }
  for (const key of ['rg_ie', 'endereco', 'bairro', 'cidade', 'estado', 'cep', 'telefone', 'celular', 'observacoes']) {
    if (isFieldEmpty(dadosParaEnviar[key])) { dadosParaEnviar[key] = null; }
  }
  await clienteStore.salvarCliente(dadosParaEnviar)
  limpar()
}
function editar(cliente_para_editar) {
  const dataNascimentoFormatada = cliente_para_editar.data_nascimento ? cliente_para_editar.data_nascimento.substring(0, 10) : null;
  Object.assign(cliente, {
    ...cliente_para_editar,
    data_nascimento: dataNascimentoFormatada,
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
  if (formAberto.value) { limpar(); }
  else { formAberto.value = true; }
}
function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
</script>

<template>
  <div class="crud-container">
    <h1><span class="icon">👥</span> Gerenciamento de Clientes</h1>

    <div class="crud-header">
       <button class="btn btn-primary" @click="toggleForm">
        {{ formAberto ? 'Fechar Formulário' : 'Novo Cliente' }}
      </button>
    </div>

    <div class="form-container" v-if="formAberto">
      <h2>{{ cliente.id ? 'Editar Cliente' : 'Novo Cliente' }}</h2>
      <form @submit.prevent="salvar">

        <section class="form-section">
          <h3>Dados Básicos</h3>
          <div class="form-grid grid-cols-4">
             <div class="form-group span-2">
              <label for="nome">Nome/Razão Social*</label>
              <input id="nome" type="text" v-model="cliente.nome" required placeholder="Nome do Cliente" />
            </div>
             <div class="form-group">
              <label for="tipoPessoa">Tipo Pessoa</label>
              <select id="tipoPessoa" v-model="cliente.tipo_pessoa">
                <option value="F">Pessoa Física</option>
                <option value="J">Pessoa Jurídica</option>
              </select>
            </div>
            <div class="form-group">
              <label for="cpfCnpj">CPF/CNPJ*</label>
              <input id="cpfCnpj" type="tel" v-model="cliente.cpf_cnpj" required placeholder="Apenas números" />
            </div>
             <div class="form-group span-2">
              <label for="rgIe">RG/Inscrição Estadual</label>
              <input id="rgIe" type="text" v-model="cliente.rg_ie" placeholder="Opcional" />
            </div>
             <div class="form-group">
              <label for="dataNascimento">Nascimento</label>
              <input id="dataNascimento" type="date" v-model="cliente.data_nascimento" />
            </div>
            <div class="form-group checkbox-group align-end">
              <input id="ativo" type="checkbox" v-model="cliente.ativo" />
              <label for="ativo" class="inline-label">Cliente Ativo</label>
            </div>
          </div>
        </section>

        <section class="form-section">
          <h3>Contato e Crédito</h3>
          <div class="form-grid grid-cols-3">
            <div class="form-group">
              <label for="email">Email*</label>
              <input id="email" type="email" v-model="cliente.email" required placeholder="email@dominio.com" />
            </div>
            <div class="form-group">
              <label for="celular">Celular</label>
              <input id="celular" type="tel" v-model="cliente.celular" placeholder="(XX) 9XXXX-XXXX" />
            </div>
            <div class="form-group">
              <label for="telefone">Telefone</label>
              <input id="telefone" type="tel" v-model="cliente.telefone" placeholder="(XX) XXXX-XXXX" />
            </div>
            <div class="form-group">
              <label for="limiteCredito">Limite de Crédito</label>
              <input id="limiteCredito" type="number" step="0.01" v-model.number="cliente.limite_credito" placeholder="0,00" />
            </div>
          </div>
        </section>

        <section class="form-section">
          <h3>Endereço (Opcional)</h3>
          <div class="form-grid grid-cols-4"> <div class="form-group span-4">
              <label for="endereco">Endereço</label>
              <input id="endereco" type="text" v-model="cliente.endereco" placeholder="Rua, Número e Complemento" />
            </div>
             <div class="form-group span-2">
              <label for="bairro">Bairro</label>
              <input id="bairro" type="text" v-model="cliente.bairro" />
            </div>
             <div class="form-group span-2">
              <label for="cidade">Cidade</label>
              <input id="cidade" type="text" v-model="cliente.cidade" />
            </div>
            <div class="form-group">
              <label for="estado">Estado</label>
              <input id="estado" type="text" v-model="cliente.estado" maxlength="2" placeholder="UF" />
            </div>
            <div class="form-group">
              <label for="cep">CEP</label>
              <input id="cep" type="text" v-model="cliente.cep" placeholder="00000-000" />
            </div>
          </div>
        </section>

         <section class="form-section">
           <h3>Observações</h3>
           <div class="form-group">
              <label for="observacoesGerais">Observações Gerais</label>
              <textarea id="observacoesGerais" v-model="cliente.observacoes" rows="3"></textarea>
            </div>
        </section>

        <div class="form-actions">
           <button type="button" @click="limpar" class="btn btn-light" :disabled="clienteStore.isLoading">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="clienteStore.isLoading">
            {{ cliente.id ? 'Atualizar Cliente' : 'Salvar Cliente' }}
          </button>
        </div>
      </form>
    </div>

    <hr class="divider" />

    <div v-if="clienteStore.isLoading" class="loading-message">
      Carregando clientes...
    </div>
     <div v-else-if="clienteStore.clientes.length === 0" class="empty-state">
      <p>Nenhum cliente encontrado.</p>
    </div>
    <ul class="crud-list" v-else>
      <li
        v-for="c in clienteStore.clientes"
        :key="c.id"
        class="list-item"
        :class="{ 'status-inactive': !c.ativo }"
        @click="editar(c)"
      >
        <div class="item-main-info">
          <span class="id-tag">#{{ c.id }}</span>
          <span class="item-name">{{ c.nome }}</span>
           <span class="item-status" v-if="!c.ativo">INATIVO</span>
        </div>

        <div class="item-details">
          <span class="detail-tag doc">{{ c.cpf_cnpj }}</span>
          <span class="detail-tag email">{{ c.email }}</span>
          <span class="detail-tag phone">{{ c.celular || c.telefone || 'Sem contato' }}</span>
        </div>

        <div class="item-actions">
           <button @click.stop="editar(c)" class="btn-action btn-edit" title="Editar">✏️</button>
           <button @click.stop="excluir(c.id)" class="btn-action btn-delete" title="Excluir">🗑️</button>
        </div>
      </li>
    </ul>

    <div class="paginator" v-if="!clienteStore.isLoading && clienteStore.meta.total_pages > 1">
       <button class="btn btn-light" :disabled="clienteStore.meta.page <= 1" @click="clienteStore.paginaAnterior">Anterior</button>
      <span>Página {{ clienteStore.meta.page }} de {{ clienteStore.meta.total_pages }}</span>
      <button class="btn btn-light" :disabled="clienteStore.meta.page >= clienteStore.meta.total_pages" @click="clienteStore.proximaPagina">Próxima</button>
    </div>

  </div>
</template>

<style scoped>
/* --- Container Principal --- */
.crud-container {
  max-width: 1200px; /* Ajustado para Cliente */
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

.form-grid {
  display: grid;
  gap: var(--spacing-md);
}
.grid-cols-1 { grid-template-columns: 1fr; }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

.form-group.span-2 { grid-column: span 2; }
.form-group.span-3 { grid-column: span 3; }
.form-group.span-4 { grid-column: span 4; }

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
  border-left-color: var(--color-accent); /* Padrão (Ativo) */
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
/* Estilos específicos ClienteView */
.detail-tag.doc { color: var(--color-secondary); background-color: #e5e7eb;}
.detail-tag.email { color: var(--color-accent-dark); background-color: #eff6ff;}
.detail-tag.phone { color: var(--color-primary-dark); background-color: var(--color-primary-light);}

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

/* --- Responsividade do CRUD --- */
@media (max-width: 900px) {
  /* Ajusta grid do formulário */
  .grid-cols-3 { grid-template-columns: repeat(2, 1fr); }
  .grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
  .form-group.span-3, .form-group.span-4 { grid-column: span 2; }
  
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