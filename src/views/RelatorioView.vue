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