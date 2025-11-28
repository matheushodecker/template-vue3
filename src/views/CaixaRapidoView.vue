<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useProdutoStore } from '@/stores/produtoStore'
import { useVendaStore } from '@/stores/vendaStore'
const produtoStore = useProdutoStore()
const vendaStore = useVendaStore()
const codigoBarras = ref('')
const quantidadeInput = ref(1)
const itensCarrinho = ref([])
const desconto = ref(0)
const funcionarioSelecionado = ref(null)
const buscaProduto = ref('')
const produtosFiltrados = ref([])
const mostrarBusca = ref(false)
const subtotal = computed(() => {
  return itensCarrinho.value.reduce((sum, item) => sum + item.subtotal, 0)
})
const total = computed(() => {
  const final = subtotal.value - (desconto.value || 0)
  return Math.max(0, final)
})
onMounted(async () => {
  await Promise.all([
    produtoStore.getProdutos(1, '', '-id'),
    vendaStore.loadDependencies()
  ])
  // Foca automaticamente no campo de código de barras
  document.getElementById('codigo-barras-input')?.focus()
})
function buscarPorCodigoBarras() {
  if (!codigoBarras.value.trim()) return
  const produto = produtoStore.produtos.find(
    p => p.codigo_barras === codigoBarras.value.trim() && p.ativo
  )
  if (produto) {
    adicionarAoCarrinho(produto)
    codigoBarras.value = ''
    quantidadeInput.value = 1
  } else {
    alert('Produto não encontrado ou inativo!')
    // Talvez um feedback visual melhor seja necessário aqui
  }
}
function buscarProdutos() {
  if (buscaProduto.value.trim().length < 2) {
    produtosFiltrados.value = []
    return
  }
  const termo = buscaProduto.value.toLowerCase()
  produtosFiltrados.value = produtoStore.produtos
    .filter(p => p.ativo && (p.nome.toLowerCase().includes(termo) || p.codigo_barras.includes(termo)))
    .slice(0, 10)
}
function adicionarAoCarrinho(produto) {
  const qtd = Number(quantidadeInput.value) || 1
  if (qtd < 1) return

  const itemExistente = itensCarrinho.value.find(i => i.produto === produto.id)
  if (itemExistente) {
    itemExistente.quantidade += qtd
    itemExistente.subtotal = itemExistente.quantidade * itemExistente.preco_unitario
  } else {
    itensCarrinho.value.push({
      produto: produto.id,
      produto_nome: produto.nome,
      quantidade: qtd,
      preco_unitario: Number(produto.preco_venda),
      subtotal: qtd * Number(produto.preco_venda)
    })
  }
  // Limpa campos de busca
  buscaProduto.value = ''
  produtosFiltrados.value = []
  mostrarBusca.value = false
  quantidadeInput.value = 1
  
  // Devolve o foco ao input principal
  document.getElementById('codigo-barras-input')?.focus()
}
function removerItem(index) {
  itensCarrinho.value.splice(index, 1)
}
function alterarQuantidade(index, novaQuantidade) {
  const qtd = Number(novaQuantidade)
  if (qtd < 1) {
    // Se a quantidade for zero ou menos, remove o item
    removerItem(index)
    return
  }
  const item = itensCarrinho.value[index]
  item.quantidade = qtd
  item.subtotal = item.quantidade * item.preco_unitario
}
async function finalizarVenda() {
  if (!funcionarioSelecionado.value) {
    alert('Selecione o funcionário responsável pela venda!')
    return
  }
  if (itensCarrinho.value.length === 0) {
    alert('Adicione pelo menos um produto ao carrinho!')
    return
  }
  const venda = {
    funcionario: funcionarioSelecionado.value,
    desconto: desconto.value,
    status: 'finalizada',
    itens: itensCarrinho.value.map(item => ({
      produto: item.produto,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario
    }))
  }
  try {
    await vendaStore.salvarVenda(venda)
    alert(`Venda finalizada com sucesso! Total: ${formatCurrency(total.value)}`)
    limparCaixa()
  } catch (error) {
    alert('Erro ao finalizar venda. Tente novamente.')
  }
}
function limparCaixa() {
  itensCarrinho.value = []
  desconto.value = 0
  codigoBarras.value = ''
  buscaProduto.value = ''
  quantidadeInput.value = 1
  produtosFiltrados.value = []
  // Devolve o foco
  document.getElementById('codigo-barras-input')?.focus()
}
function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
</script>

<template>
  <div class="caixa-container">
    <div class="caixa-header">
      <h1>🛒 Caixa Rápido (PDV)</h1>
      <div class="funcionario-select">
        <label for="funcionario">Operador:</label>
        <select id="funcionario" v-model="funcionarioSelecionado" required>
          <option :value="null" disabled>Selecione o funcionário</option>
          <option v-for="f in vendaStore.funcionariosDisponiveis" :key="f.id" :value="f.id">
            {{ f.nome }}
          </option>
        </select>
      </div>
    </div>

    <div class="caixa-content">
      <div class="painel-entrada">
        <div class="pdv-card busca-section">
          <h3>Adicionar Produtos</h3>
          
          <div class="input-group">
            <label for="codigo-barras-input">Código de Barras (Enter para adicionar)</label>
            <div class="input-with-button">
              <input
                type="text"
                id="codigo-barras-input"
                v-model="codigoBarras"
                @keyup.enter="buscarPorCodigoBarras"
                placeholder="Digite ou escaneie o código"
                autofocus
              />
              <input
                type="number"
                v-model.number="quantidadeInput"
                min="1"
                class="quantidade-input"
                aria-label="Quantidade"
              />
              <button @click="buscarPorCodigoBarras" class="btn btn-primary">
                Adicionar
              </button>
            </div>
          </div>
          
          <div class="input-group busca-nome">
            <label for="busca-nome-input">Buscar por Nome</label>
            <input
              type="text"
              id="busca-nome-input"
              v-model="buscaProduto"
              @input="buscarProdutos"
              @focus="mostrarBusca = true"
              @blur="mostrarBusca = false"
              placeholder="Digite o nome do produto"
              autocomplete="off"
            />
            <div 
              v-if="mostrarBusca && produtosFiltrados.length > 0" 
              class="resultados-busca"
              @mousedown.prevent >
              <div
                v-for="produto in produtosFiltrados"
                :key="produto.id"
                @click="adicionarAoCarrinho(produto)"
                class="resultado-item"
              >
                <div class="item-details">
                  <strong>{{ produto.nome }}</strong>
                  <span class="estoque">Estoque: {{ produto.estoque_atual }}</span>
                </div>
                <span class="preco">{{ formatCurrency(produto.preco_venda) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="pdv-card atalhos-section">
          <h3>Produtos Rápidos</h3>
          <div class="atalhos-grid">
            <button
              v-for="produto in produtoStore.produtos.slice(0, 10)"
              :key="produto.id"
              @click="adicionarAoCarrinho(produto)"
              class="atalho-produto"
            >
              <span class="atalho-nome">{{ produto.nome }}</span>
              <span class="atalho-preco">{{ formatCurrency(produto.preco_venda) }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="painel-carrinho-wrapper">
        <div class="painel-carrinho pdv-card">
          <div class="carrinho-header">
            <h3>Carrinho ({{ itensCarrinho.length }} itens)</h3>
            <button v-if="itensCarrinho.length > 0" @click="limparCaixa" class="btn btn-danger btn-limpar">
              Limpar
            </button>
          </div>

          <div v-if="itensCarrinho.length === 0" class="carrinho-vazio">
            <span class="vazio-icon">🛒</span>
            <p>Carrinho vazio</p>
            <p class="hint">Adicione produtos para iniciar a venda</p>
          </div>

          <div v-else class="carrinho-itens">
            <div v-for="(item, index) in itensCarrinho" :key="index" class="carrinho-item">
              <div class="item-info">
                <strong>{{ item.produto_nome }}</strong>
                <span class="item-preco-unit">{{ formatCurrency(item.preco_unitario) }}</span>
              </div>
              <div class="item-controles">
                <button @click="alterarQuantidade(index, item.quantidade - 1)" class="btn-qtd btn-light">-</button>
                <input
                  type="number"
                  :value="item.quantidade"
                  @change="alterarQuantidade(index, Number($event.target.value))"
                  class="qtd-display"
                  min="0"
                  aria-label="Quantidade do item"
                />
                <button @click="alterarQuantidade(index, item.quantidade + 1)" class="btn-qtd btn-light">+</button>
                <span class="item-subtotal">{{ formatCurrency(item.subtotal) }}</span>
                <button @click="removerItem(index)" class="btn-remover" title="Remover item">🗑️</button>
              </div>
            </div>
          </div>

          <div v-if="itensCarrinho.length > 0" class="carrinho-footer">
            <div class="desconto-section">
              <label for="desconto-input">Desconto (R$)</label>
              <input
                id="desconto-input"
                type="number"
                v-model.number="desconto"
                step="0.01"
                min="0"
                :max="subtotal"
                placeholder="0,00"
              />
            </div>
            
            <div class="totais">
              <div class="total-linha">
                <span>Subtotal:</span>
                <span class="valor">{{ formatCurrency(subtotal) }}</span>
              </div>
              <div v-if="desconto > 0" class="total-linha desconto">
                <span>Desconto:</span>
                <span class="valor">- {{ formatCurrency(desconto) }}</span>
              </div>
              <div class="total-linha total-final">
                <span>TOTAL:</span>
                <span class="valor">{{ formatCurrency(total) }}</span>
              </div>
            </div>
            
            <button
              @click="finalizarVenda"
              class="btn btn-primary btn-finalizar"
              :disabled="!funcionarioSelecionado || itensCarrinho.length === 0"
            >
              💳 Finalizar Venda
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- Layout Principal do PDV --- */
.caixa-container {
  /* Sobrescreve o padding do app-main-content para usar a tela inteira */
  padding: 0 !important;
  margin: -48px -24px -24px -24px; /* Remove padding do main */
  
  max-width: 100vw;
  min-height: calc(100vh - 72px); /* Altura total - navbar */
  background: var(--color-background);
  font-family: var(--font-family-base);
}

.caixa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-surface);
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  position: sticky; /* Fica abaixo da navbar */
  top: 72px; /* Altura da Navbar */
  z-index: 900;
}
.caixa-header h1 {
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
  margin: 0;
  font-weight: var(--font-weight-semibold);
}
.funcionario-select {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.funcionario-select label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin-bottom: 0;
}
.funcionario-select select {
  min-width: 200px;
  font-size: var(--font-size-sm);
  padding: var(--spacing-sm) var(--spacing-md);
}

.caixa-content {
  display: grid;
  grid-template-columns: 1fr 480px; /* Coluna da esquerda flexível, direita fixa */
  gap: var(--spacing-lg);
  align-items: start;
  padding: var(--spacing-lg);
}

/* --- Estilo de Card Padrão do PDV --- */
.pdv-card {
  background: var(--color-surface);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-light);
}

/* --- Painel da Esquerda (Entrada) --- */
.painel-entrada {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}
.busca-section,
.atalhos-section {
  padding: var(--spacing-lg);
}
.busca-section h3,
.atalhos-section h3 {
  margin: 0 0 var(--spacing-lg) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  border-bottom: 1px solid var(--color-border-light);
  padding-bottom: var(--spacing-md);
}
.input-group {
  margin-bottom: var(--spacing-lg);
}
.input-group:last-child {
  margin-bottom: 0;
}
.input-with-button {
  display: flex;
  gap: var(--spacing-sm);
}
.input-with-button input[type='text'] {
  flex: 1;
  font-size: 1.1rem; /* Fonte maior para o input principal */
}
.quantidade-input {
  width: 80px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
}
.input-with-button .btn {
  padding: 10px 20px;
  font-size: var(--font-size-md);
}

/* Busca por nome */
.busca-nome {
  position: relative;
}
.resultados-busca {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  margin-top: var(--spacing-xs);
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: var(--shadow-lg);
}
.resultado-item {
  padding: var(--spacing-md);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border-light);
  transition: background var(--transition-base);
}
.resultado-item:last-child {
  border-bottom: none;
}
.resultado-item:hover {
  background: var(--color-background);
}
.resultado-item .item-details {
  display: flex;
  flex-direction: column;
}
.resultado-item strong {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}
.resultado-item .estoque {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.resultado-item .preco {
  font-weight: var(--font-weight-semibold);
  color: var(--color-success);
}

/* Atalhos Rápidos */
.atalhos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--spacing-sm);
}
.atalho-produto {
  padding: var(--spacing-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
  text-align: left;
}
.atalho-produto:hover {
  background: var(--color-background);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}
.atalho-nome {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  /* Truncar texto longo */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.atalho-preco {
  color: var(--color-success);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
  margin-top: var(--spacing-xs);
}

/* --- Painel da Direita (Carrinho) --- */
.painel-carrinho-wrapper {
  /* Wrapper para o sticky funcionar corretamente */
  position: sticky;
  top: calc(72px + var(--spacing-lg)); /* Navbar + Padding */
}
.painel-carrinho {
  display: flex;
  flex-direction: column;
  /* Altura máxima para permitir scroll interno */
  max-height: calc(100vh - 72px - (var(--spacing-lg) * 2));
}

.carrinho-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0; /* Não encolhe */
}
.carrinho-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}
.btn-limpar {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
}

.carrinho-vazio {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
  text-align: center;
}
.vazio-icon {
  font-size: 4rem;
  opacity: 0.5;
}
.carrinho-vazio p {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  margin: var(--spacing-md) 0 0 0;
}
.carrinho-vazio .hint {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-regular);
}

/* Lista de Itens no Carrinho */
.carrinho-itens {
  flex: 1; /* Esta é a parte que rola */
  overflow-y: auto;
  padding: var(--spacing-sm) var(--spacing-lg) var(--spacing-lg);
}
.carrinho-item {
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border-light);
}
.carrinho-item:last-child {
  border-bottom: none;
}
.item-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}
.item-info strong {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  flex: 1;
}
.item-preco-unit {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
.item-controles {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.btn-qtd {
  width: 36px;
  height: 36px;
  padding: 0;
  font-size: 1.2rem;
  font-weight: var(--font-weight-regular);
  line-height: 1;
}
.qtd-display {
  width: 60px;
  text-align: center;
  font-weight: var(--font-weight-semibold);
  font-size: 1.1rem;
  padding: 8px;
}
.item-subtotal {
  flex: 1;
  text-align: right;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  font-size: 1.1rem;
}
.btn-remover {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.3rem;
  padding: var(--spacing-xs);
  transition: all var(--transition-base);
  opacity: 0.5;
}
.btn-remover:hover {
  opacity: 1;
  color: var(--color-danger);
  transform: scale(1.1);
}

/* Footer do Carrinho (Totais) */
.carrinho-footer {
  padding: var(--spacing-lg);
  border-top: 2px solid var(--color-border-light);
  flex-shrink: 0; /* Não encolhe */
  background: var(--color-surface);
  /* Borda arredondada apenas embaixo */
  border-bottom-left-radius: var(--border-radius-lg);
  border-bottom-right-radius: var(--border-radius-lg);
}
.desconto-section {
  margin-bottom: var(--spacing-md);
}
.desconto-section input {
  font-size: var(--font-size-lg);
  text-align: right;
  font-weight: var(--font-weight-medium);
}
.totais {
  margin-bottom: var(--spacing-lg);
}
.total-linha {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
}
.total-linha.desconto {
  color: var(--color-danger);
}
.total-linha .valor {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.total-linha.total-final {
  border-top: 2px solid var(--color-text-primary);
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-md);
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
.total-linha.total-final .valor {
  color: var(--color-text-primary);
}

.btn-finalizar {
  width: 100%;
  padding: var(--spacing-lg);
  font-size: 1.3rem;
  font-weight: var(--font-weight-bold);
}

/* --- Responsividade --- */
@media (max-width: 1200px) {
  .caixa-content {
    grid-template-columns: 1fr; /* Empilha as colunas */
  }
  .painel-carrinho-wrapper {
    position: static; /* Remove o sticky */
  }
  .painel-carrinho {
    max-height: none; /* Remove altura máxima */
  }
}

@media (max-width: 768px) {
  .caixa-container {
     margin: -24px -16px -16px -16px; /* Ajuste para telas menores */
  }
  .caixa-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    top: 60px; /* Altura da navbar mobile */
  }
  .caixa-header h1 {
    text-align: center;
  }
  .caixa-content {
    padding: var(--spacing-md);
  }
  .painel-carrinho-wrapper {
     top: calc(60px + var(--spacing-md)); /* Navbar mobile + padding */
  }
  .input-with-button {
    flex-wrap: wrap;
  }
  .input-with-button input[type='text'] {
    flex-basis: 100%;
  }
  .input-with-button .quantidade-input {
    flex: 1;
  }
  .input-with-button .btn {
    flex: 2;
  }
}
/* --- CaixaRapidoView.vue - Adicionar ao final --- */
@media (max-width: 768px) {
  .caixa-container {
    margin: -16px -12px !important; /* Remove margens do container pai */
    display: flex;
    flex-direction: column;
    height: calc(100vh - 64px); /* Altura total menos navbar */
  }

  .caixa-header {
    top: 64px;
    padding: 10px 16px;
    flex-direction: column;
    gap: 8px;
  }

  .caixa-header h1 {
    font-size: 1.2rem;
  }

  /* Transforma o layout em coluna */
  .caixa-content {
    grid-template-columns: 1fr;
    padding: 10px;
    padding-bottom: 180px; /* Espaço para o footer fixo */
    overflow-y: auto; /* Permite scroll no conteúdo */
  }

  /* Card de Inputs */
  .painel-entrada {
    order: 1; /* Inputs primeiro */
  }

  /* Inputs maiores */
  .input-with-button input[type='text'], 
  .quantidade-input {
    height: 50px; /* Fácil de tocar */
  }

  .atalhos-grid {
    grid-template-columns: repeat(3, 1fr); /* 3 colunas em vez de auto-fill */
  }
  
  .atalho-produto {
    padding: 8px;
    font-size: 0.9rem;
    text-align: center;
    align-items: center;
  }

  /* --- Mágica do Carrinho e Total --- */
  .painel-carrinho-wrapper {
    position: static;
    order: 2; /* Carrinho depois dos inputs */
  }

  .carrinho-itens {
    max-height: 300px; /* Limita altura da lista de itens no mobile */
    overflow-y: auto;
    border: 1px solid var(--color-border-light);
    border-radius: 8px;
    margin-bottom: 16px;
  }

  /* Footer Fixo (Sticky Bottom) para finalizar venda rápido */
  .carrinho-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background: white;
    box-shadow: 0 -4px 10px rgba(0,0,0,0.1);
    z-index: 1000;
    padding: 16px;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    display: grid;
    grid-template-columns: 1fr 1fr; /* Dividir espaço */
    gap: 10px;
    align-items: center;
  }

  .totais {
    margin: 0;
  }
  
  /* Esconde detalhes menos importantes do total no footer fixo */
  .total-linha:not(.total-final) {
    display: none; 
  }

  .total-linha.total-final {
    margin: 0;
    padding: 0;
    border: none;
    font-size: 1.2rem;
    text-align: left;
  }
  
  .total-linha.total-final span:first-child {
    display: none; /* Esconde a palavra "TOTAL" para economizar espaço */
  }

  .desconto-section {
    display: none; /* Desconto pode ser acessado rolando a tela, não no footer fixo */
  }

  /* Botão Finalizar Gigante */
  .btn-finalizar {
    grid-column: 2;
    height: 50px;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>