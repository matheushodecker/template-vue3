<script setup>
import { reactive, onMounted, ref } from 'vue'
import { useFornecedorStore } from '@/stores/fornecedorStore'
const fornecedorStore = useFornecedorStore()
const formAberto = ref(false)
const defaultFornecedor = {
  id: null, nome: '', razao_social: '', tipo_pessoa: 'J', cnpj_cpf: '',
  inscricao_estadual: '', endereco: '', bairro: '', cidade: '', estado: '',
  cep: '', telefone: '', celular: '', email: '', site: '', nome_contato: '',
  prazo_pagamento: 30, condicoes_pagamento: '', limite_credito: 0.00,
  ativo: true, observacoes: '',
}
const fornecedor = reactive({ ...defaultFornecedor })
onMounted(async () => { await fornecedorStore.getFornecedores() })
function limpar() {
  Object.assign(fornecedor, { ...defaultFornecedor })
  formAberto.value = false
}
function isFieldEmpty(value) {
    if (typeof value === 'string') return value.trim() === '';
    return value === null || value === undefined;
}
async function salvar() {
  if (isFieldEmpty(fornecedor.nome) || isFieldEmpty(fornecedor.cnpj_cpf)) {
    alert("O Nome Fantasia e o CNPJ/CPF são obrigatórios.")
    return
  }
   const dadosParaEnviar = { ...fornecedor };
   // Limpeza de CNPJ/CPF
   if (dadosParaEnviar.cnpj_cpf) {
     dadosParaEnviar.cnpj_cpf = dadosParaEnviar.cnpj_cpf.replace(/[^\d]/g, '');
   }
   // Tratamento de campos opcionais que devem ser null se vazios
   for (const key of ['razao_social', 'inscricao_estadual', 'endereco', 'bairro', 'cidade', 'estado', 'cep', 'telefone', 'celular', 'email', 'site', 'nome_contato', 'condicoes_pagamento', 'observacoes']) {
        if (isFieldEmpty(dadosParaEnviar[key])) {
            dadosParaEnviar[key] = null;
        }
    }
    // Garante que números sejam números
    dadosParaEnviar.prazo_pagamento = Number(dadosParaEnviar.prazo_pagamento || 0);
    dadosParaEnviar.limite_credito = Number(dadosParaEnviar.limite_credito || 0);

  await fornecedorStore.salvarFornecedor(dadosParaEnviar)
  limpar()
}
function editar(fornecedor_para_editar) {
  Object.assign(fornecedor, fornecedor_para_editar)
   formAberto.value = true // Adicionado para abrir o form ao editar
}
async function excluir(id) {
  if (confirm("Excluir este fornecedor?")) {
    await fornecedorStore.excluirFornecedor(id)
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
    <h1><span class="icon">🏢</span> Gerenciamento de Fornecedores</h1>

    <div class="crud-header">
       <button class="btn btn-primary" @click="toggleForm">
        {{ formAberto ? 'Fechar Formulário' : 'Novo Fornecedor' }}
      </button>
    </div>

    <div class="form-container" v-if="formAberto">
       <h2>{{ fornecedor.id ? 'Editar Fornecedor' : 'Novo Fornecedor' }}</h2>
       <form @submit.prevent="salvar">
          <section class="form-section">
            <h3>Dados Básicos</h3>
            <div class="form-grid grid-cols-3">
              <div class="form-group">
                <label for="nomeFantasia">Nome Fantasia*</label>
                <input id="nomeFantasia" type="text" v-model="fornecedor.nome" required placeholder="Nome comercial" />
              </div>
              <div class="form-group span-2">
                <label for="razaoSocial">Razão Social</label>
                <input id="razaoSocial" type="text" v-model="fornecedor.razao_social" placeholder="Nome legal/completo" />
              </div>
              <div class="form-group">
                <label for="tipoPessoa">Tipo Pessoa</label>
                <select id="tipoPessoa" v-model="fornecedor.tipo_pessoa">
                  <option value="J">Pessoa Jurídica</option>
                  <option value="F">Pessoa Física</option>
                </select>
              </div>
              <div class="form-group">
                <label for="cnpjCpf">CNPJ/CPF*</label>
                <input id="cnpjCpf" type="tel" v-model="fornecedor.cnpj_cpf" required placeholder="Apenas números" />
              </div>
              <div class="form-group">
                <label for="inscricaoEstadual">Inscrição Estadual</label>
                <input id="inscricaoEstadual" type="text" v-model="fornecedor.inscricao_estadual" placeholder="Opcional" />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3>Contato</h3>
             <div class="form-grid grid-cols-3">
                <div class="form-group">
                  <label for="telefone">Telefone</label>
                  <input id="telefone" type="tel" v-model="fornecedor.telefone" placeholder="(XX) XXXX-XXXX" />
                </div>
                <div class="form-group">
                  <label for="celular">Celular</label>
                  <input id="celular" type="tel" v-model="fornecedor.celular" placeholder="(XX) 9XXXX-XXXX" />
                </div>
                <div class="form-group">
                  <label for="email">Email</label>
                  <input id="email" type="email" v-model="fornecedor.email" placeholder="contato@empresa.com" />
                </div>
                 <div class="form-group">
                  <label for="site">Site</label>
                  <input id="site" type="url" v-model="fornecedor.site" placeholder="https://www.empresa.com" />
                </div>
                <div class="form-group span-2">
                  <label for="nomeContato">Nome do Contato</label>
                  <input id="nomeContato" type="text" v-model="fornecedor.nome_contato" placeholder="Pessoa de referência" />
                </div>
             </div>
          </section>

          <section class="form-section">
             <h3>Endereço</h3>
             <div class="form-grid grid-cols-4"> <div class="form-group span-4">
                  <label for="endereco">Endereço</label>
                  <input id="endereco" type="text" v-model="fornecedor.endereco" placeholder="Rua, Número, Complemento" />
                </div>
                 <div class="form-group span-2">
                  <label for="bairro">Bairro</label>
                  <input id="bairro" type="text" v-model="fornecedor.bairro" />
                </div>
                 <div class="form-group span-2">
                  <label for="cidade">Cidade</label>
                  <input id="cidade" type="text" v-model="fornecedor.cidade" />
                </div>
                <div class="form-group">
                  <label for="estado">Estado</label>
                  <input id="estado" type="text" v-model="fornecedor.estado" maxlength="2" placeholder="UF" />
                </div>
                <div class="form-group">
                  <label for="cep">CEP</label>
                  <input id="cep" type="text" v-model="fornecedor.cep" placeholder="00000-000" />
                </div>
             </div>
          </section>

          <section class="form-section">
            <h3>Dados Comerciais</h3>
            <div class="form-grid grid-cols-3">
               <div class="form-group">
                <label for="prazoPagamento">Prazo Pagamento (dias)</label>
                <input id="prazoPagamento" type="number" v-model.number="fornecedor.prazo_pagamento" placeholder="Ex: 30" min="0" />
              </div>
              <div class="form-group">
                <label for="limiteCredito">Limite Crédito</label>
                <input id="limiteCredito" type="number" step="0.01" v-model.number="fornecedor.limite_credito" placeholder="0,00" />
              </div>
               <div class="form-group checkbox-group align-end">
                <input id="ativo" type="checkbox" v-model="fornecedor.ativo" />
                <label for="ativo" class="inline-label">Ativo</label>
              </div>
               <div class="form-group span-3">
                  <label for="condicoesPagamento">Condições de Pagamento</label>
                  <textarea id="condicoesPagamento" v-model="fornecedor.condicoes_pagamento" rows="2" placeholder="Ex: Boleto 30/60/90"></textarea>
                </div>
                 <div class="form-group span-3">
                  <label for="observacoesGerais">Observações Gerais</label>
                  <textarea id="observacoesGerais" v-model="fornecedor.observacoes" rows="3"></textarea>
                </div>
            </div>
          </section>

          <div class="form-actions">
            <button type="button" @click="limpar" class="btn btn-light" :disabled="fornecedorStore.isLoading">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="fornecedorStore.isLoading">
              {{ fornecedor.id ? 'Atualizar Fornecedor' : 'Salvar Fornecedor' }}
            </button>
          </div>
       </form>
    </div>

    <hr class="divider" />

    <div v-if="fornecedorStore.isLoading" class="loading-message">
      Carregando fornecedores...
    </div>
     <div v-else-if="fornecedorStore.fornecedores.length === 0" class="empty-state">
      <p>Nenhum fornecedor encontrado.</p>
    </div>
    <ul class="crud-list" v-else>
       <li
        v-for="f in fornecedorStore.fornecedores"
        :key="f.id"
        class="list-item"
        :class="{ 'status-inactive': !f.ativo }"
        @click="editar(f)"
      >
        <div class="item-main-info">
          <span class="id-tag">#{{ f.id }}</span>
          <span class="item-name">{{ f.nome }}</span>
           <span class="item-status" v-if="!f.ativo">INATIVO</span>
        </div>

        <div class="item-details">
          <span class="detail-tag doc">{{ f.cnpj_cpf }}</span>
          <span class="detail-tag contact">{{ f.email || f.celular || f.telefone || 'Sem contato' }}</span>
        </div>

        <div class="item-actions">
           <button @click.stop="editar(f)" class="btn-action btn-edit" title="Editar">✏️</button>
           <button @click.stop="excluir(f.id)" class="btn-action btn-delete" title="Excluir">🗑️</button>
        </div>
      </li>
    </ul>

    <div class="paginator" v-if="!fornecedorStore.isLoading && fornecedorStore.meta.total_pages > 1">
       <button class="btn btn-light" :disabled="fornecedorStore.meta.page <= 1" @click="fornecedorStore.paginaAnterior">Anterior</button>
      <span>Página {{ fornecedorStore.meta.page }} de {{ fornecedorStore.meta.total_pages }}</span>
      <button class="btn btn-light" :disabled="fornecedorStore.meta.page >= fornecedorStore.meta.total_pages" @click="fornecedorStore.proximaPagina">Próxima</button>
    </div>

  </div>
</template>

<style scoped>
/* --- Container Principal --- */
.crud-container {
  max-width: 1200px; /* Ajustado para Fornecedor */
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
/* Estilos Específicos FornecedorView */
.detail-tag.doc { color: var(--color-secondary); background-color: #e5e7eb;}
.detail-tag.contact { color: var(--color-primary-dark); background-color: var(--color-primary-light);}


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
</style>