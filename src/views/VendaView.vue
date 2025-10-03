<script setup>
import { reactive, onMounted, ref, computed } from 'vue'
import { useVendaStore } from '@/stores/vendaStore' 

const vendaStore = useVendaStore()

// --- ESTADO DE CONTROLE ---
const formAberto = ref(false) 
const itemIndexToEdit = ref(null) // Usado para saber qual item da lista está sendo editado

// Status (do modelo Django)
const STATUS_OPTIONS = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'finalizada', label: 'Finalizada' },
    { value: 'cancelada', label: 'Cancelada' },
];

// --- ESTADO DO FORMULÁRIO ---
const defaultVenda = { 
    id: null, 
    funcionario: null, // FK ID
    data_venda: null, // Omitido, pois o DRF usa timezone.now
    desconto: 0.00,
    status: 'pendente',
    observacoes: null,
    itens: [], // Array de ItemVenda
}
const venda = reactive({ ...defaultVenda })

const defaultItem = {
    produto: null, // FK ID
    quantidade: 1,
    preco_unitario: 0.00,
}
const itemAtual = reactive({ ...defaultItem })

// --- COMPUTED PROPERTIES ---

// Calcula o subtotal de um item
const subtotalItemAtual = computed(() => {
    return (itemAtual.quantidade || 0) * (itemAtual.preco_unitario || 0);
});

// Calcula o total bruto da venda (soma de todos os subtotais)
const subtotalVenda = computed(() => {
    let totalBruto = venda.itens.reduce((sum, item) => sum + item.subtotal, 0);
    return totalBruto;
});

// Calcula o valor final da venda
const valorFinalVenda = computed(() => {
    return subtotalVenda.value - (venda.desconto || 0);
});


// --- CICLO DE VIDA E FUNÇÕES BÁSICAS ---
onMounted(async () => {
    await Promise.all([
        vendaStore.getVendas(),
        vendaStore.loadDependencies()
    ]);
})

function limpar() {
    Object.assign(venda, { ...defaultVenda })
    Object.assign(itemAtual, { ...defaultItem })
    itemIndexToEdit.value = null;
    formAberto.value = false
}

// --- Funções de Gestão de Itens ---

function adicionarOuAtualizarItem() {
    if (!itemAtual.produto || !itemAtual.quantidade || itemAtual.preco_unitario === null) {
        alert("Selecione o Produto, Quantidade e Preço Unitário para adicionar o item.");
        return;
    }

    const novoItem = {
        ...itemAtual,
        subtotal: subtotalItemAtual.value,
        produto_nome: vendaStore.produtosDisponiveis.find(p => p.id === itemAtual.produto)?.nome || 'Produto Desconhecido'
    };

    if (itemIndexToEdit.value !== null) {
        // Atualiza item existente
        venda.itens.splice(itemIndexToEdit.value, 1, novoItem);
    } else {
        // Adiciona novo item
        venda.itens.push(novoItem);
    }

    // Limpa o item atual para o próximo
    Object.assign(itemAtual, { ...defaultItem });
    itemIndexToEdit.value = null;
}

function editarItem(item, index) {
    Object.assign(itemAtual, item);
    itemIndexToEdit.value = index;
}

function removerItem(index) {
    if (confirm("Tem certeza que deseja remover este item da lista?")) {
        venda.itens.splice(index, 1);
    }
}

// --- Funções de CRUD da Venda ---

async function salvar() {
    if (!venda.funcionario || venda.itens.length === 0) {
        alert("Selecione o Funcionário e adicione pelo menos um item à venda.")
        return
    }
    
    const dadosParaEnviar = { 
        ...venda, 
        // O total é ReadOnly no Serializer, mas incluímos o desconto
        total: valorFinalVenda.value, // Inclui o total final calculado (opcional, mas bom para sincronia)
        itens: venda.itens.map(item => ({
             // Remove o campo produto_nome que é read-only no serializer de ItemVenda
            produto: item.produto,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
        }))
    };
    
    // Tratamento de campos opcionais nulos
    if (dadosParaEnviar.observacoes === '') { dadosParaEnviar.observacoes = null; }

    await vendaStore.salvarVenda(dadosParaEnviar)
    limpar()
}

function editar(venda_para_editar) {
    Object.assign(venda, venda_para_editar)
    // Nota: O campo data_venda não precisa de formatação, pois é um DateTimeField read-only
    formAberto.value = true
}

async function excluir(id) {
    if (confirm("Tem certeza que deseja excluir esta venda?")) {
        await vendaStore.excluirVenda(id)
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
    <h1>Gestão de Vendas</h1>

    <div class="form-toggle">
        <button 
            @click="toggleForm"
            :class="{ 'cancelar': formAberto }"
        >
            {{ venda.id ? 'Editar Venda' : formAberto ? 'Fechar Formulário' : 'Nova Venda' }}
        </button>
    </div>

    <form class="form-container" @submit.prevent="salvar" v-if="formAberto">
      <h2>{{ venda.id ? `Venda #${venda.id} - ${venda.status_display}` : 'Nova Venda' }}</h2>

      <section>
        <h3>Dados da Venda</h3>
        <div class="form-group-grid" style="grid-template-columns: 2fr 1fr 1fr;">
          <div>
            <label for="funcionario">Funcionário*</label>
            <select id="funcionario" v-model="venda.funcionario" required>
              <option :value="null" disabled>Selecione o Funcionário</option>
              <option v-for="f in vendaStore.funcionariosDisponiveis" :key="f.id" :value="f.id">
                {{ f.nome }}
              </option>
            </select>
          </div>
          <div>
            <label for="status">Status</label>
            <select id="status" v-model="venda.status" :disabled="!venda.id">
              <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">
                {{ s.label }}
              </option>
            </select>
          </div>
          <div>
            <label for="desconto">Desconto (R$)</label>
            <input 
                id="desconto" 
                type="number" 
                step="0.01" 
                v-model.number="venda.desconto" 
                placeholder="0.00"
            />
          </div>
        </div>
      </section>

      <section>
        <h3>Itens da Venda</h3>
        <div class="form-group-grid" style="grid-template-columns: 3fr 1fr 1fr 1fr 50px;">
            <div>
                <label for="produto">Produto</label>
                <select id="produto" v-model="itemAtual.produto">
                    <option :value="null" disabled>Selecione o Produto</option>
                    <option v-for="p in vendaStore.produtosDisponiveis" :key="p.id" :value="p.id">
                        {{ p.nome }} (R$ {{ p.preco_unitario }})
                    </option>
                </select>
            </div>
            <div>
                <label for="quantidade">Qtd.</label>
                <input id="quantidade" type="number" v-model.number="itemAtual.quantidade" min="1" placeholder="1" />
            </div>
            <div>
                <label for="precoUnitario">Preço Unitário</label>
                <input id="precoUnitario" type="number" step="0.01" v-model.number="itemAtual.preco_unitario" placeholder="0.00" />
            </div>
            <div>
                <label>Subtotal</label>
                <input type="text" :value="subtotalItemAtual.toFixed(2)" disabled class="subtotal-input" />
            </div>
            <div class="action-item-button">
                <button type="button" @click="adicionarOuAtualizarItem" :disabled="!itemAtual.produto">
                    {{ itemIndexToEdit !== null ? '🖊️' : '➕' }}
                </button>
            </div>
        </div>
      </section>

      <section v-if="venda.itens.length > 0" class="resumo-itens">
        <h4>Resumo dos Itens ({{ venda.itens.length }})</h4>
        <table>
            <thead>
                <tr>
                    <th>Produto</th>
                    <th>Qtd</th>
                    <th>Preço Unitário</th>
                    <th>Subtotal</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in venda.itens" :key="index">
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

        <div class="totais">
            <p><strong>Total Bruto:</strong> R$ {{ subtotalVenda.toFixed(2) }}</p>
            <p class="desconto-valor"><strong>Desconto:</strong> R$ {{ Number(venda.desconto || 0).toFixed(2) }}</p>
            <p class="valor-final"><strong>Valor Total:</strong> R$ {{ valorFinalVenda.toFixed(2) }}</p>
        </div>
      </section>
      
      <div class="form-group-full">
        <div>
            <label for="observacoes">Observações</label>
            <textarea id="observacoes" v-model="venda.observacoes"></textarea>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="vendaStore.isLoading || venda.itens.length === 0">
          {{ venda.id ? 'Atualizar' : 'Salvar' }} Venda
        </button>
        <button type="button" @click="limpar" class="cancelar" :disabled="vendaStore.isLoading">
          Cancelar
        </button>
      </div>
    </form>
    
    <hr>
    
    <div v-if="vendaStore.isLoading" class="loading-message">
        Carregando vendas...
    </div>

    <ul class="venda-list" v-else>
      <li v-for="v in vendaStore.vendas" :key="v.id" :class="`venda-status-${v.status}`">
        <span class="venda-info" @click="editar(v)">
          <span class="id-tag">#{{ v.id }}</span>
          <strong>{{ v.funcionario_nome }}</strong> 
          <span class="status-tag">{{ v.status_display }}</span>
          <span class="total">R$ {{ Number(v.total || 0).toFixed(2) }}</span>
          <span class="data">{{ v.data_venda }}</span>
        </span>
        <div class="actions">
          <button @click="editar(v)" class="editar">Detalhes/Editar</button>
          <button @click="excluir(v.id)" class="excluir">Excluir</button>
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
  --success-color: #27ae60; /* Green for Finalizada */
  --warning-color: #f39c12; /* Yellow/Orange for Pendente */
  --light-bg: #f7f9fb;
  --white: #ffffff;
  --border-color: #e0e0e0;
}

.container {
  max-width: 1200px; /* Mais largo para o formulário de Venda */
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

h4 { /* Subtítulo para Resumo dos Itens */
    font-size: 1.1rem;
    color: var(--secondary-color);
    margin-bottom: 10px;
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

/* Grid Básico (ajustado para Venda) */
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

/* Estilo para o campo subtotal desabilitado na linha de item */
.subtotal-input {
    background-color: #ecf0f1;
    font-weight: 700;
}

.action-item-button {
    display: flex;
    align-items: flex-end; /* Alinha o botão com a linha de input */
    padding-bottom: 0px;
}
.action-item-button button {
    height: 40px; /* Altura igual aos inputs */
    width: 100%;
    font-size: 1.2rem;
    line-height: 1;
}


/* --- Tabela de Itens (Resumo) --- */
.resumo-itens {
    margin-top: 20px;
    padding: 15px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background-color: var(--white);
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
}
th, td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
}
th {
    background-color: #f7f9fb;
    color: var(--secondary-color);
    font-size: 0.95rem;
}
td {
    font-size: 0.95rem;
}

/* Botões dentro da tabela */
.editar-item, .remover-item {
    padding: 6px 10px;
    font-size: 0.85rem;
    margin-left: 5px;
}
.editar-item { background-color: var(--accent-color); }
.remover-item { background-color: var(--danger-color); }


/* --- Totais Finais --- */
.totais {
    text-align: right;
    font-size: 1.1rem;
    padding-top: 10px;
    border-top: 2px dashed var(--border-color);
}
.totais p {
    margin: 5px 0;
}
.valor-final {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--success-color);
}
.desconto-valor {
    color: var(--danger-color);
}

/* --- Ações e Botões (Padrão) --- */
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

/* ... (Estilos de hover, disabled, e hr) ... */
button:hover:not(:disabled) { background-color: #358a66; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); transform: translateY(-1px); }
button.cancelar { background-color: #95a5a6; text-transform: none; }
button.cancelar:hover:not(:disabled) { background-color: #7f8c8d; }
button:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
hr { border: 0; height: 1px; background-image: linear-gradient(to right, rgba(0, 0, 0, 0), var(--border-color), rgba(0, 0, 0, 0)); margin: 30px 0; }


/* --- Lista de Vendas (.venda-list) --- */
.loading-message { text-align: center; color: var(--primary-color); font-size: 1.2rem; font-weight: 600; margin: 30px 0; animation: pulse 1.5s infinite; }
@keyframes pulse { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }

.venda-list { list-style: none; padding: 0; display: grid; gap: 10px; }
.venda-list li {
  display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; 
  background-color: var(--white); border: 1px solid var(--border-color);
  border-left: 6px solid var(--accent-color); border-radius: 8px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05); transition: box-shadow 0.3s, transform 0.3s;
}
.venda-list li:hover { box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1); transform: translateY(-2px); }

/* Estilos de Borda de Status */
.venda-list li.venda-status-pendente { border-left-color: var(--warning-color); }
.venda-list li.venda-status-finalizada { border-left-color: var(--success-color); }
.venda-list li.venda-status-cancelada { border-left-color: var(--danger-color); opacity: 0.7; }

.venda-info {
  flex-grow: 1; cursor: pointer; display: flex; align-items: center; color: var(--secondary-color); gap: 15px;
}

.venda-info strong { font-size: 1.15rem; margin-right: 15px; color: #2c3e50; }
.id-tag { background-color: #ecf0f1; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; margin-right: 15px; color: #7f8c8d; font-weight: 700; }

.total { 
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--success-color);
    margin-left: 20px;
}
.status-tag { 
    font-size: 0.9rem; font-weight: 600; padding: 4px 10px; border-radius: 5px; margin-left: 10px;
}

/* Estilos para o Status Display */
.venda-status-pendente .status-tag { background-color: #fef0cd; color: var(--warning-color); }
.venda-status-finalizada .status-tag { background-color: #d4edda; color: var(--success-color); }
.venda-status-cancelada .status-tag { background-color: #f8d7da; color: var(--danger-color); }

.data { font-size: 0.9rem; color: #7f8c8d; margin-left: auto; }

.actions button { margin-left: 10px; padding: 8px 15px; font-size: 0.95rem; text-transform: none; }
.actions .editar { background-color: var(--accent-color); }
.actions .editar:hover { background-color: #2980b9; }
.actions .excluir { background-color: var(--danger-color); }
.actions .excluir:hover { background-color: #c0392b; }

/* --- Paginação --- */
.paginator { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 40px; font-size: 1.1rem; color: var(--secondary-color); font-weight: 500; }
.paginator button { padding: 8px 18px; font-size: 1rem; background-color: #ecf0f1; color: var(--secondary-color); box-shadow: none; text-transform: none; }
.paginator button:hover:not(:disabled) { background-color: #bdc3c7; transform: none; box-shadow: none; }
</style>