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
  return Math.max(0, subtotal.value - desconto.value)
})

onMounted(async () => {
  await Promise.all([
    produtoStore.getProdutos(1, '', '-id'),
    vendaStore.loadDependencies()
  ])
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
  }
}

function buscarProdutos() {
  if (buscaProduto.value.trim().length < 2) {
    produtosFiltrados.value = []
    return
  }
  
  const termo = buscaProduto.value.toLowerCase()
  produtosFiltrados.value = produtoStore.produtos
    .filter(p => 
      p.ativo && 
      (p.nome.toLowerCase().includes(termo) || 
       p.codigo_barras.includes(termo))
    )
    .slice(0, 10)
}

function adicionarAoCarrinho(produto) {
  const itemExistente = itensCarrinho.value.find(i => i.produto === produto.id)
  
  if (itemExistente) {
    itemExistente.quantidade += quantidadeInput.value
    itemExistente.subtotal = itemExistente.quantidade * itemExistente.preco_unitario
  } else {
    itensCarrinho.value.push({
      produto: produto.id,
      produto_nome: produto.nome,
      quantidade: quantidadeInput.value,
      preco_unitario: Number(produto.preco_venda),
      subtotal: quantidadeInput.value * Number(produto.preco_venda)
    })
  }
  
  buscaProduto.value = ''
  produtosFiltrados.value = []
  mostrarBusca.value = false
  quantidadeInput.value = 1
}

function removerItem(index) {
  itensCarrinho.value.splice(index, 1)
}

function alterarQuantidade(index, novaQuantidade) {
  if (novaQuantidade < 1) return
  
  const item = itensCarrinho.value[index]
  item.quantidade = novaQuantidade
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
    alert(`Venda finalizada com sucesso! Total: R$ ${total.value.toFixed(2)}`)
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
}
</script>

<template>
  <div class="caixa-container">
    <div class="caixa-header">
      <h1>🛒 Caixa Rápido - PDV</h1>
      <div class="funcionario-select">
        <label>Operador:</label>
        <select v-model="funcionarioSelecionado" required>
          <option :value="null">Selecione o funcionário</option>
          <option v-for="f in vendaStore.funcionariosDisponiveis" :key="f.id" :value="f.id">
            {{ f.nome }}
          </option>
        </select>
      </div>
    </div>

    <div class="caixa-content">
      <!-- Painel de busca e entrada -->
      <div class="painel-entrada">
        <div class="busca-section">
          <h3>Adicionar Produtos</h3>
          
          <!-- Busca por código de barras -->
          <div class="input-group codigo-barras">
            <label>Código de Barras</label>
            <div class="input-with-button">
              <input 
                type="text" 
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
                placeholder="Qtd"
              />
              <button @click="buscarPorCodigoBarras" class="btn-adicionar">
                Adicionar
              </button>
            </div>
          </div>

          <!-- Busca por nome -->
          <div class="input-group busca-nome">
            <label>Buscar por Nome</label>
            <input 
              type="text" 
              v-model="buscaProduto"
              @input="buscarProdutos"
              @focus="mostrarBusca = true"
              placeholder="Digite o nome do produto"
            />
            
            <div v-if="mostrarBusca && produtosFiltrados.length > 0" class="resultados-busca">
              <div 
                v-for="produto in produtosFiltrados" 
                :key="produto.id"
                @click="adicionarAoCarrinho(produto)"
                class="resultado-item"
              >
                <strong>{{ produto.nome }}</strong>
                <span class="preco">R$ {{ Number(produto.preco_venda).toFixed(2) }}</span>
                <span class="estoque">Est: {{ produto.estoque_atual }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Atalhos rápidos (produtos mais vendidos) -->
        <div class="atalhos-section">
          <h3>Produtos Rápidos</h3>
          <div class="atalhos-grid">
            <button 
              v-for="produto in produtoStore.produtos.slice(0, 6)" 
              :key="produto.id"
              @click="adicionarAoCarrinho(produto)"
              class="atalho-produto"
            >
              <span class="atalho-nome">{{ produto.nome }}</span>
              <span class="atalho-preco">R$ {{ Number(produto.preco_venda).toFixed(2) }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Carrinho de compras -->
      <div class="painel-carrinho">
        <div class="carrinho-header">
          <h3>Carrinho ({{ itensCarrinho.length }} itens)</h3>
          <button v-if="itensCarrinho.length > 0" @click="limparCaixa" class="btn-limpar">
            Limpar
          </button>
        </div>

        <div v-if="itensCarrinho.length === 0" class="carrinho-vazio">
          <p>🛒 Carrinho vazio</p>
          <p class="hint">Adicione produtos usando o código de barras ou busca</p>
        </div>

        <div v-else class="carrinho-itens">
          <div v-for="(item, index) in itensCarrinho" :key="index" class="carrinho-item">
            <div class="item-info">
              <strong>{{ item.produto_nome }}</strong>
              <span class="item-preco">R$ {{ item.preco_unitario.toFixed(2) }}</span>
            </div>
            <div class="item-controles">
              <button @click="alterarQuantidade(index, item.quantidade - 1)" class="btn-qtd">-</button>
              <input 
                type="number" 
                :value="item.quantidade"
                @change="alterarQuantidade(index, Number($event.target.value))"
                class="qtd-display"
                min="1"
              />
              <button @click="alterarQuantidade(index, item.quantidade + 1)" class="btn-qtd">+</button>
              <span class="item-subtotal">R$ {{ item.subtotal.toFixed(2) }}</span>
              <button @click="removerItem(index)" class="btn-remover">🗑️</button>
            </div>
          </div>
        </div>

        <!-- Totais e finalização -->
        <div v-if="itensCarrinho.length > 0" class="carrinho-footer">
          <div class="desconto-section">
            <label>Desconto (R$)</label>
            <input 
              type="number" 
              v-model.number="desconto"
              step="0.01"
              min="0"
              :max="subtotal"
              placeholder="0.00"
            />
          </div>

          <div class="totais">
            <div class="total-linha">
              <span>Subtotal:</span>
              <span class="valor">R$ {{ subtotal.toFixed(2) }}</span>
            </div>
            <div v-if="desconto > 0" class="total-linha desconto">
              <span>Desconto:</span>
              <span class="valor">- R$ {{ desconto.toFixed(2) }}</span>
            </div>
            <div class="total-linha total-final">
              <span>TOTAL:</span>
              <span class="valor">R$ {{ total.toFixed(2) }}</span>
            </div>
          </div>

          <button 
            @click="finalizarVenda" 
            class="btn-finalizar"
            :disabled="!funcionarioSelecionado"
          >
            💳 Finalizar Venda
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.caixa-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background: #f5f7fa;
  min-height: 100vh;
}

.caixa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 20px 30px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.caixa-header h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0;
}

.funcionario-select {
  display: flex;
  align-items: center;
  gap: 10px;
}

.funcionario-select label {
  font-weight: 600;
  color: #2c3e50;
}

.funcionario-select select {
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 200px;
}

.caixa-content {
  display: grid;
  grid-template-columns: 1fr 500px;
  gap: 20px;
  align-items: start;
}

/* Painel de Entrada */
.painel-entrada {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.busca-section, .atalhos-section {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.busca-section h3, .atalhos-section h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.input-with-button {
  display: flex;
  gap: 10px;
}

.input-with-button input[type="text"] {
  flex: 1;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1.1rem;
}

.quantidade-input {
  width: 80px;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1.1rem;
  text-align: center;
}

.btn-adicionar {
  padding: 12px 25px;
  background: #41b883;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: none;
}

.btn-adicionar:hover {
  background: #358a66;
  transform: translateY(-2px);
}

.busca-nome {
  position: relative;
}

.busca-nome input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1.1rem;
}

.resultados-busca {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  margin-top: 5px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.resultado-item {
  padding: 12px 15px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.resultado-item:hover {
  background: #f8f9fa;
}

.resultado-item strong {
  flex: 1;
  color: #2c3e50;
}

.resultado-item .preco {
  font-weight: 600;
  color: #27ae60;
  margin-right: 15px;
}

.resultado-item .estoque {
  font-size: 0.9rem;
  color: #7f8c8d;
}

/* Atalhos */
.atalhos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.atalho-produto {
  padding: 15px;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 5px;
  text-align: left;
  text-transform: none;
}

.atalho-produto:hover {
  background: #e9ecef;
  border-color: #41b883;
  transform: translateY(-2px);
}

.atalho-nome {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.atalho-preco {
  color: #27ae60;
  font-weight: 700;
}

/* Painel Carrinho */
.painel-carrinho {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 140px);
  position: sticky;
  top: 20px;
}

.carrinho-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 2px solid #f0f0f0;
}

.carrinho-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.btn-limpar {
  padding: 8px 15px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  text-transform: none;
  font-size: 0.9rem;
}

.btn-limpar:hover {
  background: #c0392b;
}

.carrinho-vazio {
  padding: 60px 20px;
  text-align: center;
  color: #95a5a6;
}

.carrinho-vazio p {
  font-size: 1.5rem;
  margin: 10px 0;
}

.carrinho-vazio .hint {
  font-size: 1rem;
}

.carrinho-itens {
  flex: 1;
  overflow-y: auto;
  padding: 15px 25px;
}

.carrinho-item {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 10px;
}

.item-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.item-info strong {
  color: #2c3e50;
}

.item-preco {
  color: #7f8c8d;
  font-weight: 600;
}

.item-controles {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-qtd {
  width: 32px;
  height: 32px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1.1rem;
  transition: all 0.2s;
  text-transform: none;
}

.btn-qtd:hover {
  background: #2980b9;
}

.qtd-display {
  width: 60px;
  text-align: center;
  padding: 6px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-weight: 600;
}

.item-subtotal {
  flex: 1;
  text-align: right;
  font-weight: 700;
  color: #27ae60;
  font-size: 1.1rem;
}

.btn-remover {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.3rem;
  padding: 5px;
  transition: transform 0.2s;
  text-transform: none;
}

.btn-remover:hover {
  transform: scale(1.2);
}

/* Footer do Carrinho */
.carrinho-footer {
  padding: 20px 25px;
  border-top: 2px solid #f0f0f0;
}

.desconto-section {
  margin-bottom: 15px;
}

.desconto-section label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.desconto-section input {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.totais {
  margin-bottom: 20px;
}

.total-linha {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 1.1rem;
}

.total-linha.desconto {
  color: #e74c3c;
}

.total-linha.total-final {
  border-top: 2px solid #2c3e50;
  margin-top: 10px;
  padding-top: 15px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
}

.total-linha .valor {
  font-weight: 700;
}

.btn-finalizar {
  width: 100%;
  padding: 18px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: none;
}

.btn-finalizar:hover:not(:disabled) {
  background: #229954;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(39, 174, 96, 0.3);
}

.btn-finalizar:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

@media (max-width: 1200px) {
  .caixa-content {
    grid-template-columns: 1fr;
  }
  
  .painel-carrinho {
    position: static;
    max-height: none;
  }
}
</style>
