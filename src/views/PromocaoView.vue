<script setup>
import { reactive, onMounted, ref, computed } from 'vue'
import { usePromocaoStore } from '@/stores/promocaoStore' 

const promocaoStore = usePromocaoStore()

// --- ESTADO DE CONTROLE ---
const formAberto = ref(false) 
const itemIndexToEdit = ref(null) // Para saber qual produto na lista está sendo editado

// Opções de Desconto
const DESCONTO_OPTIONS = [
    { value: 'P', label: 'Percentual (%)' },
    { value: 'V', label: 'Valor Fixo (R$)' },
];

// --- ESTADO DO FORMULÁRIO (Mestre) ---
const defaultPromocao = { 
    id: null, 
    nome: '', 
    descricao: null,
    tipo_desconto: 'P',
    valor_desconto: 0.00,
    data_inicio: null,
    data_fim: null,
    ativo: true,
    produtos: [], // Array de ProdutoPromocao
}
const promocao = reactive({ ...defaultPromocao })

// --- ESTADO DO ITEM (Detalhe) ---
const defaultProdutoItem = {
    produto: null, // FK ID
    preco_promocional: 0.00,
}
const produtoAtual = reactive({ ...defaultProdutoItem })

// --- COMPUTED PROPERTY ---
// Busca o preço de venda do produto selecionado para referência
const precoVendaReferencia = computed(() => {
    const produtoSelecionado = promocaoStore.produtosDisponiveis.find(p => p.id === produtoAtual.produto);
    return Number(produtoSelecionado?.preco_venda || 0).toFixed(2);
});

// Checa se o campo é vazio (string vazia ou null)
function isFieldEmpty(value) {
    if (typeof value === 'string') return value.trim() === '';
    return value === null || value === undefined;
}


// --- CICLO DE VIDA E FUNÇÕES BÁSICAS ---
onMounted(async () => {
    await Promise.all([
        promocaoStore.getPromocoes(),
        promocaoStore.loadDependencies()
    ]);
})

function limpar() {
    Object.assign(promocao, { ...defaultPromocao })
    Object.assign(produtoAtual, { ...defaultProdutoItem })
    itemIndexToEdit.value = null;
    formAberto.value = false
}

// --- Funções de Gestão de Produtos (Itens da Promoção) ---

function adicionarOuAtualizarProduto() {
    if (!produtoAtual.produto || produtoAtual.preco_promocional === 0) {
        alert("Selecione o Produto e defina um Preço Promocional válido.");
        return;
    }

    const produtoSelecionado = promocaoStore.produtosDisponiveis.find(p => p.id === produtoAtual.produto);

    if (!produtoSelecionado) {
        alert("Produto inválido selecionado.");
        return;
    }

    const novoProduto = {
        ...produtoAtual,
        // Adiciona o nome para exibição na lista (Read-Only)
        produto_nome: produtoSelecionado.nome,
    };

    if (itemIndexToEdit.value !== null) {
        // Atualiza item existente
        promocao.produtos.splice(itemIndexToEdit.value, 1, novoProduto);
    } else {
        // Adiciona novo item
        // Checagem de unicidade (prevenção de duplicatas)
        const exists = promocao.produtos.some(p => p.produto === novoProduto.produto);
        if (exists) {
            alert(`O produto "${novoProduto.produto_nome}" já está nesta promoção.`);
            return;
        }
        promocao.produtos.push(novoProduto);
    }

    // Limpa o item atual para o próximo
    Object.assign(produtoAtual, { ...defaultProdutoItem });
    itemIndexToEdit.value = null;
}

function editarProduto(item, index) {
    Object.assign(produtoAtual, item);
    itemIndexToEdit.value = index;
}

function removerProduto(index) {
    if (confirm("Tem certeza que deseja remover este produto da promoção?")) {
        promocao.produtos.splice(index, 1);
    }
}

// --- Funções de CRUD da Promoção ---

async function salvar() {
    if (isFieldEmpty(promocao.nome) || isFieldEmpty(promocao.valor_desconto) || !promocao.data_inicio || !promocao.data_fim) 
    {
        alert("Nome, Valor do Desconto, Data de Início e Data de Fim são obrigatórios.")
        return
    }

    // Validação de datas:
    if (new Date(promocao.data_inicio) >= new Date(promocao.data_fim)) {
        alert("A Data de Fim deve ser posterior à Data de Início.")
        return
    }
    
    const dadosParaEnviar = { ...promocao };
    
    // Tratamento de campos opcionais nulos (descricao)
    if (isFieldEmpty(dadosParaEnviar.descricao)) { dadosParaEnviar.descricao = null; }

    // O Serializer faz a conversão de Decimal/Datas
    // O Serializer também cuida de inserir o array `produtos` aninhado

    await promocaoStore.salvarPromocao(dadosParaEnviar)
    limpar()
}

function editar(promocao_para_editar) {
    // Formatação das datas para o input type="datetime-local" (se usar no template)
    // O DRF geralmente espera o formato ISO. Usaremos o formato substring para garantir compatibilidade com input type="datetime-local" se ele for usado.
    const inicioFormatado = promocao_para_editar.data_inicio ? promocao_para_editar.data_inicio.substring(0, 16) : null;
    const fimFormatado = promocao_para_editar.data_fim ? promocao_para_editar.data_fim.substring(0, 16) : null;
    
    Object.assign(promocao, { 
        ...promocao_para_editar,
        data_inicio: inicioFormatado,
        data_fim: fimFormatado,
    })
    formAberto.value = true
}

async function excluir(id) {
    if (confirm("Tem certeza que deseja excluir esta Promoção?")) {
        await promocaoStore.excluirPromocao(id)
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
    <h1>Gestão de Promoções</h1>

    <div class="form-toggle">
        <button 
            @click="toggleForm"
            :class="{ 'cancelar': formAberto }"
        >
            {{ promocao.id ? 'Editar Promoção' : formAberto ? 'Fechar Formulário' : 'Nova Promoção' }}
        </button>
    </div>

    <form class="form-container" @submit.prevent="salvar" v-if="formAberto">
      <h2>{{ promocao.id ? `Editar Promoção #${promocao.id}` : 'Nova Promoção' }}</h2>

      <section>
        <h3>Configuração</h3>
        <div class="form-group-grid" style="grid-template-columns: 2fr 1fr 1fr 1fr;">
            <div>
                <label for="nome">Nome da Promoção*</label>
                <input id="nome" type="text" v-model="promocao.nome" required placeholder="Ex: Liquidação de Inverno" />
            </div>
            <div>
                <label for="tipoDesconto">Tipo de Desconto*</label>
                <select id="tipoDesconto" v-model="promocao.tipo_desconto" required>
                    <option v-for="d in DESCONTO_OPTIONS" :key="d.value" :value="d.value">
                        {{ d.label }}
                    </option>
                </select>
            </div>
            <div>
                <label for="valorDesconto">Valor/Percentual*</label>
                <input id="valorDesconto" type="number" step="0.01" v-model.number="promocao.valor_desconto" required placeholder="Ex: 10.00" />
            </div>
            <div class="checkbox-group">
                <input id="ativo" type="checkbox" v-model="promocao.ativo" />
                <label for="ativo" class="inline-label">Ativa</label>
            </div>
        </div>

        <div class="form-group-grid" style="grid-template-columns: 1fr 1fr;">
            <div>
                <label for="dataInicio">Data de Início*</label>
                <input id="dataInicio" type="datetime-local" v-model="promocao.data_inicio" required />
            </div>
            <div>
                <label for="dataFim">Data de Fim*</label>
                <input id="dataFim" type="datetime-local" v-model="promocao.data_fim" required />
            </div>
        </div>
      </section>

      <section>
        <h3>Produtos em Promoção</h3>
        
        <div class="form-group-grid item-input-row" style="grid-template-columns: 2fr 1fr 1fr 1fr 50px;">
            <div>
                <label for="produtoItem">Produto</label>
                <select id="produtoItem" v-model="produtoAtual.produto">
                    <option :value="null" disabled>Selecione um Produto</option>
                    <option v-for="p in promocaoStore.produtosDisponiveis" :key="p.id" :value="p.id">
                        {{ p.nome }}
                    </option>
                </select>
            </div>
            <div>
                <label>Preço Venda (Ref.)</label>
                <input type="text" :value="precoVendaReferencia" disabled class="subtotal-input" />
            </div>
            <div>
                <label for="precoPromocional">Preço Promocional*</label>
                <input id="precoPromocional" type="number" step="0.01" v-model.number="produtoAtual.preco_promocional" placeholder="0.00" />
            </div>
            <div>
                </div>
            <div class="action-item-button">
                <button type="button" @click="adicionarOuAtualizarProduto" :disabled="!produtoAtual.produto">
                    {{ itemIndexToEdit !== null ? '🖊️' : '➕' }}
                </button>
            </div>
        </div>

        <table v-if="promocao.produtos.length > 0" class="produtos-aninhados">
            <thead>
                <tr>
                    <th>Produto</th>
                    <th>Preço Promocional</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in promocao.produtos" :key="index">
                    <td>{{ item.produto_nome }}</td>
                    <td>R$ {{ Number(item.preco_promocional).toFixed(2) }}</td>
                    <td>
                        <button type="button" @click="editarProduto(item, index)" class="editar-item">Editar</button>
                        <button type="button" @click="removerProduto(index)" class="remover-item">Remover</button>
                    </td>
                </tr>
            </tbody>
        </table>
        <p v-else class="alerta-vazio">Adicione produtos a esta promoção.</p>
      </section>
      
      <div class="form-group-full">
        <div>
            <label for="descricao">Observações/Descrição</label>
            <textarea id="descricao" v-model="promocao.descricao"></textarea>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="promocaoStore.isLoading">
          {{ promocao.id ? 'Atualizar' : 'Salvar' }} Promoção
        </button>
        <button type="button" @click="limpar" class="cancelar" :disabled="promocaoStore.isLoading">
          Cancelar
        </button>
      </div>
    </form>
    
    <hr>
    
    <div v-if="promocaoStore.isLoading" class="loading-message">
        Carregando promoções...
    </div>

    <ul class="promocao-list" v-else>
      <li v-for="p in promocaoStore.promocoes" :key="p.id" :class="{ 'promocao-inativa': !p.promocao_ativa }">
        <span class="promocao-info" @click="editar(p)">
          <span class="id-tag">#{{ p.id }}</span>
          <strong>{{ p.nome }}</strong> 
          <span class="desconto-tag">{{ p.tipo_desconto_display }}: {{ Number(p.valor_desconto).toFixed(2) }} {{ p.tipo_desconto === 'P' ? '%' : 'R$' }}</span>
          <span class="status-tag">{{ p.promocao_ativa ? 'ATIVA' : 'INATIVA' }}</span>
          <span class="periodo">Início: {{ p.data_inicio }} | Fim: {{ p.data_fim }}</span>
        </span>
        <div class="actions">
          <button @click="editar(p)" class="editar">Editar</button>
          <button @click="excluir(p.id)" class="excluir">Excluir</button>
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
  --danger-color: #e74c3c; /* Red for Delete/Inativo */
  --active-color: #27ae60; /* Green for Ativa */
  --low-stock-color: #f39c12; /* Yellow/Orange */
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

/* Grid Básico (aplicável à maioria das seções) */
.form-group-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
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

/* Estilo para campo de referência desabilitado */
.subtotal-input {
    background-color: #f0f4f9;
    font-weight: 600;
    color: var(--secondary-color);
}

/* Checkbox e Label Inline */
.checkbox-group {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 15px; 
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

/* --- Layout da Linha de Item Dinâmica --- */
.item-input-row {
    margin-bottom: 25px !important;
    padding: 15px;
    background-color: #e6eef6; /* Fundo leve para o input de item */
    border-radius: 8px;
}
.action-item-button {
    display: flex;
    align-items: flex-end;
    padding-bottom: 0;
}
.action-item-button button {
    height: 40px; 
    width: 100%;
    font-size: 1.2rem;
    line-height: 1;
    padding: 0;
    background-color: var(--active-color);
}


/* --- Tabela de Produtos Aninhados --- */
.produtos-aninhados {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}
.produtos-aninhados th, .produtos-aninhados td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
}
.produtos-aninhados th {
    background-color: #f7f9fb;
    color: var(--secondary-color);
    font-size: 0.95rem;
}
.produtos-aninhados td {
    font-size: 0.95rem;
}

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

button:hover:not(:disabled) { background-color: #358a66; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); transform: translateY(-1px); }
button.cancelar { background-color: #95a5a6; text-transform: none; }
button.cancelar:hover:not(:disabled) { background-color: #7f8c8d; }
button:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
hr { border: 0; height: 1px; background-image: linear-gradient(to right, rgba(0, 0, 0, 0), var(--border-color), rgba(0, 0, 0, 0)); margin: 30px 0; }

/* --- Lista de Promoções (.promocao-list) --- */
.loading-message { text-align: center; color: var(--primary-color); font-size: 1.2rem; font-weight: 600; margin: 30px 0; animation: pulse 1.5s infinite; }
@keyframes pulse { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }

.promocao-list { list-style: none; padding: 0; display: grid; gap: 10px; }
.promocao-list li {
  display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; 
  background-color: var(--white); border: 1px solid var(--border-color);
  border-left: 6px solid var(--active-color);
  border-radius: 8px; box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05); transition: box-shadow 0.3s, transform 0.3s;
}
.promocao-list li:hover { box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1); transform: translateY(-2px); }

/* Estilos de Status */
.promocao-list li.promocao-inativa {
  border-left-color: var(--danger-color);
  opacity: 0.7;
}

.promocao-info { flex-grow: 1; cursor: pointer; display: flex; align-items: center; color: var(--secondary-color); gap: 15px; }
.promocao-info strong { font-size: 1.15rem; margin-right: 15px; color: #2c3e50; }
.id-tag { background-color: #ecf0f1; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; margin-right: 15px; color: #7f8c8d; font-weight: 700; }

.desconto-tag {
    font-size: 1rem;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 5px;
    background-color: #e0f2f1; /* Fundo suave */
    color: var(--primary-color);
}
.status-tag {
    font-size: 0.85rem;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 4px;
    background-color: var(--active-color);
    color: var(--white);
    margin-left: 10px;
}
.promocao-inativa .status-tag {
    background-color: var(--danger-color);
}
.periodo {
    font-size: 0.9rem;
    color: #7f8c8d;
    margin-left: auto;
}

/* --- Paginação (Padrão) --- */
.paginator { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 40px; font-size: 1.1rem; color: var(--secondary-color); font-weight: 500; }
.paginator button { padding: 8px 18px; font-size: 1rem; background-color: #ecf0f1; color: var(--secondary-color); box-shadow: none; text-transform: none; }
.paginator button:hover:not(:disabled) { background-color: #bdc3c7; transform: none; box-shadow: none; }
</style>