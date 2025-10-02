<script setup>
import { reactive, onMounted, ref } from 'vue'
import { useCargoStore } from '@/stores/cargoStore'

const cargoStore = useCargoStore()

// --- ESTADO DE CONTROLE DE VISIBILIDADE E DADOS ---
const formAberto = ref(false)

const defaultCargo = {
    id: null,
    nome: '',
    descricao: '',
    salario_base: 0.00,
    comissao_percentual: 0.00,
    ativo: true,
}
const cargo = reactive({ ...defaultCargo })

onMounted(async () => {
    await cargoStore.getCargos()
})

// --- Funções de Ação ---
function limpar() {
    Object.assign(cargo, { ...defaultCargo })
    formAberto.value = false
}

async function salvar() {
    if (!cargo.nome.trim() || cargo.salario_base === null) {
        alert("O Nome e o Salário Base são obrigatórios.")
        return
    }

    // ATENÇÃO: Enviar uma cópia limpa garante que o store/API receba apenas os dados
    await cargoStore.salvarCargo({ ...cargo })
    limpar()
}

function editar(cargo_para_editar) {
    Object.assign(cargo, cargo_para_editar)
    formAberto.value = true // Abre o formulário
}

async function excluir(id) {
    if (confirm("Tem certeza que deseja excluir este cargo?")) {
        await cargoStore.excluirCargo(id)
        limpar()
    }
}

function toggleForm() {
    if (formAberto.value) {
        limpar(); // Reseta os campos e fecha
    } else {
        formAberto.value = true; // Abre o formulário
    }
}
</script>

<template>
    <div class="container">
        <h1>Gerenciamento de Cargos</h1>

        <div class="form-toggle">
            <button @click="toggleForm" :class="{ 'cancelar': formAberto }">
                {{ formAberto ? 'Fechar Formulário' : 'Novo Cargo / Editar' }}
            </button>
        </div>

        <form class="form-container" @submit.prevent="salvar" v-if="formAberto">
            <h2>{{ cargo.id ? 'Editar Cargo' : 'Novo Cargo' }}</h2>

            <div class="form-group-grid">
                <div>
                    <label for="nome">Nome do Cargo*</label>
                    <input id="nome" type="text" v-model="cargo.nome" required placeholder="Ex: Gerente de Vendas" />
                </div>
                <div>
                    <label for="salarioBase">Salário Base*</label>
                    <input id="salarioBase" type="number" step="0.01" v-model.number="cargo.salario_base" required
                        placeholder="Ex: 5000.00" />
                </div>
                <div>
                    <label for="comissaoPercentual">Comissão (%)</label>
                    <input id="comissaoPercentual" type="number" step="0.01" v-model.number="cargo.comissao_percentual"
                        placeholder="Ex: 5.00" />
                </div>

                <div class="checkbox-group">
                    <input id="ativo" type="checkbox" v-model="cargo.ativo" />
                    <label for="ativo" class="inline-label">Cargo Ativo</label>
                </div>
            </div>

            <div class="form-group-full">
                <div>
                    <label for="descricao">Descrição</label>
                    <textarea id="descricao" v-model="cargo.descricao"
                        placeholder="Detalhes e responsabilidades do cargo."></textarea>
                </div>
            </div>

            <div class="form-actions">
                <button type="submit" :disabled="cargoStore.isLoading">
                    {{ cargo.id ? 'Atualizar' : 'Salvar' }} Cargo
                </button>
                <button type="button" @click="limpar" class="cancelar" :disabled="cargoStore.isLoading">
                    Cancelar
                </button>
            </div>
        </form>

        <hr>

        <div v-if="cargoStore.isLoading" class="loading-message">
            Carregando cargos...
        </div>

        <ul class="cargo-list" v-else>
            <li v-for="c in cargoStore.cargos" :key="c.id" :class="{ 'cargo-inativo': !c.ativo }">
                <span class="cargo-info" @click="editar(c)">
                    <span class="id-tag">#{{ c.id }}</span>
                    <strong>{{ c.nome }}</strong>

                    <span class="descricao">
                        Salário: R$ {{ Number(c.salario_base || 0).toFixed(2) }}
                        | Comissão: {{ Number(c.comissao_percentual || 0).toFixed(2) }}%
                    </span>
                </span>
                <div class="actions">
                    <button @click="editar(c)" class="editar">Editar</button>
                    <button @click="excluir(c.id)" class="excluir">Excluir</button>
                </div>
            </li>
        </ul>

        <div class="paginator" v-if="cargoStore.meta.total_pages > 1">
            <button :disabled="cargoStore.meta.page <= 1 || cargoStore.isLoading" @click="cargoStore.paginaAnterior">
                Anterior
            </button>
            <span>Página {{ cargoStore.meta.page }} de {{ cargoStore.meta.total_pages }}</span>
            <button :disabled="cargoStore.meta.page >= cargoStore.meta.total_pages || cargoStore.isLoading"
                @click="cargoStore.proximaPagina">
                Próxima
            </button>
        </div>
    </div>
</template>

<style scoped>
/* Variáveis para fácil manutenção de cores */
:root {
    --primary-color: #41b883;
    /* Vue Green */
    --secondary-color: #34495e;
    /* Dark Blue/Gray */
    --accent-color: #3498db;
    /* Blue for Edit */
    --danger-color: #e74c3c;
    /* Red for Delete */
    --light-bg: #f7f9fb;
    --white: #ffffff;
    --border-color: #e0e0e0;
}

.container {
    max-width: 900px;
    margin: 40px auto;
    padding: 40px;
    background-color: var(--white);
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* --- Títulos --- */
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

h3 {
    /* Estilo para títulos de seção, se aplicável */
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

/* --- Formulário Geral --- */
.form-container {
    padding: 25px;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    margin-bottom: 30px;
    background-color: var(--light-bg);
}

/* Layout de Grid para os campos */
.form-group-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.form-group-full {
    display: flex;
    gap: 15px;
    margin-top: 15px;
}

.form-group-full>div {
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
input[type='text'],
input[type='number'],
select,
textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 14px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s, box-shadow 0.3s;
    background-color: var(--white);
}

input[type='text']:focus,
input[type='number']:focus,
select:focus,
textarea:focus {
    border-color: var(--primary-color);
    outline: none;
    box-shadow: 0 0 0 3px rgba(65, 184, 131, 0.2);
}

/* Checkbox e Label Inline */
.checkbox-group {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 25px;
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

/* --- Ações e Botões --- */
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

button:hover:not(:disabled) {
    background-color: #358a66;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
}

button.cancelar {
    background-color: #95a5a6;
    text-transform: none;
}

button.cancelar:hover:not(:disabled) {
    background-color: #7f8c8d;
}

button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
}

hr {
    border: 0;
    height: 1px;
    background-image: linear-gradient(to right, rgba(0, 0, 0, 0), var(--border-color), rgba(0, 0, 0, 0));
    margin: 30px 0;
}

/* --- Lista e Itens (.cargo-list) --- */
.loading-message {
    text-align: center;
    color: var(--primary-color);
    font-size: 1.2rem;
    font-weight: 600;
    margin: 30px 0;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% {
        opacity: 0.8;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: 0.8;
    }
}

.cargo-list {
    /* Estilo da lista principal */
    list-style: none;
    padding: 0;
    display: grid;
    gap: 10px;
}

.cargo-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 20px;
    background-color: var(--white);
    border: 1px solid var(--border-color);
    border-left: 6px solid var(--accent-color);
    border-radius: 8px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.3s, transform 0.3s;
}

.cargo-list li:hover {
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.cargo-list li.cargo-inativo {
    border-left-color: var(--danger-color);
    opacity: 0.7;
}

.cargo-info {
    flex-grow: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: var(--secondary-color);
    gap: 15px;
}

.cargo-info strong {
    font-size: 1.15rem;
    margin-right: 15px;
    color: #2c3e50;
}

.id-tag {
    background-color: #ecf0f1;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.85rem;
    margin-right: 15px;
    color: #7f8c8d;
    font-weight: 700;
}

.descricao {
    font-size: 1rem;
    color: #555;
    max-width: 400px;
}

.actions button {
    margin-left: 10px;
    padding: 8px 15px;
    font-size: 0.95rem;
    text-transform: none;
}

.actions .editar {
    background-color: var(--accent-color);
}

.actions .editar:hover {
    background-color: #2980b9;
}

.actions .excluir {
    background-color: var(--danger-color);
}

.actions .excluir:hover {
    background-color: #c0392b;
}

/* --- Paginação --- */
.paginator {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-top: 40px;
    font-size: 1.1rem;
    color: var(--secondary-color);
    font-weight: 500;
}

.paginator button {
    padding: 8px 18px;
    font-size: 1rem;
    background-color: #ecf0f1;
    color: var(--secondary-color);
    box-shadow: none;
    text-transform: none;
}

.paginator button:hover:not(:disabled) {
    background-color: #bdc3c7;
    transform: none;
    box-shadow: none;
}
</style>