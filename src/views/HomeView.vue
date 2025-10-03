<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProdutoStore } from '@/stores/produtoStore'
import { useVendaStore } from '@/stores/vendaStore'

const router = useRouter()
const produtoStore = useProdutoStore()
const vendaStore = useVendaStore()

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

onMounted(async () => {
  isLoading.value = true
  try {
    await Promise.all([
      produtoStore.getProdutos(1, '', '-id'),
      vendaStore.getVendas()
    ])
    
    calcularMetricas()
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error)
  } finally {
    isLoading.value = false
  }
})

function calcularMetricas() {
  produtosBaixoEstoque.value = produtoStore.produtos
    .filter(p => p.estoque_atual <= p.estoque_minimo && p.ativo)
    .slice(0, 5)
  
  metricas.value.produtosBaixoEstoque = produtosBaixoEstoque.value.length

  const hoje = new Date().toISOString().split('T')[0]
  const vendasHoje = vendaStore.vendas.filter(v => {
    const dataVenda = v.data_venda?.split('T')[0]
    return dataVenda === hoje
  })
  
  metricas.value.vendasHoje = vendasHoje.length
  metricas.value.totalVendasHoje = vendasHoje.reduce((sum, v) => sum + Number(v.total || 0), 0)
  metricas.value.vendasPendentes = vendaStore.vendas.filter(v => v.status === 'pendente').length
  
  vendasRecentes.value = vendaStore.vendas.slice(0, 5)
}

function navegarPara(rota) {
  router.push({ name: rota })
}
</script>

<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>{{ saudacao }}! 👋</h1>
      <p class="subtitle">Bem-vindo ao sistema de gestão do seu mercadinho</p>
    </div>

    <div v-if="isLoading" class="loading-message">
      Carregando dashboard...
    </div>

    <div v-else class="dashboard-content">
      <section class="metricas-grid">
        <div class="metrica-card vendas" @click="navegarPara('venda')">
          <div class="metrica-icon">💰</div>
          <div class="metrica-info">
            <h3>Vendas Hoje</h3>
            <p class="metrica-valor">{{ metricas.vendasHoje }}</p>
            <p class="metrica-total">R$ {{ metricas.totalVendasHoje.toFixed(2) }}</p>
          </div>
        </div>

        <div class="metrica-card estoque" @click="navegarPara('estoque')">
          <div class="metrica-icon">📦</div>
          <div class="metrica-info">
            <h3>Estoque Baixo</h3>
            <p class="metrica-valor alerta">{{ metricas.produtosBaixoEstoque }}</p>
            <p class="metrica-desc">produtos precisam reposição</p>
          </div>
        </div>

        <div class="metrica-card pendentes" @click="navegarPara('venda')">
          <div class="metrica-icon">⏳</div>
          <div class="metrica-info">
            <h3>Vendas Pendentes</h3>
            <p class="metrica-valor">{{ metricas.vendasPendentes }}</p>
            <p class="metrica-desc">aguardando finalização</p>
          </div>
        </div>

        <div class="metrica-card produtos" @click="navegarPara('produto')">
          <div class="metrica-icon">🏷️</div>
          <div class="metrica-info">
            <h3>Total Produtos</h3>
            <p class="metrica-valor">{{ produtoStore.produtos.length }}</p>
            <p class="metrica-desc">cadastrados no sistema</p>
          </div>
        </div>
      </section>

      <section class="acoes-rapidas">
        <h2>Ações Rápidas</h2>
        <div class="acoes-grid">
          <button class="acao-btn nova-venda" @click="navegarPara('venda')">
            <span class="acao-icon">🛒</span>
            <span>Nova Venda</span>
          </button>
          <button class="acao-btn novo-produto" @click="navegarPara('produto')">
            <span class="acao-icon">➕</span>
            <span>Novo Produto</span>
          </button>
          <button class="acao-btn estoque" @click="navegarPara('estoque')">
            <span class="acao-icon">📊</span>
            <span>Gerenciar Estoque</span>
          </button>
          <button class="acao-btn relatorio" @click="navegarPara('relatorio')">
            <span class="acao-icon">📈</span>
            <span>Relatórios</span>
          </button>
        </div>
      </section>

      <div class="dashboard-grid">
        <section class="dashboard-section estoque-baixo">
          <div class="section-header">
            <h2>⚠️ Estoque Baixo</h2>
            <button class="ver-todos" @click="navegarPara('estoque')">Ver todos</button>
          </div>
          
          <div v-if="produtosBaixoEstoque.length === 0" class="empty-state">
            <p>✅ Todos os produtos com estoque adequado!</p>
          </div>
          
          <ul v-else class="lista-compacta">
            <li v-for="produto in produtosBaixoEstoque" :key="produto.id" class="item-alerta">
              <div class="item-info">
                <strong>{{ produto.nome }}</strong>
                <span class="estoque-info">
                  Estoque: <span class="estoque-valor">{{ produto.estoque_atual }}</span> / 
                  Mínimo: {{ produto.estoque_minimo }}
                </span>
              </div>
              <button class="btn-repor" @click="navegarPara('compra')">Repor</button>
            </li>
          </ul>
        </section>

        <section class="dashboard-section vendas-recentes">
          <div class="section-header">
            <h2>🕒 Vendas Recentes</h2>
            <button class="ver-todos" @click="navegarPara('venda')">Ver todas</button>
          </div>
          
          <div v-if="vendasRecentes.length === 0" class="empty-state">
            <p>Nenhuma venda registrada ainda</p>
          </div>
          
          <ul v-else class="lista-compacta">
            <li v-for="venda in vendasRecentes" :key="venda.id" class="item-venda">
              <div class="item-info">
                <strong>#{{ venda.id }}</strong>
                <span class="venda-funcionario">{{ venda.funcionario_nome }}</span>
                <span :class="`status-badge ${venda.status}`">{{ venda.status_display }}</span>
              </div>
              <div class="item-valor">
                <span class="valor">R$ {{ Number(venda.total || 0).toFixed(2) }}</span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.dashboard-header {
  margin-bottom: 40px;
  text-align: center;
}

.dashboard-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 10px;
  font-weight: 700;
}

.subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
}

.loading-message {
  text-align: center;
  color: #41b883;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 60px 0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.metricas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.metrica-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.metrica-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.metrica-card.vendas { border-color: #41b883; }
.metrica-card.estoque { border-color: #f39c12; }
.metrica-card.pendentes { border-color: #3498db; }
.metrica-card.produtos { border-color: #9b59b6; }

.metrica-icon {
  font-size: 3rem;
  line-height: 1;
}

.metrica-info h3 {
  font-size: 0.95rem;
  color: #7f8c8d;
  margin: 0 0 8px 0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metrica-valor {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  line-height: 1;
}

.metrica-valor.alerta {
  color: #e74c3c;
}

.metrica-total {
  font-size: 1.1rem;
  color: #27ae60;
  font-weight: 600;
  margin: 5px 0 0 0;
}

.metrica-desc {
  font-size: 0.9rem;
  color: #95a5a6;
  margin: 5px 0 0 0;
}

.acoes-rapidas {
  margin-bottom: 40px;
}

.acoes-rapidas h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 20px;
  font-weight: 600;
}

.acoes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.acao-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #2c3e50;
}

.acao-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.acao-btn.nova-venda:hover { border-color: #41b883; background: #f0fdf4; }
.acao-btn.novo-produto:hover { border-color: #3498db; background: #eff6ff; }
.acao-btn.estoque:hover { border-color: #f39c12; background: #fffbeb; }
.acao-btn.relatorio:hover { border-color: #9b59b6; background: #faf5ff; }

.acao-icon {
  font-size: 1.8rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 25px;
}

.dashboard-section {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.section-header h2 {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
}

.ver-todos {
  background: transparent;
  border: none;
  color: #3498db;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 15px;
  border-radius: 6px;
  transition: all 0.2s;
  text-transform: none;
  font-size: 0.95rem;
}

.ver-todos:hover {
  background: #eff6ff;
  transform: none;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #95a5a6;
  font-size: 1.1rem;
}

.lista-compacta {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lista-compacta li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
  transition: all 0.2s;
}

.lista-compacta li:hover {
  background: #e9ecef;
  transform: translateX(5px);
}

.item-alerta {
  border-left: 4px solid #e74c3c;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.item-info strong {
  font-size: 1.05rem;
  color: #2c3e50;
}

.estoque-info {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.estoque-valor {
  font-weight: 700;
  color: #e74c3c;
}

.btn-repor {
  background: #41b883;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: none;
  font-size: 0.9rem;
}

.btn-repor:hover {
  background: #358a66;
  transform: scale(1.05);
}

.item-venda .item-info {
  flex-direction: row;
  align-items: center;
  gap: 15px;
}

.venda-funcionario {
  font-size: 0.95rem;
  color: #7f8c8d;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.pendente {
  background: #fef0cd;
  color: #f39c12;
}

.status-badge.finalizada {
  background: #d4edda;
  color: #27ae60;
}

.status-badge.cancelada {
  background: #f8d7da;
  color: #e74c3c;
}

.item-valor .valor {
  font-size: 1.2rem;
  font-weight: 700;
  color: #27ae60;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .metricas-grid {
    grid-template-columns: 1fr;
  }
  
  .acoes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
