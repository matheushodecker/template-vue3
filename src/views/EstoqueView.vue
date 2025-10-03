<script setup>
import { reactive, onMounted, ref, computed } from 'vue'
import { useEstoqueStore } from '@/stores/estoqueStore' 

const estoqueStore = useEstoqueStore()

// --- ESTADO DE CONTROLE ---
// Modal para registro de Movimentação (Em vez de formAberto, pois é uma ação diferente)
const modalMovimentacaoAberto = ref(false) 
const estoqueEmEdicao = ref(null) // Estoque clicado para ajuste de limites ou movimentação

// Tipos de Movimentação (do Modelo Django)
const TIPO_MOVIMENTACAO_OPTIONS = [
    { value: 'E', label: 'Entrada (Recebimento)' },
    { value: 'S', label: 'Saída (Perda/Devolução)' },
    { value: 'A', label: 'Ajuste (Inventário)' },
];

// --- ESTADO DO FORMULÁRIO DE MOVIMENTAÇÃO ---
const defaultMovimentacao = {
    produto: null, 
    tipo_movimentacao: 'E',
    quantidade: 1,
    funcionario: null, 
    motivo: '',
    observacoes: null,
}
const movimentacao = reactive({ ...defaultMovimentacao })

// Estado para ajustes de Limite/Localização (formulário mais simples)
const limitesAjuste = reactive({
    id: null,
    quantidade_minima: 5,
    quantidade_maxima: 1000,
    localizacao: '',
})


// --- COMPUTED PROPERTIES ---
// Filtra a lista de produtos disponíveis que AINDA NÃO têm um registro de Estoque (apenas na criação)
const produtosSemEstoque = computed(() => {
    const produtosComEstoque = estoqueStore.estoques.map(e => e.produto);
    return estoqueStore.produtosDisponiveis.filter(p => !produtosComEstoque.includes(p.id));
});

// Acessa a quantidade atual do produto selecionado
const quantidadeAtualSelecionada = computed(() => {
    const produtoId = movimentacao.produto;
    // Se estiver fazendo a movimentação diretamente da lista, usa o estoque em edição
    if (estoqueEmEdicao.value) {
        return estoqueEmEdicao.value.quantidade_atual;
    }
    // Caso contrário, (se estiver criando um registro de estoque novo), é 0.
    return 0;
});


// --- CICLO DE VIDA E FUNÇÕES BÁSICAS ---
onMounted(async () => {
    await Promise.all([
        estoqueStore.getEstoques(),
        estoqueStore.loadDependencies()
    ]);
})

function limparFormularioMovimentacao() {
    Object.assign(movimentacao, { ...defaultMovimentacao });
    estoqueEmEdicao.value = null;
    modalMovimentacaoAberto.value = false;
}

function limparFormularioLimites() {
    Object.assign(limitesAjuste, { ...defaultMovimentacao });
    estoqueEmEdicao.value = null;
}

// --- Funções de Gestão de Estoque (Limites e Localização) ---

function prepararAjusteLimites(estoque) {
    Object.assign(limitesAjuste, {
        id: estoque.id,
        quantidade_minima: estoque.quantidade_minima,
        quantidade_maxima: estoque.quantidade_maxima,
        localizacao: estoque.localizacao,
    });
    estoqueEmEdicao.value = estoque;
}

async function salvarLimites() {
    if (limitesAjuste.quantidade_minima >= limitesAjuste.quantidade_maxima) {
        alert("A Quantidade Mínima deve ser menor que a Máxima.");
        return;
    }
    await estoqueStore.atualizarLimites({ ...limitesAjuste });
    limparFormularioLimites();
}


// --- Funções de Movimentação ---

function prepararMovimentacao(estoque) {
    estoqueEmEdicao.value = estoque;
    movimentacao.produto = estoque.produto;
    modalMovimentacaoAberto.value = true;
}

async function registrar() {
    if (!movimentacao.produto || !movimentacao.funcionario || !movimentacao.motivo || movimentacao.quantidade <= 0) {
        alert("Produto, Funcionário, Motivo e Quantidade são obrigatórios.");
        return;
    }

    const dadosParaEnviar = {
        ...movimentacao,
        // Garante que o ID do produto é enviado (seja novo ou existente)
        produto: movimentacao.produto, 
        // Observacoes nulas
        observacoes: isFieldEmpty(movimentacao.observacoes) ? null : movimentacao.observacoes,
    };

    try {
        await estoqueStore.registrarMovimentacao(dadosParaEnviar);
        limparFormularioMovimentacao();
        alert("Movimentação registrada com sucesso!");
    } catch (e) {
        // O erro (500) do backend geralmente trata a inconsistência do estoque
        alert("Erro ao registrar: O backend pode ter rejeitado a movimentação (ex: estoque negativo).");
    }
}

// Helper (reutilizado)
function isFieldEmpty(value) {
    if (typeof value === 'string') return value.trim() === '';
    return value === null || value === undefined;
}
</script>

<template>
  <div class="container">
    <h1>Controle de Estoque e Movimentações</h1>

    <div class="form-toggle">
        <button 
            @click="modalMovimentacaoAberto = true"
            class="primary-button"
        >
            Registrar Movimentação / Entrada
        </button>
    </div>

    <div v-if="estoqueStore.isLoading" class="loading-message">
        Carregando dados de estoque...
    </div>

    <ul class="estoque-list" v-else>
      <li v-for="e in estoqueStore.estoques" :key="e.id" :class="{ 'estoque-baixo': e.estoque_baixo, 'estoque-alto': e.estoque_alto }">
        <span class="estoque-info">
          <span class="id-tag">#{{ e.produto }}</span>
          <strong>{{ e.produto_nome }}</strong> 
          <span class="localizacao">{{ e.localizacao || 'Sem Local' }}</span>
          <span class="quantidade">Atual: {{ e.quantidade_atual }}</span>
          <span class="limites">Min: {{ e.quantidade_minima }} | Max: {{ e.quantidade_maxima }}</span>
        </span>
        <div class="actions">
          <button @click="prepararAjusteLimites(e)" class="editar">Ajustar Limites</button>
          <button @click="prepararMovimentacao(e)" class="primary-button">Movimentar</button>
        </div>
      </li>
    </ul>
    
    <hr>
    <div class="ajuste-limites-form" v-if="estoqueEmEdicao">
        <h3>Ajustar Limites e Localização ({{ estoqueEmEdicao.produto_nome }})</h3>
        <form @submit.prevent="salvarLimites" class="form-group-grid" style="grid-template-columns: 1fr 1fr 2fr 100px;">
            <div>
                <label for="minima">Mínima</label>
                <input id="minima" type="number" v-model.number="limitesAjuste.quantidade_minima" required min="0" />
            </div>
            <div>
                <label for="maxima">Máxima</label>
                <input id="maxima" type="number" v-model.number="limitesAjuste.quantidade_maxima" required min="1" />
            </div>
            <div>
                <label for="localizacao">Localização</label>
                <input id="localizacao" type="text" v-model="limitesAjuste.localizacao" placeholder="Ex: Corredor A, Prateleira 3" />
            </div>
            <div class="form-actions-inline">
                <button type="submit">Salvar</button>
                <button type="button" @click="limparFormularioLimites" class="cancelar">X</button>
            </div>
        </form>
    </div>


    <div v-if="modalMovimentacaoAberto" class="modal-overlay">
        <div class="modal-content">
            <h3>Registrar Movimentação</h3>
            
            <form @submit.prevent="registrar">
                <div class="form-group-grid">
                    <div>
                        <label for="produtoMov">Produto</label>
                        <select 
                            id="produtoMov" 
                            v-model="movimentacao.produto" 
                            required 
                            :disabled="!!estoqueEmEdicao"
                        >
                            <option :value="null" disabled>Selecione um Produto</option>
                            <option v-for="p in produtosSemEstoque" :key="p.id" :value="p.id">
                                {{ p.nome }}
                            </option>
                            <option v-if="estoqueEmEdicao" :value="estoqueEmEdicao.produto" selected>
                                {{ estoqueEmEdicao.produto_nome }} (Atual: {{ estoqueEmEdicao.quantidade_atual }})
                            </option>
                        </select>
                    </div>
                    <div>
                        <label>Qtd. Atual</label>
                        <input type="text" :value="quantidadeAtualSelecionada" disabled class="subtotal-input" />
                    </div>
                    <div>
                        <label for="tipoMovimentacao">Tipo</label>
                        <select id="tipoMovimentacao" v-model="movimentacao.tipo_movimentacao" required>
                            <option v-for="t in TIPO_MOVIMENTACAO_OPTIONS" :key="t.value" :value="t.value">
                                {{ t.label }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label for="quantidadeMov">Quantidade (a movimentar)</label>
                        <input id="quantidadeMov" type="number" v-model.number="movimentacao.quantidade" required min="1" placeholder="1" />
                    </div>
                    <div>
                        <label for="funcionario">Funcionário Responsável*</label>
                        <select id="funcionario" v-model="movimentacao.funcionario" required>
                            <option :value="null" disabled>Selecione o Funcionário</option>
                            <option v-for="f in estoqueStore.funcionariosDisponiveis" :key="f.id" :value="f.id">
                                {{ f.nome }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label for="motivo">Motivo da Movimentação*</label>
                        <input id="motivo" type="text" v-model="movimentacao.motivo" required placeholder="Ex: Recebimento de NF 123, Vencimento, Inventário" />
                    </div>
                </div>

                <div class="form-group-full">
                    <div>
                        <label for="observacoesMov">Observações</label>
                        <textarea id="observacoesMov" v-model="movimentacao.observacoes"></textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit">Registrar</button>
                    <button type="button" @click="limparFormularioMovimentacao" class="cancelar">Fechar</button>
                </div>
            </form>
        </div>
    </div>
  </div>
</template>
<style scoped>
/* Variáveis para fácil manutenção de cores */
:root {
  --primary-color: #41b883; /* Vue Green */
  --secondary-color: #34495e; /* Dark Blue/Gray */
  --accent-color: #3498db; /* Blue for Edit */
  --danger-color: #e74c3c; /* Red for Cancelada/Baixo Estoque Crítico */
  --low-stock-color: #f39c12; /* Yellow/Orange para Estoque Baixo */
  --high-stock-color: #8e44ad; /* Roxo para Estoque Alto */
  --light-bg: #f7f9fb;
  --white: #ffffff;
  --border-color: #e0e0e0;
}

.container {
  max-width: 1200px;
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

h3 { /* Títulos de Seção / Modal */
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
input, select, textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
  background-color: var(--white);
}

input:focus, select:focus, textarea:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(65, 184, 131, 0.2);
}
.subtotal-input { /* Para campos desabilitados como Qtd. Atual */
    background-color: #e8f0fe; 
    font-weight: 600;
    color: var(--secondary-color);
}


/* --- Formulário de Ajuste de Limites (Lateral/Abaixo da Lista) --- */
.ajuste-limites-form {
    padding: 20px;
    border: 2px solid var(--accent-color);
    border-radius: 8px;
    margin-top: 30px;
    background-color: #f0f6ff;
}
.ajuste-limites-form h3 {
    border-bottom: none;
    margin-top: 0;
    padding-bottom: 0;
    color: var(--accent-color);
}
.ajuste-limites-form .form-actions-inline {
    display: flex;
    gap: 5px;
    padding-top: 25px; 
}
.ajuste-limites-form .form-actions-inline button {
    padding: 10px 12px;
    font-size: 0.9rem;
    text-transform: none;
    height: 40px;
}
.ajuste-limites-form .form-actions-inline .cancelar {
    background-color: var(--danger-color);
}


/* ---------------------------------------------------- */
/* --- ESTILOS DO MODAL DE MOVIMENTAÇÃO --- */
/* ---------------------------------------------------- */

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
    background-color: var(--white);
    padding: 30px;
    border-radius: 10px;
    width: 90%;
    max-width: 800px; 
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}
.modal-content h3 {
    color: var(--primary-color);
    border-bottom: 1px solid var(--primary-color);
    padding-bottom: 10px;
    margin-bottom: 20px;
    margin-top: 0;
}
.modal-content .form-actions {
    justify-content: flex-end;
    border-top: none;
    padding-top: 0;
}


/* ---------------------------------------------------- */
/* --- AÇÕES E BOTÕES (Padrão) --- */
/* ---------------------------------------------------- */

.form-actions {
  display: flex; justify-content: flex-end; gap: 15px; margin-top: 30px; padding-top: 15px; border-top: 1px solid var(--border-color);
}

button {
  padding: 12px 25px; border: none; border-radius: 6px; cursor: pointer; background-color: var(--primary-color); color: var(--white); font-weight: 600; transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

button:hover:not(:disabled) { background-color: #358a66; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); transform: translateY(-1px); }
button.cancelar { background-color: #95a5a6; text-transform: none; }
button.cancelar:hover:not(:disabled) { background-color: #7f8c8d; }
button:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
hr { border: 0; height: 1px; background-image: linear-gradient(to right, rgba(0, 0, 0, 0), var(--border-color), rgba(0, 0, 0, 0)); margin: 30px 0; }

/* --- Lista de Estoque (.estoque-list) --- */
.loading-message { text-align: center; color: var(--primary-color); font-size: 1.2rem; font-weight: 600; margin: 30px 0; animation: pulse 1.5s infinite; }
@keyframes pulse { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }

.estoque-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 10px;
}

.estoque-list li {
  display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; 
  background-color: var(--white); border: 1px solid var(--border-color);
  border-left: 6px solid var(--primary-color);
  border-radius: 8px; box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05); transition: box-shadow 0.3s, transform 0.3s;
}

.estoque-list li:hover { box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1); transform: translateY(-2px); }


/* Estilos de Status de Estoque */
.estoque-list li.estoque-baixo {
  border-left-color: var(--low-stock-color);
  background-color: #fff8e1; /* Fundo de alerta */
}
.estoque-list li.estoque-alto {
  border-left-color: var(--high-stock-color);
}

.estoque-info {
  flex-grow: 1; cursor: default; display: flex; align-items: center; color: var(--secondary-color); gap: 15px;
}

.estoque-info strong { font-size: 1.15rem; margin-right: 15px; color: #2c3e50; }
.id-tag { background-color: #ecf0f1; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; margin-right: 15px; color: #7f8c8d; font-weight: 700; }

.localizacao { font-size: 0.9rem; color: #7f8c8d; }
.quantidade {
    font-size: 1.1rem;
    font-weight: 700;
    margin-left: 20px;
    color: var(--primary-color);
}
.limites {
    font-size: 0.95rem;
    color: var(--secondary-color);
    margin-left: 15px;
}

/* Alerta visual na quantidade quando baixo/alto */
.estoque-baixo .quantidade { color: var(--low-stock-color); }
.estoque-alto .quantidade { color: var(--high-stock-color); }


.actions button {
  margin-left: 10px;
  padding: 8px 15px;
  font-size: 0.95rem;
  text-transform: none;
}
.actions .editar { background-color: var(--accent-color); }
.actions .editar:hover { background-color: #2980b9; }

/* --- Paginação (Padrão) --- */
.paginator { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 40px; font-size: 1.1rem; color: var(--secondary-color); font-weight: 500; }
.paginator button { padding: 8px 18px; font-size: 1rem; background-color: #ecf0f1; color: var(--secondary-color); box-shadow: none; text-transform: none; }
.paginator button:hover:not(:disabled) { background-color: #bdc3c7; transform: none; box-shadow: none; }
</style>
