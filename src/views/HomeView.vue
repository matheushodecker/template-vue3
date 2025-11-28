<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProdutoStore } from '@/stores/produtoStore'
import { useVendaStore } from '@/stores/vendaStore'
import { useAuthStore } from '../stores/auth'
const router = useRouter()
const produtoStore = useProdutoStore()
const vendaStore = useVendaStore()
const authStore = useAuthStore()
const metricas = ref({
  vendasHoje: 0,
  totalVendasHoje: 0,
  produtosBaixoEstoque: 0,
  vendasPendentes: 0
})
const produtosBaixoEstoque = ref([])
const vendasRecentes = ref([])
const isLoading = ref(true)
const saudacao = computed(() => {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
})

// ATUALIZADO AQUI
onMounted(async () => {
  isLoading.value = true
  try {
    await Promise.all([
      // Alterado de getProdutos(1,...) para getProdutosTodos()
      // Isso garante que as métricas do dashboard sejam calculadas 
      // com base em TODOS os produtos, não apenas na página 1.
      authStore.setToken(localStorage.getItem('psg_auth_token')),
      produtoStore.getProdutosTodos({ ordering: '-id' }),
      
      vendaStore.getVendas()
    ])
    // calcularMetricas agora usará a lista completa de produtos
    calcularMetricas()
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error)
  } finally {
    isLoading.value = false
  }
})

function calcularMetricas() {
  // Agora 'todosProdutos' contém a lista completa graças ao getProdutosTodos()
  const todosProdutos = produtoStore.produtos
  const todasVendas = vendaStore.vendas
  
  // Métrica de Estoque Baixo (agora correta)
  produtosBaixoEstoque.value = todosProdutos
    .filter(p => p.ativo && p.estoque_atual <= p.estoque_minimo)
  
  metricas.value.produtosBaixoEstoque = produtosBaixoEstoque.value.length

  // Métricas de Vendas
  const hoje = new Date().toISOString().split('T')[0]
  const vendasHoje = todasVendas.filter(v => {
    const dataVenda = v.data_venda?.split('T')[0]
    return dataVenda === hoje && v.status === 'finalizada' // Apenas finalizadas
  })
  
  metricas.value.vendasHoje = vendasHoje.length
  metricas.value.totalVendasHoje = vendasHoje.reduce((sum, v) => sum + Number(v.total || 0), 0)
  metricas.value.vendasPendentes = todasVendas.filter(v => v.status === 'pendente').length
  
  // Listas
  vendasRecentes.value = todasVendas.slice(0, 5)
  produtosBaixoEstoque.value = produtosBaixoEstoque.value.slice(0, 5) // Limita a lista da UI
}

function navegarPara(rota) {
  router.push({ name: rota })
}
function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
</script>

<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>{{ saudacao }}! 👋</h1>
      <p class="subtitle">Bem-vindo ao painel de gestão do Mercadinho Loschicos.</p>
    </div>

    <div v-if="isLoading" class="loading-message">
      Carregando dashboard...
    </div>

    <div v-else class="dashboard-content">
      <section class="metricas-grid">
        <div class="metrica-card" @click="navegarPara('venda')">
          <div class="metrica-icon icon-vendas">💰</div>
          <div class="metrica-info">
            <p class="metrica-valor">{{ formatCurrency(metricas.totalVendasHoje) }}</p>
            <h3>Total de Vendas (Hoje)</h3>
            <p class="metrica-desc">{{ metricas.vendasHoje }} vendas finalizadas</p>
          </div>
        </div>
        
        <div class="metrica-card" @click="navegarPara('estoque')">
          <div class="metrica-icon icon-estoque">📦</div>
          <div class="metrica-info">
            <p class="metrica-valor" :class="{ 'alerta': metricas.produtosBaixoEstoque > 0 }">
              {{ metricas.produtosBaixoEstoque }}
            </p>
            <h3>Produtos com Estoque Baixo</h3>
            <p class="metrica-desc">Itens que precisam de reposição</p>
          </div>
        </div>
        
        <div class="metrica-card" @click="navegarPara('venda')">
          <div class="metrica-icon icon-pendentes">⏳</div>
          <div class="metrica-info">
            <p class="metrica-valor">{{ metricas.vendasPendentes }}</p>
            <h3>Vendas Pendentes</h3>
            <p class="metrica-desc">Aguardando finalização ou pagamento</p>
          </div>
        </div>

        <div class="metrica-card" @click="navegarPara('produto')">
          <div class="metrica-icon icon-produtos">🏷️</div>
          <div class="metrica-info">
            <p class="metrica-valor">{{ produtoStore.meta.total_items || produtoStore.produtos.length }}</p>
            <h3>Produtos Ativos</h3>
            <p class="metrica-desc">Total de itens cadastrados</p>
          </div>
        </div>
      </section>

      <section class="acoes-rapidas">
        <h2>Ações Rápidas</h2>
        <div class="acoes-grid">
          <button class="acao-btn" @click="navegarPara('caixa')">
            <span class="acao-icon">🛒</span>
            <span>Abrir Caixa (PDV)</span>
          </button>
          <button class="acao-btn" @click="navegarPara('produto')">
            <span class="acao-icon">➕</span>
            <span>Novo Produto</span>
          </button>
          <button class="acao-btn" @click="navegarPara('compra')">
            <span class="acao-icon">🚚</span>
            <span>Nova Compra</span>
          </button>
          <button class="acao-btn" @click="navegarPara('estoque')">
            <span class="acao-icon">📊</span>
            <span>Ajustar Estoque</span>
          </button>
        </div>
      </section>

      <div class="dashboard-grid-listas">
        <section class="dashboard-lista-card">
          <div class="lista-header">
            <h2>⚠️ Alerta de Estoque Baixo</h2>
            <button class="btn-ver-todos" @click="navegarPara('estoque')">Ver todos</button>
          </div>
          
          <div v-if="produtosBaixoEstoque.length === 0" class="empty-state">
            <p>✅ Nenhum produto com estoque baixo.</p>
          </div>
          
          <ul v-else class="lista-compacta">
            <li v-for="produto in produtosBaixoEstoque" :key="produto.id">
              <div class="item-info">
                <strong>{{ produto.nome }}</strong>
                <span class="estoque-info">
                  Atual: <span class="estoque-valor-alerta">{{ produto.estoque_atual }}</span>
                  (Mín: {{ produto.estoque_minimo }})
                </span>
              </div>
              <button class="btn-acao-lista btn-repor" @click="navegarPara('compra')">Repor</button>
            </li>
          </ul>
        </section>

        <section class="dashboard-lista-card">
          <div class="lista-header">
            <h2>🕒 Vendas Recentes</h2>
            <button class="btn-ver-todos" @click="navegarPara('venda')">Ver todas</button>
          </div>
          
          <div v-if="vendasRecentes.length === 0" class="empty-state">
            <p>Nenhuma venda registrada recentemente.</p>
          </div>
          
          <ul v-else class="lista-compacta">
            <li v-for="venda in vendasRecentes" :key="venda.id" class="item-venda">
              <div class="item-info-venda">
                <strong>#{{ venda.id }}</strong>
                <span class="venda-funcionario">{{ venda.funcionario_nome }}</span>
                <span :class="`status-badge status-${venda.status}`">{{ venda.status_display }}</span>
              </div>
              <div class="item-valor">
                <span class="valor">{{ formatCurrency(venda.total) }}</span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* SEU CSS IDÊNTICO VAI AQUI... */
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: var(--spacing-xl);
}
.dashboard-header h1 {
  font-size: var(--font-size-display);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-xs);
}
.subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
}

/* --- Métricas --- */
.metricas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xxl);
}
.metrica-card {
  background: var(--color-surface);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  border: 1px solid var(--color-border-light);
}
.metrica-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}
.metrica-icon {
  font-size: 2.5rem;
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  line-height: 1;
}
/* Fundos coloridos sutis para os ícones */
.icon-vendas   { background-color: var(--color-primary-light); color: var(--color-primary-dark); }
.icon-estoque  { background-color: #fffbeb; color: #b45309; }
.icon-pendentes{ background-color: #eff6ff; color: #2563eb; }
.icon-produtos { background-color: #f3e8ff; color: #7e22ce; }

.metrica-info h3 {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: var(--spacing-xs) 0;
  font-weight: var(--font-weight-medium);
}
.metrica-valor {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1;
}
.metrica-valor.alerta {
  color: var(--color-danger);
}
.metrica-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

/* --- Ações Rápidas --- */
.acoes-rapidas {
  margin-bottom: var(--spacing-xxl);
}
.acoes-rapidas h2 {
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-weight: var(--font-weight-semibold);
}
.acoes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}
.acao-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start; /* Alinha à esquerda */
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background: var(--color-surface);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-base);
  color: var(--color-text-primary);
  text-align: left;
}
.acao-btn:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
  background: var(--color-surface);
}
.acao-icon {
  font-size: 1.5rem;
}

/* --- Listas do Dashboard --- */
.dashboard-grid-listas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-lg);
}
.dashboard-lista-card {
  background: var(--color-surface);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
}
.lista-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
}
.lista-header h2 {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin: 0;
  font-weight: var(--font-weight-semibold);
}
.btn-ver-todos {
  background: transparent;
  border: none;
  color: var(--color-accent);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-base);
  text-transform: none;
  font-size: var(--font-size-sm);
}
.btn-ver-todos:hover {
  background: var(--color-background);
}

.lista-compacta {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.lista-compacta li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-background);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-base);
}
.lista-compacta li:hover {
  background: #eef1f4;
  transform: translateX(4px);
}
.item-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.item-info strong {
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}
.estoque-info {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.estoque-valor-alerta {
  font-weight: var(--font-weight-bold);
  color: var(--color-danger);
}
.btn-acao-lista {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  text-transform: none;
  border: none;
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-base);
}
.btn-repor {
  background-color: var(--color-warning);
  color: #4d2506;
}
.btn-repor:hover {
  background-color: #d97706;
  color: var(--color-text-inverse);
}

/* Lista de Vendas */
.item-venda {
  align-items: center;
}
.item-info-venda {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
}
.item-info-venda strong {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
}
.venda-funcionario {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}
.status-badge {
  padding: 4px 10px;
  border-radius: var(--border-radius-full);
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}
.status-badge.status-pendente {
  background: #fffbeb;
  color: #b45309;
}
.status-badge.status-finalizada {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}
.status-badge.status-cancelada {
  background: #fff5f5;
  color: #c0392b;
}
.item-valor .valor {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-success);
}

@media (max-width: 768px) {
  .metricas-grid {
    grid-template-columns: 1fr;
  }
  .dashboard-grid-listas {
    grid-template-columns: 1fr;
  }
  .acoes-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .dashboard-header h1 {
    font-size: 1.8rem;
  }

  /* Cards de Métricas empilhados */
  .metricas-grid {
    grid-template-columns: 1fr; /* Uma coluna */
    gap: 12px;
  }

  .metrica-card {
    padding: 20px;
    /* Destaque visual no mobile */
    border-left: 5px solid var(--color-primary); 
  }

  /* Botões de Ação Rápida em Grid 2x2 para aproveitar espaço */
  .acoes-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .acao-btn {
    flex-direction: column; /* Ícone em cima, texto embaixo */
    text-align: center;
    padding: 16px 8px;
    gap: 8px;
    height: auto;
  }
  
  .dashboard-grid-listas {
    grid-template-columns: 1fr;
  }
}
</style>