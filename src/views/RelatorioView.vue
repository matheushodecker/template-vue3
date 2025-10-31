<script setup>
import { reactive, onMounted, ref } from 'vue'
import { useRelatorioStore } from '@/stores/relatorioStore'
const relatorioStore = useRelatorioStore()
const abaAtiva = ref('vendas')
const formAberto = ref(false)
const defaultRelatorioVenda = {
  nome: '', data_inicio: null, data_fim: null,
  funcionario_gerador: null, observacoes: null,
}
const relatorioVenda = reactive({ ...defaultRelatorioVenda })
const defaultRelatorioEstoque = {
  nome: '', funcionario_gerador: null, observacoes: null,
}
const relatorioEstoque = reactive({ ...defaultRelatorioEstoque })

onMounted(async () => {
  await Promise.all([
    relatorioStore.loadDependencies(),
    relatorioStore.getRelatoriosVenda(),
    relatorioStore.getRelatoriosEstoque(),
  ]);
})
function mudarAba(aba) {
  abaAtiva.value = aba;
  formAberto.value = false;
  limpar();
}
function limpar() {
  Object.assign(relatorioVenda, { ...defaultRelatorioVenda })
  Object.assign(relatorioEstoque, { ...defaultRelatorioEstoque })
  formAberto.value = false
}
function isFieldEmpty(value) {
  if (typeof value === 'string') return value.trim() === '';
  return value === null || value === undefined;
}
async function gerarRelatorio() {
  let dados;
  try {
    if (abaAtiva.value === 'vendas') {
      if (isFieldEmpty(relatorioVenda.nome) || !relatorioVenda.data_inicio || !relatorioVenda.data_fim || !relatorioVenda.funcionario_gerador) {
        alert("Nome, Datas (Início e Fim) e Funcionário são obrigatórios.")
        return
      }
      dados = { ...relatorioVenda };
      dados.observacoes = isFieldEmpty(dados.observacoes) ? null : dados.observacoes;
      await relatorioStore.gerarRelatorioVenda(dados);

    } else if (abaAtiva.value === 'estoque') {
      if (isFieldEmpty(relatorioEstoque.nome) || !relatorioEstoque.funcionario_gerador) {
        alert("Nome e Funcionário são obrigatórios.")
        return
      }
      dados = { ...relatorioEstoque };
      dados.observacoes = isFieldEmpty(dados.observacoes) ? null : dados.observacoes;
      await relatorioStore.gerarRelatorioEstoque(dados);
    }
    alert("Relatório gerado com sucesso!");
    limpar();
  } catch (error) {
     alert("Erro ao gerar relatório. Verifique os dados e tente novamente.");
  }
}
function toggleForm() {
  if (formAberto.value) { limpar(); }
  else { formAberto.value = true; }
}
function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatDate(isoString) {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'Data inválida';
        // Formata para dd/mm/aaaa
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (e) {
        return 'Data inválida';
    }
}
// Formata Data/Hora para a lista de relatórios gerados
function formatDateTime(isoString) {
    if (!isoString) return 'N/A';
     try {
        const date = new Date(isoString);
         if (isNaN(date.getTime())) return 'Data inválida';
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
  <div class="crud-container relatorio-view">
    <h1><span class="icon">📈</span> Gerenciamento de Relatórios</h1>

    <div class="tabs-navigation">
      <button 
        :class="{ 'active': abaAtiva === 'vendas' }" 
        @click="mudarAba('vendas')"
        class="tab-btn"
      >
        Relatórios de Vendas
      </button>
      <button 
        :class="{ 'active': abaAtiva === 'estoque' }" 
        @click="mudarAba('estoque')"
        class="tab-btn"
      >
        Relatórios de Estoque
      </button>
    </div>

    <div class="crud-header">
       <button class="btn btn-primary" @click="toggleForm">
        {{ formAberto ? 'Cancelar Geração' : 'Gerar Novo Relatório' }}
      </button>
    </div>

    <div class="form-container" v-if="formAberto">
      <h2>Gerar Relatório de {{ abaAtiva === 'vendas' ? 'Vendas' : 'Estoque' }}</h2>
      <form @submit.prevent="gerarRelatorio">
        
        <div v-if="abaAtiva === 'vendas'">
          <section class="form-section">
            <div class="form-grid grid-cols-3">
              <div class="form-group span-3">
                <label for="nomeVenda">Nome do Relatório*</label>
                <input id="nomeVenda" type="text" v-model="relatorioVenda.nome" required placeholder="Ex: Vendas 3º Trimestre" />
              </div>
              <div class="form-group">
                <label for="dataInicio">Data de Início*</label>
                <input id="dataInicio" type="date" v-model="relatorioVenda.data_inicio" required />
              </div>
              <div class="form-group">
                <label for="dataFim">Data de Fim*</label>
                <input id="dataFim" type="date" v-model="relatorioVenda.data_fim" required />
              </div>
               <div class="form-group">
                <label for="funcionarioGeradorVenda">Funcionário Gerador*</label>
                <select id="funcionarioGeradorVenda" v-model="relatorioVenda.funcionario_gerador" required>
                  <option :value="null" disabled>Selecione</option>
                  <option v-for="f in relatorioStore.funcionariosDisponiveis" :key="f.id" :value="f.id">
                    {{ f.nome }}
                  </option>
                </select>
              </div>
              <div class="form-group span-3">
                <label for="observacoesVenda">Observações</label>
                <textarea id="observacoesVenda" v-model="relatorioVenda.observacoes" rows="2"></textarea>
              </div>
            </div>
          </section>
        </div>

        <div v-else-if="abaAtiva === 'estoque'">
           <section class="form-section">
            <div class="form-grid grid-cols-2">
              <div class="form-group">
                <label for="nomeEstoque">Nome do Relatório*</label>
                <input id="nomeEstoque" type="text" v-model="relatorioEstoque.nome" required placeholder="Ex: Inventário Mensal" />
              </div>
              <div class="form-group">
                <label for="funcionarioGeradorEstoque">Funcionário Gerador*</label>
                <select id="funcionarioGeradorEstoque" v-model="relatorioEstoque.funcionario_gerador" required>
                  <option :value="null" disabled>Selecione</option>
                  <option v-for="f in relatorioStore.funcionariosDisponiveis" :key="f.id" :value="f.id">
                    {{ f.nome }}
                  </option>
                </select>
              </div>
               <div class="form-group span-2">
                <label for="observacoesEstoque">Observações</label>
                <textarea id="observacoesEstoque" v-model="relatorioEstoque.observacoes" rows="3"></textarea>
              </div>
            </div>
           </section>
        </div>

        <div class="form-actions">
          <button type="button" @click="limpar" class="btn btn-light" :disabled="relatorioStore.isLoading">
            Limpar
          </button>
           <button type="submit" class="btn btn-primary" :disabled="relatorioStore.isLoading">
            Gerar e Salvar Relatório
          </button>
        </div>
      </form>
    </div>

    <hr class="divider" />

    <div v-if="abaAtiva === 'vendas' && relatorioStore.erroVenda" class="error-message">
      {{ relatorioStore.erroVenda }}
    </div>

    <div v-if="relatorioStore.isLoading" class="loading-message">
      Carregando histórico de relatórios...
    </div>

    <div v-else-if="abaAtiva === 'vendas'">
       <div v-if="relatorioStore.relatoriosVenda.length === 0" class="empty-state">
        <p>Nenhum relatório de vendas gerado.</p>
      </div>
      <ul class="crud-list" v-else>
        <li
          v-for="r in relatorioStore.relatoriosVenda"
          :key="r.id"
          class="list-item relatorio-venda"
        >
          <div class="item-main-info">
            <span class="id-tag">#{{ r.id }}</span>
            <span class="item-name">{{ r.nome }}</span>
          </div>

          <div class="item-details">
            <span class="detail-tag date">Período: {{ formatDate(r.data_inicio) }} a {{ formatDate(r.data_fim) }}</span>
            <span class="detail-tag ticket">Ticket Médio: {{ formatCurrency(r.ticket_medio) }}</span>
            <span class="detail-tag total">{{ formatCurrency(r.total_vendas) }}</span>
          </div>
          
           <div class="item-footer">
             Gerado por {{ r.funcionario_gerador_nome }} em {{ formatDateTime(r.data_geracao) }}
           </div>
        </li>
      </ul>
    </div>

    <div v-else-if="abaAtiva === 'estoque'">
       <div v-if="relatorioStore.relatoriosEstoque.length === 0" class="empty-state">
        <p>Nenhum relatório de estoque gerado.</p>
      </div>
      <ul class="crud-list" v-else>
        <li
          v-for="r in relatorioStore.relatoriosEstoque"
          :key="r.id"
          class="list-item relatorio-estoque"
        >
          <div class="item-main-info">
            <span class="id-tag">#{{ r.id }}</span>
            <span class="item-name">{{ r.nome }}</span>
          </div>

          <div class="item-details">
             <span class="detail-tag total-items">Total Itens: {{ r.total_produtos }}</span>
             <span 
                class="detail-tag low-stock"
                :class="{ 'has-low-stock': r.produtos_estoque_baixo > 0 }"
             >
               Baixo Estoque: {{ r.produtos_estoque_baixo }}
             </span>
             <span class="detail-tag total-value">Valor Estoque: {{ formatCurrency(r.valor_total_estoque) }}</span>
          </div>
           <div class="item-footer">
             Gerado por {{ r.funcionario_gerador_nome }} em {{ formatDateTime(r.data_geracao) }}
           </div>
        </li>
      </ul>
    </div>

  </div>
</template>

<style scoped>
/* --- Container Principal --- */
.crud-container {
  max-width: 1000px;
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

/* --- Navegação por Abas --- */
.tabs-navigation {
  display: flex;
  justify-content: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}
.tab-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-bottom: 3px solid transparent;
  background-color: transparent;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-md);
  cursor: pointer;
  transition: all var(--transition-base);
}
.tab-btn:hover {
  background-color: var(--color-background);
  color: var(--color-text-primary);
}
.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}


/* --- Cabeçalho (Botão Novo) --- */
.crud-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: var(--spacing-lg);
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
/* Remove h3 (opcional, mas limpa o form de geração) */
/*
.form-section h3 {
  font-size: var(--font-size-lg); ...
}
*/

.form-grid {
  display: grid;
  gap: var(--spacing-md);
}
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }

.form-group.span-2 { grid-column: span 2; }
.form-group.span-3 { grid-column: span 3; }

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

/* --- Lista de Itens (Relatórios) --- */
.crud-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: var(--spacing-md);
}
.list-item {
  display: grid;
  /* Grid para Info | Detalhes (quebra linha) | Footer */
  grid-template-columns: 1fr; 
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-left-width: 6px;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  cursor: default; /* Não são editáveis */
}
.list-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* Status de Cor da Borda */
.list-item.relatorio-venda { border-left-color: var(--color-primary); }
.list-item.relatorio-estoque { border-left-color: var(--color-accent); }

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

.item-details {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap; /* Permite quebrar linha */
  margin-top: var(--spacing-sm);
}
.detail-tag {
  background-color: var(--color-background);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
}
/* Estilos Específicos RelatorioView */
.detail-tag.date { color: var(--color-accent-dark); background-color: #eff6ff;}
.detail-tag.ticket { color: var(--color-secondary); background-color: #e5e7eb;}
.detail-tag.total {
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
    background-color: var(--color-primary-light);
}
/* Estoque */
.detail-tag.total-items { color: var(--color-secondary); background-color: #e5e7eb;}
.detail-tag.total-value { color: var(--color-success); font-weight: var(--font-weight-semibold); background-color: var(--color-primary-light); }
.detail-tag.low-stock { color: var(--color-text-secondary); }
.detail-tag.low-stock.has-low-stock {
    color: #b45309;
    background-color: #fffbeb;
    font-weight: var(--font-weight-semibold);
}


/* Footer do Item */
.item-footer {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    font-style: italic;
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-sm);
    border-top: 1px dashed var(--color-border-light);
}

/* --- Responsividade --- */
@media (max-width: 900px) {
  .grid-cols-3 { grid-template-columns: repeat(2, 1fr); }
  .form-group.span-3 { grid-column: span 2; }
}

@media (max-width: 600px) {
  .grid-cols-2, .grid-cols-3 { 
    grid-template-columns: 1fr; /* Coluna única */
  }
  .form-group.span-2, .form-group.span-3 {
    grid-column: span 1;
  }
  .tabs-navigation {
      flex-wrap: wrap; /* Permite quebrar linha */
  }
  .tab-btn {
      flex-grow: 1;
      text-align: center;
  }
}
</style>