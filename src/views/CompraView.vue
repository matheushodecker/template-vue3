<script setup>
import { reactive, onMounted, ref, computed } from 'vue'
import { useCompraStore } from '@/stores/compraStore' 

const compraStore = useCompraStore()

// --- ESTADO DE CONTROLE ---
const formAberto = ref(false) 
const itemIndexToEdit = ref(null) 

// Status (do modelo Django)
const STATUS_OPTIONS = [
    { value: 'P', label: 'Pendente' },
    { value: 'A', label: 'Aprovada' },
    { value: 'R', label: 'Recebida' },
    { value: 'C', label: 'Cancelada' },
];

// --- ESTADO DO FORMULÁRIO (Mestre) ---
const defaultCompra = { 
    id: null, 
    numero_pedido: '',
    fornecedor: null, // FK ID
    funcionario: null, // FK ID
    data_entrega_prevista: null, // Obrigatório
    data_entrega_real: null, // Opcional
    desconto: 0.00,
    frete: 0.00,
    status: 'P', // Default: Pendente
    observacoes: null,
    itens: [], // Array de ItemCompra
}
const compra = reactive({ ...defaultCompra })

// --- ESTADO DO ITEM (Detalhe) ---
const defaultItem = {
    produto: null, // FK ID
    quantidade: 1,
    preco_unitario: 0.00, // Preço de compra
}
const itemAtual = reactive({ ...defaultItem })

// --- COMPUTED PROPERTIES ---

// Calcula o subtotal de um item
const subtotalItemAtual = computed(() => {
    return (itemAtual.quantidade || 0) * (itemAtual.preco_unitario || 0);
});

// Calcula o total bruto da compra (soma de todos os subtotais)
const subtotalItensCompra = computed(() => {
    return compra.itens.reduce((sum, item) => sum + item.subtotal, 0);
});

// Calcula o valor final da compra
const valorFinalCompra = computed(() => {
    const totalBruto = subtotalItensCompra.value;
    const frete = Number(compra.frete || 0);
    const desconto = Number(compra.desconto || 0);
    return totalBruto + frete - desconto;
});


// --- CICLO DE VIDA E FUNÇÕES BÁSICAS ---
onMounted(async () => {
    await Promise.all([
        compraStore.getCompras(),
        compraStore.loadDependencies()
    ]);
})

function limpar() {
    Object.assign(compra, { ...defaultCompra })
    Object.assign(itemAtual, { ...defaultItem })
    itemIndexToEdit.value = null;
    formAberto.value = false
}

// Função auxiliar para checar se o campo está vazio
function isFieldEmpty(value) {
    if (typeof value === 'string') return value.trim() === '';
    return value === null || value === undefined;
}


// --- Funções de Gestão de Itens ---

function adicionarOuAtualizarItem() {
    if (!itemAtual.produto || itemAtual.quantidade < 1 || itemAtual.preco_unitario === null) {
        alert("Selecione o Produto, Quantidade e Preço Unitário para adicionar o item.");
        return;
    }

    const produtoSelecionado = compraStore.produtosDisponiveis.find(p => p.id === itemAtual.produto);

    const novoItem = {
        ...itemAtual,
        subtotal: subtotalItemAtual.value,
        produto_nome: produtoSelecionado?.nome || 'Produto Desconhecido'
    };

    if (itemIndexToEdit.value !== null) {
        compra.itens.splice(itemIndexToEdit.value, 1, novoItem);
    } else {
        compra.itens.push(novoItem);
    }

    Object.assign(itemAtual, { ...defaultItem });
    itemIndexToEdit.value = null;
}

function editarItem(item, index) {
    Object.assign(itemAtual, item);
    itemIndexToEdit.value = index;
}

function removerItem(index) {
    if (confirm("Tem certeza que deseja remover este item da lista?")) {
        compra.itens.splice(index, 1);
    }
}

// --- Funções de CRUD da Compra ---

async function salvar() {
    if (isFieldEmpty(compra.numero_pedido) || !compra.fornecedor || !compra.funcionario || !compra.data_entrega_prevista || compra.itens.length === 0) 
    {
        alert("Número do Pedido, Fornecedor, Funcionário, Data de Entrega Prevista e pelo menos um item são obrigatórios.")
        return
    }
    
    const dadosParaEnviar = { 
        ...compra, 
        valor_total: valorFinalCompra.value, // Inclui o total final calculado
        
        // CORREÇÃO CRÍTICA: Trata campos opcionais de Data/Texto que podem ser vazios ("")
        data_entrega_real: isFieldEmpty(compra.data_entrega_real) ? null : compra.data_entrega_real,
        observacoes: isFieldEmpty(compra.observacoes) ? null : compra.observacoes,

        itens: compra.itens.map(item => ({
             // Remove o campo produto_nome (read-only no Serializer)
            produto: item.produto,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
        }))
    };
    
    await compraStore.salvarCompra(dadosParaEnviar)
    limpar()
}

function editar(compra_para_editar) {
    // Formatação das datas para input type="date"
    const dataEntregaPrevistaFormatada = compra_para_editar.data_entrega_prevista ? 
                                         compra_para_editar.data_entrega_prevista.substring(0, 10) : null;
    const dataEntregaRealFormatada = compra_para_editar.data_entrega_real ? 
                                     compra_para_editar.data_entrega_real.substring(0, 10) : null;
    
    Object.assign(compra, { 
        ...compra_para_editar,
        // data_pedido é read-only
        data_entrega_prevista: dataEntregaPrevistaFormatada,
        data_entrega_real: dataEntregaRealFormatada,
    })
    formAberto.value = true
}

async function excluir(id) {
    if (confirm("Tem certeza que deseja excluir esta Compra?")) {
        await compraStore.excluirCompra(id)
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
    <h1>Gestão de Compras</h1>

    <div class="form-toggle">
        <button 
            @click="toggleForm"
            :class="{ 'cancelar': formAberto }"
        >
            {{ compra.id ? 'Editar Compra' : formAberto ? 'Fechar Formulário' : 'Nova Compra' }}
        </button>
    </div>

    <form class="form-container" @submit.prevent="salvar" v-if="formAberto">
      <h2>{{ compra.id ? `Editar Compra #${compra.numero_pedido}` : 'Nova Compra' }}</h2>

      <section>
        <h3>Dados do Pedido</h3>
        <div class="form-group-grid" style="grid-template-columns: 1fr 1fr 1fr 1fr 1fr;">
          <div>
            <label for="numeroPedido">Nº Pedido*</label>
            <input id="numeroPedido" type="text" v-model="compra.numero_pedido" required placeholder="Ex: PO-2025-001" />
          </div>
          <div>
            <label for="fornecedor">Fornecedor*</label>
            <select id="fornecedor" v-model="compra.fornecedor" required>
              <option :value="null" disabled>Selecione o Fornecedor</option>
              <option v-for="f in compraStore.fornecedoresDisponiveis" :key="f.id" :value="f.id">
                {{ f.nome }}
              </option>
            </select>
          </div>
          <div>
            <label for="funcionario">Funcionário*</label>
            <select id="funcionario" v-model="compra.funcionario" required>
              <option :value="null" disabled>Selecione o Funcionário</option>
              <option v-for="f in compraStore.funcionariosDisponiveis" :key="f.id" :value="f.id">
                {{ f.nome }}
              </option>
            </select>
          </div>
          <div>
            <label for="dataEntregaPrevista">Entrega Prevista*</label>
            <input id="dataEntregaPrevista" type="date" v-model="compra.data_entrega_prevista" required />
          </div>
          <div>
            <label for="dataEntregaReal">Entrega Real</label>
            <input id="dataEntregaReal" type="date" v-model="compra.data_entrega_real" />
          </div>
        </div>
      </section>
      
      <section>
        <h3>Itens e Custos</h3>

        <div class="form-group-grid item-input-row" style="grid-template-columns: 2fr 1fr 1fr 1fr 50px;">
            <div>
                <label for="produtoItem">Produto</label>
                <select id="produtoItem" v-model="itemAtual.produto">
                    <option :value="null" disabled>Selecione o Produto</option>
                    <option v-for="p in compraStore.produtosDisponiveis" :key="p.id" :value="p.id">
                        {{ p.nome }} (Custo Ref: R$ {{ p.preco_custo }})
                    </option>
                </select>
            </div>
            <div>
                <label for="quantidade">Qtd.</label>
                <input id="quantidade" type="number" v-model.number="itemAtual.quantidade" min="1" placeholder="1" />
            </div>
            <div>
                <label for="precoUnitario">Preço Unitário Custo</label>
                <input id="precoUnitario" type="number" step="0.01" v-model.number="itemAtual.preco_unitario" placeholder="0.00" />
            </div>
            <div>
                <label>Subtotal Item</label>
                <input type="text" :value="subtotalItemAtual.toFixed(2)" disabled class="subtotal-input" />
            </div>
            <div class="action-item-button">
                <button type="button" @click="adicionarOuAtualizarItem" :disabled="!itemAtual.produto">
                    {{ itemIndexToEdit !== null ? '🖊️' : '➕' }}
                </button>
            </div>
        </div>

        <div class="resumo-grid">
            <div class="lista-itens-wrapper">
                <h4>Itens do Pedido ({{ compra.itens.length }})</h4>
                <table v-if="compra.itens.length > 0" class="itens-compra-table">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Qtd</th>
                            <th>Custo Unit.</th>
                            <th>Subtotal</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in compra.itens" :key="index">
                            <td>{{ item.produto_nome }}</td>
                            <td>{{ item.quantidade }}</td>
                            <td>R$ {{ Number(item.preco_unitario).toFixed(2) }}</td>
                            <td>R$ {{ Number(item.subtotal).toFixed(2) }}</td>
                            <td>
                                <button type="button" @click="editarItem(item, index)" class="editar-item">Editar</button>
                                <button type="button" @click="removerItem(index)" class="remover-item">Remover</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p v-else class="alerta-vazio">Adicione produtos a esta compra.</p>
            </div>

            <div class="totais-compra">
                <h4>Resumo Financeiro</h4>
                <div class="totais-campos">
                    <label for="status">Status</label>
                    <select id="status" v-model="compra.status" required>
                      <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">
                        {{ s.label }}
                      </option>
                    </select>

                    <label for="frete">Frete (R$)</label>
                    <input id="frete" type="number" step="0.01" v-model.number="compra.frete" placeholder="0.00" />
                    
                    <label for="desconto">Desconto (R$)</label>
                    <input id="desconto" type="number" step="0.01" v-model.number="compra.desconto" placeholder="0.00" />
                </div>
                
                <div class="totais-resumo">
                    <p>Total Itens:</p>
                    <p>R$ {{ subtotalItensCompra.toFixed(2) }}</p>

                    <p>Frete (+):</p>
                    <p>R$ {{ Number(compra.frete || 0).toFixed(2) }}</p>
                    
                    <p>Desconto (-):</p>
                    <p>R$ {{ Number(compra.desconto || 0).toFixed(2) }}</p>

                    <p class="valor-final-label">Valor Total:</p>
                    <p class="valor-final">R$ {{ valorFinalCompra.toFixed(2) }}</p>
                </div>
            </div>
        </div>
      </section>
      
      <div class="form-group-full">
        <div>
            <label for="observacoes">Observações</label>
            <textarea id="observacoes" v-model="compra.observacoes"></textarea>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="compraStore.isLoading || compra.itens.length === 0">
          {{ compra.id ? 'Atualizar' : 'Salvar' }} Compra
        </button>
        <button type="button" @click="limpar" class="cancelar" :disabled="compraStore.isLoading">
          Cancelar
        </button>
      </div>
    </form>
    
    <hr>
    
    <div v-if="compraStore.isLoading" class="loading-message">
        Carregando compras...
    </div>

    <ul class="compra-list" v-else>
      <li v-for="c in compraStore.compras" :key="c.id" :class="`compra-status-${c.status}`">
        <span class="compra-info" @click="editar(c)">
          <span class="id-tag">#{{ c.id }}</span>
          <strong>Pedido {{ c.numero_pedido }}</strong> 
          <span class="fornecedor">{{ c.fornecedor_nome }}</span>
          <span class="status-tag">{{ c.status_display }}</span>
          <span class="total">R$ {{ Number(c.valor_total || 0).toFixed(2) }}</span>
          <span class="data">Prev. Entrega: {{ c.data_entrega_prevista }}</span>
        </span>
        <div class="actions">
          <button @click="editar(c)" class="editar">Detalhes/Editar</button>
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
  --danger-color: #e74c3c; /* Red for Delete/Cancelada */
  --success-color: #2ecc71; /* Green para Recebida */
  --pending-color: #f39c12; /* Yellow/Orange para Pendente */
  --approved-color: #8e44ad; /* Roxo para Aprovada */
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

h2 {
  font-size: 1.6rem;
  color: var(--secondary-color);
  margin-bottom: 20px;
  font-weight: 600;
}

h3 { /* Títulos de Seção */
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

/* Grid Básico para o cabeçalho do pedido */
.form-group-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

/* Estilo para campo de subtotal desabilitado na linha de item */
.subtotal-input {
    background-color: #e8f0fe; 
    font-weight: 600;
    color: var(--accent-color);
}

/* --- Linha de Input de Item Dinâmica --- */
.item-input-row {
    margin-bottom: 25px !important;
    padding: 15px;
    background-color: #e6eef6; 
    border-radius: 8px;
}
.action-item-button {
    display: flex;
    align-items: flex-end;
    padding-bottom: 0px;
}
.action-item-button button {
    height: 40px; 
    width: 100%;
    font-size: 1.2rem;
    line-height: 1;
    padding: 0;
    background-color: var(--primary-color);
}

/* --- Layout da Tabela de Itens e Totais (Resumo) --- */
.resumo-grid {
    display: grid;
    grid-template-columns: 3fr 1fr; /* 3/4 para itens, 1/4 para totais */
    gap: 20px;
    margin-top: 20px;
}

.lista-itens-wrapper {
    padding: 15px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background-color: var(--white);
    overflow-x: auto;
}

/* Estilos da Tabela */
.itens-compra-table {
    width: 100%;
    border-collapse: collapse;
}
.itens-compra-table th, .itens-compra-table td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
}
.itens-compra-table th {
    background-color: #f7f9fb;
    color: var(--secondary-color);
    font-size: 0.95rem;
}

/* Botões dentro da tabela */
.editar-item, .remover-item {
    padding: 6px 10px;
    font-size: 0.85rem;
    margin-left: 5px;
    text-transform: none;
    box-shadow: none;
}
.editar-item { background-color: var(--accent-color); }
.remover-item { background-color: var(--danger-color); }

.alerta-vazio {
    margin-top: 10px;
    font-style: italic;
    color: #7f8c8d;
    padding: 10px;
}

/* --- Coluna de Totais (totais-compra) --- */
.totais-compra {
    padding: 15px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background-color: var(--white);
}

.totais-campos {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    margin-bottom: 20px;
}

.totais-resumo {
    display: grid;
    grid-template-columns: 1fr 1fr; /* Coluna de Nome e Coluna de Valor */
    gap: 5px;
    padding-top: 10px;
    border-top: 1px dashed var(--border-color);
    font-size: 1rem;
}
.totais-resumo p {
    margin: 0;
    padding: 2px 0;
}
.totais-resumo p:nth-child(odd) { /* Labels */
    font-weight: 500;
    text-align: left;
}
.totais-resumo p:nth-child(even) { /* Valores */
    font-weight: 600;
    text-align: right;
}

.valor-final-label {
    font-size: 1.1rem !important;
    font-weight: 700 !important;
    color: var(--secondary-color);
    border-top: 1px solid var(--secondary-color);
    margin-top: 5px !important;
    padding-top: 5px !important;
}
.valor-final {
    font-size: 1.1rem !important;
    color: var(--primary-color) !important;
    border-top: 1px solid var(--secondary-color);
    margin-top: 5px !important;
    padding-top: 5px !important;
}

/* --- Ações e Botões (Padrão) --- */
.form-actions {
  display: flex; justify-content: flex-end; gap: 15px; margin-top: 30px; padding-top: 15px; border-top: 1px solid var(--border-color);
}
button { padding: 12px 25px; border: none; border-radius: 6px; cursor: pointer; background-color: var(--primary-color); color: var(--white); font-weight: 600; transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
button:hover:not(:disabled) { background-color: #358a66; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); transform: translateY(-1px); }
button.cancelar { background-color: #95a5a6; text-transform: none; }
button.cancelar:hover:not(:disabled) { background-color: #7f8c8d; }
button:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
hr { border: 0; height: 1px; background-image: linear-gradient(to right, rgba(0, 0, 0, 0), var(--border-color), rgba(0, 0, 0, 0)); margin: 30px 0; }

/* --- Lista de Compras (.compra-list) --- */
.loading-message { text-align: center; color: var(--primary-color); font-size: 1.2rem; font-weight: 600; margin: 30px 0; animation: pulse 1.5s infinite; }
@keyframes pulse { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }

.compra-list { list-style: none; padding: 0; display: grid; gap: 10px; }
.compra-list li {
  display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; 
  background-color: var(--white); border: 1px solid var(--border-color);
  border-left: 6px solid var(--accent-color); border-radius: 8px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05); transition: box-shadow 0.3s, transform 0.3s;
}
.compra-list li:hover { box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1); transform: translateY(-2px); }

/* Estilos de Status */
.compra-list li.compra-status-P { border-left-color: var(--pending-color); } /* Pendente */
.compra-list li.compra-status-A { border-left-color: var(--approved-color); } /* Aprovada */
.compra-list li.compra-status-R { border-left-color: var(--success-color); } /* Recebida */
.compra-list li.compra-status-C { border-left-color: var(--danger-color); opacity: 0.7; } /* Cancelada */

.compra-info { flex-grow: 1; cursor: pointer; display: flex; align-items: center; color: var(--secondary-color); gap: 15px; }
.compra-info strong { font-size: 1.15rem; margin-right: 15px; color: #2c3e50; }
.id-tag { background-color: #ecf0f1; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; margin-right: 15px; color: #7f8c8d; font-weight: 700; }

.fornecedor { font-size: 1rem; color: #555; }
.total { font-size: 1.1rem; font-weight: 700; color: var(--primary-color); margin-left: 20px; }
.data { font-size: 0.9rem; color: #7f8c8d; margin-left: auto; }

.status-tag { font-size: 0.85rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; margin-left: 10px; }

/* Estilos para o Status Display */
.compra-status-P .status-tag { background-color: #fef0cd; color: var(--pending-color); }
.compra-status-A .status-tag { background-color: #e2d1eb; color: var(--approved-color); }
.compra-status-R .status-tag { background-color: #d4edda; color: var(--success-color); }
.compra-status-C .status-tag { background-color: #f8d7da; color: var(--danger-color); }

.actions button { margin-left: 10px; padding: 8px 15px; font-size: 0.95rem; text-transform: none; }
.actions .editar { background-color: var(--accent-color); }
.actions .editar:hover { background-color: #2980b9; }
.actions .excluir { background-color: var(--danger-color); }
.actions .excluir:hover { background-color: #c0392b; }

/* --- Paginação (Padrão) --- */
.paginator { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 40px; font-size: 1.1rem; color: var(--secondary-color); font-weight: 500; }
.paginator button { padding: 8px 18px; font-size: 1rem; background-color: #ecf0f1; color: var(--secondary-color); box-shadow: none; text-transform: none; }
.paginator button:hover:not(:disabled) { background-color: #bdc3c7; transform: none; box-shadow: none; }
</style>
