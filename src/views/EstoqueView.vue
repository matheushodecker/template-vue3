<script setup>
import { reactive, onMounted, ref, computed } from 'vue'
import { useEstoqueStore } from '@/stores/estoqueStore'
const estoqueStore = useEstoqueStore()
const modalMovimentacaoAberto = ref(false)
const estoqueEmEdicao = ref(null) // Para ajuste de limites/localização
const TIPO_MOVIMENTACAO_OPTIONS = [
  { value: 'E', label: 'Entrada (Recebimento)' },
  { value: 'S', label: 'Saída (Perda/Devolução)' },
  { value: 'A', label: 'Ajuste (Inventário)' },
];
const defaultMovimentacao = {
  produto: null, tipo_movimentacao: 'E', quantidade: 1,
  funcionario: null, motivo: '', observacoes: null,
}
const movimentacao = reactive({ ...defaultMovimentacao })
const limitesAjuste = reactive({
  id: null, quantidade_minima: 5, quantidade_maxima: 1000, localizacao: '',
})
// Não precisa mais do computed `produtosSemEstoque`, o modal sempre terá um produto definido
const quantidadeAtualSelecionada = computed(() => {
    // Acessa via `estoqueEmEdicao` que é definido ao abrir o modal
    return estoqueEmEdicao.value?.quantidade_atual ?? 0;
});
onMounted(async () => {
  await Promise.all([
    estoqueStore.getEstoques(),
    estoqueStore.loadDependencies()
  ]);
})
function limparFormularioMovimentacao() {
  Object.assign(movimentacao, { ...defaultMovimentacao });
  // Não reseta estoqueEmEdicao aqui, pois ele controla qual produto está sendo movido
  modalMovimentacaoAberto.value = false;
}
function limparFormularioLimites() {
  Object.assign(limitesAjuste, { id: null, quantidade_minima: 5, quantidade_maxima: 1000, localizacao: '' });
  estoqueEmEdicao.value = null; // Fecha o form inline
}
function prepararAjusteLimites(estoque) {
    // Se clicar no mesmo item, fecha o form. Se for diferente, abre/atualiza.
    if (estoqueEmEdicao.value && estoqueEmEdicao.value.id === estoque.id) {
        limparFormularioLimites();
    } else {
        Object.assign(limitesAjuste, {
            id: estoque.id,
            quantidade_minima: estoque.quantidade_minima,
            quantidade_maxima: estoque.quantidade_maxima,
            localizacao: estoque.localizacao || '', // Garante string vazia se for null
        });
        estoqueEmEdicao.value = estoque;
    }
}
async function salvarLimites() {
  if (limitesAjuste.quantidade_minima === null || limitesAjuste.quantidade_maxima === null || limitesAjuste.quantidade_minima < 0) {
      alert("Quantidades mínima e máxima são obrigatórias e não podem ser negativas.");
      return;
  }
  if (limitesAjuste.quantidade_minima >= limitesAjuste.quantidade_maxima) {
    alert("A Quantidade Mínima deve ser menor que a Máxima.");
    return;
  }
  const dados = {
      id: limitesAjuste.id,
      quantidade_minima: limitesAjuste.quantidade_minima,
      quantidade_maxima: limitesAjuste.quantidade_maxima,
      // Envia null se localização estiver vazia
      localizacao: isFieldEmpty(limitesAjuste.localizacao) ? null : limitesAjuste.localizacao
  };
  await estoqueStore.atualizarLimites(dados);
  limparFormularioLimites(); // Fecha o form após salvar
}
function prepararMovimentacao(estoque) {
  estoqueEmEdicao.value = estoque; // Guarda qual estoque está sendo movido
  movimentacao.produto = estoque.produto; // Pré-seleciona o produto no modal
  movimentacao.quantidade = 1; // Reseta quantidade
  movimentacao.tipo_movimentacao = 'E'; // Reseta tipo
  movimentacao.funcionario = null; // Limpa funcionário
  movimentacao.motivo = ''; // Limpa motivo
  movimentacao.observacoes = null; // Limpa observações
  modalMovimentacaoAberto.value = true;
}
async function registrar() {
  if (!movimentacao.produto || !movimentacao.funcionario || isFieldEmpty(movimentacao.motivo) || movimentacao.quantidade === null || movimentacao.quantidade <= 0) {
    alert("Produto, Funcionário, Motivo e Quantidade (positiva) são obrigatórios.");
    return;
  }
  const dadosParaEnviar = {
    ...movimentacao,
    produto: movimentacao.produto, // ID do produto
    observacoes: isFieldEmpty(movimentacao.observacoes) ? null : movimentacao.observacoes,
  };
  try {
    await estoqueStore.registrarMovimentacao(dadosParaEnviar);
    limparFormularioMovimentacao(); // Fecha o modal
    // Recarrega a lista para mostrar a quantidade atualizada
    await estoqueStore.getEstoques();
    alert("Movimentação registrada com sucesso!");
  } catch (e) {
    console.error("Erro ao registrar movimentação:", e);
    // Tenta extrair a mensagem de erro da resposta da API, se disponível
    const errorMessage = e.response?.data?.detail || e.message || "Erro desconhecido.";
    alert(`Erro ao registrar: ${errorMessage}`);
  }
}
function isFieldEmpty(value) {
  if (typeof value === 'string') return value.trim() === '';
  return value === null || value === undefined;
}
</script>

<template>
  <div class="crud-container estoque-view">
    <h1><span class="icon">📦</span> Controle de Estoque</h1>

    <div class="crud-header">
       <button class="btn btn-primary" @click="modalMovimentacaoAberto = true" disabled>
         Registrar Nova Entrada/Saída
      </button>
    </div>

     <div class="ajuste-limites-form form-container" v-if="estoqueEmEdicao">
       <h2>Ajustar Limites e Localização ({{ estoqueEmEdicao.produto_nome }})</h2>
       <form @submit.prevent="salvarLimites">
         <div class="form-grid grid-cols-4 align-items-end">
             <div class="form-group">
                <label :for="'minima-' + estoqueEmEdicao.id">Mínima*</label>
                <input :id="'minima-' + estoqueEmEdicao.id" type="number" v-model.number="limitesAjuste.quantidade_minima" required min="0" />
              </div>
              <div class="form-group">
                <label :for="'maxima-' + estoqueEmEdicao.id">Máxima*</label>
                <input :id="'maxima-' + estoqueEmEdicao.id" type="number" v-model.number="limitesAjuste.quantidade_maxima" required min="1" />
              </div>
              <div class="form-group span-2">
                <label :for="'localizacao-' + estoqueEmEdicao.id">Localização</label>
                <input :id="'localizacao-' + estoqueEmEdicao.id" type="text" v-model="limitesAjuste.localizacao" placeholder="Ex: Corredor A, Prateleira 3" />
              </div>
         </div>
          <div class="form-actions inline-actions">
            <button type="button" @click="limparFormularioLimites" class="btn btn-light">Cancelar</button>
            <button type="submit" class="btn btn-accent">Salvar Ajustes</button>
          </div>
       </form>
     </div>


    <hr class="divider" />

    <div v-if="estoqueStore.isLoading" class="loading-message">
      Carregando estoque...
    </div>
     <div v-else-if="estoqueStore.estoques.length === 0" class="empty-state">
      <p>Nenhum item no estoque encontrado.</p>
    </div>
    <ul class="crud-list" v-else>
      <li
        v-for="e in estoqueStore.estoques"
        :key="e.id"
        class="list-item list-item-estoque"
        :class="{
          'status-warning': e.estoque_baixo,
          'status-inactive': !e.ativo, /* Se houver campo ativo no futuro */
          'editing-limits': estoqueEmEdicao && estoqueEmEdicao.id === e.id /* Destaca item sendo editado */
        }"
         @click="prepararAjusteLimites(e)" 
      >
        <div class="item-main-info estoque-main">
          <span class="id-tag prod-id">#{{ e.produto }}</span>
          <span class="item-name">{{ e.produto_nome }}</span>
          <span class="detail-tag location">{{ e.localizacao || 'Sem Local' }}</span>
        </div>

        <div class="item-details estoque-details">
            <span class="detail-tag stock-current" :class="{ 'low': e.estoque_baixo, 'high': e.estoque_alto }">
                Atual: {{ e.quantidade_atual }}
            </span>
             <span class="detail-tag stock-limits">
                (Min: {{ e.quantidade_minima }} | Max: {{ e.quantidade_maxima }})
            </span>
        </div>

        <div class="item-actions">
           <button @click.stop="prepararMovimentacao(e)" class="btn btn-primary btn-mov" title="Movimentar Estoque">Movimentar</button>
        </div>
      </li>
    </ul>

    <div class="paginator" v-if="!estoqueStore.isLoading && estoqueStore.meta.total_pages > 1">
       <button class="btn btn-light" :disabled="estoqueStore.meta.page <= 1" @click="estoqueStore.paginaAnterior">Anterior</button>
      <span>Página {{ estoqueStore.meta.page }} de {{ estoqueStore.meta.total_pages }}</span>
      <button class="btn btn-light" :disabled="estoqueStore.meta.page >= estoqueStore.meta.total_pages" @click="estoqueStore.proximaPagina">Próxima</button>
    </div>

    <div v-if="modalMovimentacaoAberto" class="modal-overlay" @click="limparFormularioMovimentacao">
      <div class="modal-content" @click.stop>
        <h3>Registrar Movimentação - {{ estoqueEmEdicao?.produto_nome }}</h3>
        <form @submit.prevent="registrar">
          <div class="form-grid grid-cols-2">
            <div class="form-group">
               <label>Produto</label>
               <input type="text" :value="estoqueEmEdicao?.produto_nome" disabled />
            </div>
             <div class="form-group">
               <label>Qtd. Atual</label>
               <input type="text" :value="quantidadeAtualSelecionada" disabled class="calculated-field current-stock" />
            </div>
            <div class="form-group">
              <label for="tipoMovimentacao">Tipo Movimentação*</label>
              <select id="tipoMovimentacao" v-model="movimentacao.tipo_movimentacao" required>
                <option v-for="t in TIPO_MOVIMENTACAO_OPTIONS" :key="t.value" :value="t.value">
                  {{ t.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="quantidadeMov">Quantidade*</label>
              <input id="quantidadeMov" type="number" v-model.number="movimentacao.quantidade" required min="1" placeholder="1" />
            </div>
             <div class="form-group span-2">
              <label for="funcionario">Funcionário Responsável*</label>
              <select id="funcionario" v-model="movimentacao.funcionario" required>
                <option :value="null" disabled>Selecione</option>
                <option v-for="f in estoqueStore.funcionariosDisponiveis" :key="f.id" :value="f.id">
                  {{ f.nome }}
                </option>
              </select>
            </div>
            <div class="form-group span-2">
              <label for="motivo">Motivo da Movimentação*</label>
              <input id="motivo" type="text" v-model="movimentacao.motivo" required placeholder="Ex: Recebimento NF 123, Vencimento, Inventário" />
            </div>
             <div class="form-group span-2">
              <label for="observacoesMov">Observações</label>
              <textarea id="observacoesMov" v-model="movimentacao.observacoes" rows="2"></textarea>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" @click="limparFormularioMovimentacao" class="btn btn-light">Fechar</button>
            <button type="submit" class="btn btn-primary" :disabled="estoqueStore.isLoading">Registrar</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* --- Container Principal --- */
.crud-container {
  max-width: 1200px; /* Ajustado para Estoque */
  margin: 0 auto;
  padding: var(--spacing-lg);
  background-color: var(--color-surface);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
}
/* Classe específica para evitar conflitos */
.estoque-view h1 .icon {
  font-size: 2.2rem;
}

/* --- Cabeçalho --- */
.crud-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

/* --- Formulário Inline de Ajuste de Limites --- */
.ajuste-limites-form {
  padding: var(--spacing-lg);
  border: 2px solid var(--color-accent);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-lg);
  background-color: #eff6ff; /* Fundo azul claro */
}
.ajuste-limites-form h2 {
    font-size: var(--font-size-lg);
    color: var(--color-accent-dark);
    margin-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--color-accent);
    padding-bottom: var(--spacing-sm);
}
.ajuste-limites-form .form-grid {
    align-items: end; /* Alinha labels/inputs */
}
.ajuste-limites-form .form-actions.inline-actions {
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: none;
    justify-content: flex-end;
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
.list-item-estoque { /* Classe específica para estoque */
  display: grid;
  grid-template-columns: auto 1fr auto; /* ID+Nome+Local | Detalhes Qtd | Ações */
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-left-width: 6px;
  border-left-color: var(--color-primary); /* Padrão (Estoque OK) */
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  cursor: pointer; /* Para abrir ajuste de limites */
}
.list-item-estoque:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  /* A cor da borda de status não muda no hover */
}
/* Destaque visual para o item sendo editado (limites) */
.list-item-estoque.editing-limits {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-primary-light);
}


/* Status de Cor da Borda */
.list-item-estoque.status-inactive { /* Se houver campo ativo no futuro */
  border-left-color: var(--color-danger);
  background-color: #fffafa;
  opacity: 0.7;
}
.list-item-estoque.status-warning { /* Estoque baixo */
  border-left-color: var(--color-warning);
  background-color: #fffbeb;
}


.item-main-info.estoque-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  overflow: hidden;
}
.id-tag.prod-id { /* Um pouco diferente do ID de outras telas */
  font-weight: var(--font-weight-regular);
}
.item-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.detail-tag.location {
    color: var(--color-text-secondary);
    background-color: transparent; /* Sem fundo para localização */
    padding: 0;
    margin-left: var(--spacing-xs);
}


.item-details.estoque-details {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end; /* Alinha à direita */
}
.detail-tag.stock-current {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-dark);
  background-color: transparent;
  padding: 0;
}
.detail-tag.stock-current.low {
    color: var(--color-warning);
}
.detail-tag.stock-current.high { /* Se houver estoque alto */
    color: var(--color-accent);
}
.detail-tag.stock-limits {
    color: var(--color-text-secondary);
    background-color: transparent;
    padding: 0;
    align-self: center; /* Alinha verticalmente com o número */
}


.item-actions {
  display: flex;
  gap: var(--spacing-sm);
}
/* Botão Movimentar específico */
.btn-mov {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
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

/* --- Modal de Movimentação --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background-color: var(--color-surface);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  width: 90%;
  max-width: 700px;
  box-shadow: var(--shadow-lg);
}
.modal-content h3 {
  font-size: var(--font-size-xl);
  color: var(--color-primary-dark);
  margin-top: 0;
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--spacing-md);
}
.modal-content .form-grid {
    gap: var(--spacing-md); /* Espaçamento interno do modal */
}
.modal-content .form-actions {
    margin-top: var(--spacing-lg);
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--color-border-light);
}
/* Campo Qtd. Atual no Modal */
.calculated-field.current-stock {
    background-color: var(--color-background);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    border-color: var(--color-border);
}


/* --- Responsividade --- */
@media (max-width: 900px) {
  .ajuste-limites-form .grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
  .ajuste-limites-form .form-group.span-2 { grid-column: span 2; }

  .list-item-estoque {
     grid-template-columns: 1fr auto; /* Info | Ações */
     gap: var(--spacing-sm);
  }
   .estoque-details {
    grid-column: 1 / 2; /* Detalhes vão para baixo */
    grid-row: 2 / 3;
    justify-content: flex-start; /* Alinha à esquerda */
    margin-top: var(--spacing-sm);
  }
  .item-actions {
    grid-column: 2 / 3;
    grid-row: 1 / 3;
    flex-direction: column;
    justify-content: center; /* Centraliza botão verticalmente */
  }
}

@media (max-width: 600px) {
  .ajuste-limites-form .grid-cols-4 { grid-template-columns: 1fr; }
  .ajuste-limites-form .form-group.span-2 { grid-column: span 1; }
  .modal-content .grid-cols-2 { grid-template-columns: 1fr; }
  .modal-content .form-group.span-2 { grid-column: span 1; }

   .list-item-estoque {
      gap: var(--spacing-md);
   }
   .item-main-info.estoque-main {
       flex-direction: column;
       align-items: flex-start;
       gap: var(--spacing-xs);
   }
   .detail-tag.location { margin-left: 0; }
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