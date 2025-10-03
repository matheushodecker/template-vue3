<script setup>
import { reactive, onMounted, ref } from 'vue'
import { useRelatorioStore } from '@/stores/relatorioStore'

const relatorioStore = useRelatorioStore()

// --- ESTADO DE CONTROLE ---
const abaAtiva = ref('vendas') 
const formAberto = ref(false) 

// --- ESTADO DO FORMULÁRIO (Vendas) ---
const defaultRelatorioVenda = { 
    nome: '', 
    data_inicio: null,
    data_fim: null,
    funcionario_gerador: null, // FK ID
    observacoes: null,
}
const relatorioVenda = reactive({ ...defaultRelatorioVenda })

// --- ESTADO DO FORMULÁRIO (Estoque) ---
const defaultRelatorioEstoque = { 
    nome: '', 
    funcionario_gerador: null, // FK ID
    observacoes: null,
}
const relatorioEstoque = reactive({ ...defaultRelatorioEstoque })


// --- CICLO DE VIDA E FUNÇÕES BÁSICAS ---
onMounted(async () => {
    // A ordem é importante, pois o getRelatoriosVenda pode estar falhando
    await Promise.all([
        relatorioStore.loadDependencies(),
        relatorioStore.getRelatoriosVenda(),
        relatorioStore.getRelatoriosEstoque(),
    ]);
})

function mudarAba(aba) {
    abaAtiva.value = aba;
    formAberto.value = false; // Fecha o formulário ao mudar de aba
    limpar(); // Reseta os dados (e o formAberto)
}

function limpar() {
    Object.assign(relatorioVenda, { ...defaultRelatorioVenda })
    Object.assign(relatorioEstoque, { ...defaultRelatorioEstoque })
    formAberto.value = false
}

// Função auxiliar para checar se o campo está vazio
function isFieldEmpty(value) {
    if (typeof value === 'string') return value.trim() === '';
    return value === null || value === undefined;
}

// --- Funções de Geração (Mantidas) ---

async function gerarRelatorio() {
    if (abaAtiva.value === 'vendas') {
        if (isFieldEmpty(relatorioVenda.nome) || isFieldEmpty(relatorioVenda.data_inicio) || isFieldEmpty(relatorioVenda.data_fim) || !relatorioVenda.funcionario_gerador) 
        {
            alert("Nome, Datas (Início e Fim) e Funcionário são obrigatórios para o Relatório de Vendas.")
            return
        }
        
        const dados = { ...relatorioVenda };
        dados.observacoes = isFieldEmpty(dados.observacoes) ? null : dados.observacoes;

        await relatorioStore.gerarRelatorioVenda(dados);

    } else if (abaAtiva.value === 'estoque') {
        if (isFieldEmpty(relatorioEstoque.nome) || !relatorioEstoque.funcionario_gerador) 
        {
            alert("Nome e Funcionário são obrigatórios para o Relatório de Estoque.")
            return
        }
        
        const dados = { ...relatorioEstoque };
        dados.observacoes = isFieldEmpty(dados.observacoes) ? null : dados.observacoes;
        
        await relatorioStore.gerarRelatorioEstoque(dados);
    }
    limpar();
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
    <h1>Gerenciamento de Relatórios</h1>

    <div class="tabs-navigation">
        <button :class="{ active: abaAtiva === 'vendas' }" @click="mudarAba('vendas')">
            Relatórios de Vendas
        </button>
        <button :class="{ active: abaAtiva === 'estoque' }" @click="mudarAba('estoque')">
            Relatórios de Estoque
        </button>
    </div>
    
    <hr class="tab-divider" />

    <div class="form-toggle">
        <button 
            @click="toggleForm"
            :class="{ 'cancelar': formAberto }"
        >
            {{ formAberto ? 'Cancelar Geração' : 'Gerar Novo Relatório' }}
        </button>
    </div>

    <form class="form-container" @submit.prevent="gerarRelatorio" v-if="formAberto">
        <h2>Gerar Relatório de {{ abaAtiva === 'vendas' ? 'Vendas' : 'Estoque' }}</h2>

        <div v-if="abaAtiva === 'vendas'">
            <div class="form-group-grid" style="grid-template-columns: 2fr 1fr 1fr;">
                <div>
                    <label for="nomeVenda">Nome do Relatório*</label>
                    <input id="nomeVenda" type="text" v-model="relatorioVenda.nome" required placeholder="Ex: Vendas 3º Trimestre" />
                </div>
                <div>
                    <label for="dataInicio">Data de Início*</label>
                    <input id="dataInicio" type="date" v-model="relatorioVenda.data_inicio" required />
                </div>
                <div>
                    <label for="dataFim">Data de Fim*</label>
                    <input id="dataFim" type="date" v-model="relatorioVenda.data_fim" required />
                </div>
            </div>
            <div class="form-group-grid" style="grid-template-columns: 1fr 2fr;">
                <div>
                    <label for="funcionarioGeradorVenda">Funcionário*</label>
                    <select id="funcionarioGeradorVenda" v-model="relatorioVenda.funcionario_gerador" required>
                        <option :value="null" disabled>Selecione</option>
                        <option v-for="f in relatorioStore.funcionariosDisponiveis" :key="f.id" :value="f.id">
                            {{ f.nome }}
                        </option>
                    </select>
                </div>
                <div>
                    <label for="observacoesVenda">Observações</label>
                    <textarea id="observacoesVenda" v-model="relatorioVenda.observacoes"></textarea>
                </div>
            </div>
        </div>
        
        <div v-else-if="abaAtiva === 'estoque'">
            <div class="form-group-grid" style="grid-template-columns: 1fr 1fr;">
                <div>
                    <label for="nomeEstoque">Nome do Relatório*</label>
                    <input id="nomeEstoque" type="text" v-model="relatorioEstoque.nome" required placeholder="Ex: Inventário Mensal de Estoque" />
                </div>
                <div>
                    <label for="funcionarioGeradorEstoque">Funcionário*</label>
                    <select id="funcionarioGeradorEstoque" v-model="relatorioEstoque.funcionario_gerador" required>
                        <option :value="null" disabled>Selecione</option>
                        <option v-for="f in relatorioStore.funcionariosDisponiveis" :key="f.id" :value="f.id">
                            {{ f.nome }}
                        </option>
                    </select>
                </div>
            </div>
            <div class="form-group-full">
                <div>
                    <label for="observacoesEstoque">Observações</label>
                    <textarea id="observacoesEstoque" v-model="relatorioEstoque.observacoes"></textarea>
                </div>
            </div>
        </div>

        <div class="form-actions">
            <button type="submit" :disabled="relatorioStore.isLoading">
                Gerar e Salvar Relatório
            </button>
            <button type="button" @click="limpar" class="cancelar" :disabled="relatorioStore.isLoading">
                Limpar
            </button>
        </div>
    </form>

    <hr v-if="!formAberto" />
    
    <div v-if="relatorioStore.isLoading" class="loading-message">
        Carregando histórico de relatórios...
    </div>
    
    <p v-if="abaAtiva === 'vendas' && relatorioStore.erroVenda" class="alerta-erro">
        {{ relatorioStore.erroVenda }}
    </p>

    <ul class="relatorio-list" v-else>
        <template v-if="abaAtiva === 'vendas'">
            <li v-for="r in relatorioStore.relatoriosVenda" :key="r.id" class="relatorio-venda">
                <span class="relatorio-info">
                    <span class="id-tag">#{{ r.id }}</span>
                    <strong>{{ r.nome }}</strong>
                    <span class="total-vendas">Total: R$ {{ Number(r.total_vendas || 0).toFixed(2) }}</span>
                    <span class="ticket-medio">Ticket Médio: R$ {{ Number(r.ticket_medio || 0).toFixed(2) }}</span>
                    <span class="periodo">{{ r.data_inicio }} a {{ r.data_fim }}</span>
                </span>
                <div class="actions">
                    <span class="data-geracao">Gerado por {{ r.funcionario_gerador_nome }} em {{ r.data_geracao }}</span>
                </div>
            </li>
        </template>
        
        <template v-else-if="abaAtiva === 'estoque'">
            <li v-for="r in relatorioStore.relatoriosEstoque" :key="r.id" class="relatorio-estoque">
                <span class="relatorio-info">
                    <span class="id-tag">#{{ r.id }}</span>
                    <strong>{{ r.nome }}</strong>
                    <span class="total-produtos">Produtos: {{ r.total_produtos }}</span>
                    <span class="estoque-baixo-alerta">Baixo Estoque: {{ r.produtos_estoque_baixo }}</span>
                    <span class="valor-estoque">Valor Total: R$ {{ Number(r.valor_total_estoque || 0).toFixed(2) }}</span>
                </span>
                <div class="actions">
                    <span class="data-geracao">Gerado por {{ r.funcionario_gerador_nome }} em {{ r.data_geracao }}</span>
                </div>
            </li>
        </template>
    </ul>
    
    <p v-if="!relatorioStore.isLoading && ((abaAtiva === 'vendas' && relatorioStore.relatoriosVenda.length === 0) || (abaAtiva === 'estoque' && relatorioStore.relatoriosEstoque.length === 0))" class="alerta-vazio-lista">
        Nenhum relatório salvo encontrado.
    </p>


  </div>
</template>

<style scoped>
/* Variáveis para fácil manutenção de cores */
:root {
  --primary-color: #41b883; /* Vue Green */
  --secondary-color: #34495e; /* Dark Blue/Gray */
  --accent-color: #3498db; /* Blue for Edit */
  --danger-color: #e74c3c; /* Red */
  --success-color: #2ecc71; /* Green para Totais */
  --low-stock-color: #f39c12; /* Yellow/Orange (Estoque Baixo) */
  --light-bg: #f7f9fb;
  --white: #ffffff;
  --border-color: #e0e0e0;
}

.container {
  max-width: 1000px;
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

/* --- Navegação por Abas --- */
.tabs-navigation {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
}
.tabs-navigation button {
    padding: 10px 20px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background-color: var(--white);
    color: var(--secondary-color);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: none;
    box-shadow: none;
}
.tabs-navigation button.active {
    background-color: var(--primary-color);
    color: var(--white);
    border-color: var(--primary-color);
}
.tabs-navigation button:hover:not(.active) {
    background-color: #f0f0f0;
}
.tab-divider {
    margin-top: 0;
    margin-bottom: 25px;
}


/* --- Toggle Button --- */
.form-toggle {
    margin-bottom: 25px;
    text-align: right;
}
.form-toggle button {
    text-transform: none; 
}

/* --- Formulário de Geração --- */
.form-container {
  padding: 25px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  margin-bottom: 30px;
  background-color: var(--light-bg);
}

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

/* --- Lista de Relatórios (.relatorio-list) --- */
.loading-message { text-align: center; color: var(--primary-color); font-size: 1.2rem; font-weight: 600; margin: 30px 0; animation: pulse 1.5s infinite; }

.relatorio-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 10px;
}

.relatorio-list li {
  display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; 
  background-color: var(--white); border: 1px solid var(--border-color);
  border-left: 6px solid var(--primary-color);
  border-radius: 8px; box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05); transition: box-shadow 0.3s, transform 0.3s;
}

.relatorio-list li:hover { box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1); transform: translateY(-2px); }

/* Estilo para relatórios de venda (borda verde primária) */
.relatorio-venda {
    border-left-color: var(--primary-color) !important;
}
/* Estilo para relatórios de estoque (borda azul de destaque) */
.relatorio-estoque {
    border-left-color: var(--accent-color) !important;
}


.relatorio-info {
  flex-grow: 1; cursor: default; display: flex; align-items: center; color: var(--secondary-color); gap: 15px;
}

.relatorio-info strong { font-size: 1.15rem; margin-right: 15px; color: #2c3e50; }
.id-tag { background-color: #ecf0f1; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; margin-right: 15px; color: #7f8c8d; font-weight: 700; }

/* Destaque para os Totais */
.total-vendas, .valor-estoque {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--success-color);
}
.ticket-medio {
    font-size: 0.95rem;
    color: #7f8c8d;
}

/* Alerta de Estoque Baixo (vermelho/laranja) */
.estoque-baixo-alerta {
    font-size: 1rem;
    font-weight: 700;
    color: var(--low-stock-color);
    background-color: #fef0cd;
    padding: 3px 8px;
    border-radius: 4px;
}

.periodo, .data-geracao {
    font-size: 0.9rem;
    color: #7f8c8d;
    margin-left: auto;
}
.relatorio-info .periodo {
    margin-left: 15px;
}
.actions .data-geracao {
    font-size: 0.95rem;
    font-style: italic;
    color: var(--secondary-color);
}

.alerta-vazio-lista {
    text-align: center;
    padding: 20px;
    color: #7f8c8d;
    font-style: italic;
}

/* --- NOVO ESTILO: Bloco de Erro da API --- */
.alerta-erro {
    color: var(--danger-color);
    background-color: #f8d7da;
    border: 1px solid var(--danger-color);
    padding: 15px;
    border-radius: 8px;
    font-weight: 600;
    margin-bottom: 20px;
    text-align: center;
}

/* --- Paginação (Padrão) --- */
.paginator { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 40px; font-size: 1.1rem; color: var(--secondary-color); font-weight: 500; }
.paginator button { padding: 8px 18px; font-size: 1rem; background-color: #ecf0f1; color: var(--secondary-color); box-shadow: none; text-transform: none; }
.paginator button:hover:not(:disabled) { background-color: #bdc3c7; transform: none; box-shadow: none; }
</style>