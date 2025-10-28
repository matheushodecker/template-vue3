<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()

const isLoggedIn = computed(() => authStore.loggedIn)
const user = computed(() => authStore.user)

// Controla o dropdown do usuário (em vez de CSS hover, para ser amigável ao toque)
const showUserDropdown = ref(false)
const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value
}

// Fecha o dropdown se clicar fora
const closeDropdowns = () => {
  showUserDropdown.value = false
}
</script>

<template>
  <div
    v-if="showUserDropdown"
    class="dropdown-overlay"
    @click="closeDropdowns"
  ></div>

  <header class="navbar" @click.stop>
    <nav class="nav-container">
      <div class="nav-left">
        <router-link :to="{ name: 'home' }" class="logo">
          <span class="logo-icon">🏪</span>
          <span class="logo-text">Mercadinho Loschicos</span>
        </router-link>

        <div class="nav-links">
          <router-link :to="{ name: 'caixa' }" class="nav-link cta-caixa">
            <span class="link-icon">🛒</span>
            <span class="link-text">Caixa</span>
          </router-link>
          
          <router-link :to="{ name: 'venda' }" class="nav-link">
             <span class="link-icon">💰</span>
            <span class="link-text">Vendas</span>
          </router-link>
          <router-link :to="{ name: 'produto' }" class="nav-link">
             <span class="link-icon">🏷️</span>
            <span class="link-text">Produtos</span>
          </router-link>
          <router-link :to="{ name: 'estoque' }" class="nav-link">
             <span class="link-icon">📦</span>
            <span class="link-text">Estoque</span>
          </router-link>
          <router-link :to="{ name: 'cliente' }" class="nav-link">
             <span class="link-icon">👥</span>
            <span class="link-text">Clientes</span>
          </router-link>
          <router-link :to="{ name: 'relatorio' }" class="nav-link">
             <span class="link-icon">📈</span>
            <span class="link-text">Relatórios</span>
          </router-link>

          <div class="dropdown">
            <button class="nav-link dropdown-btn">
              <span class="link-text">Mais</span>
              <span class="dropdown-arrow">▾</span>
            </button>
            <div class="dropdown-content">
              <router-link :to="{ name: 'compra' }">Compras</router-link>
              <router-link :to="{ name: 'fornecedor' }">Fornecedores</router-link>
              <router-link :to="{ name: 'categorias' }">Categorias</router-link>
              <router-link :to="{ name: 'promocao' }">Promoções</router-link>
              <hr class="dropdown-divider" />
              <router-link :to="{ name: 'funcionario' }">Funcionários</router-link>
              <router-link :to="{ name: 'cargo' }">Cargos</router-link>
              <hr class="dropdown-divider" />
              <router-link :to="{ name: 'formaPagamento' }">Formas Pagamento</router-link>
              <router-link :to="{ name: 'pagamento' }">Pagamentos</router-link>
            </div>
          </div>
        </div>
      </div>

      <div class="nav-right">
        <template v-if="isLoggedIn">
          <router-link :to="{ name: 'usuario' }" class="nav-link profile-link">
            <span class="link-text">Perfil</span>
          </router-link>
          
          <div class="user-menu">
            <button @click="toggleUserDropdown" class="user-menu-btn">
              <img
                v-if="user.foto && user.foto.url"
                :src="user.foto.url"
                alt="Foto"
                class="user-photo"
              />
              <img
                v-else
                src="https://avatar.vercel.sh/user.svg?text=User"
                alt="Foto"
                class="user-photo"
              />
            </button>
            <div v-if="showUserDropdown" class="user-dropdown">
              <div class="user-info">
                <p class="user-name">{{ user.name || 'Usuário' }}</p>
                <p class="user-email">{{ user.email }}</p>
              </div>
              <router-link to="/logout" class="dropdown-item logout-btn">
                Sair
              </router-link>
            </div>
          </div>
        </template>
        <template v-else>
          <router-link :to="{ name: 'login' }" class="nav-link login-btn">
            Entrar
          </router-link>
        </template>
      </div>
    </nav>
  </header>
</template>

<style scoped>
/* Overlay para fechar dropdowns */
.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
}

.navbar {
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  position: fixed; /* Alterado de sticky para fixed */
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1010; /* Acima do overlay */
  height: 72px;
}

.nav-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
}

/* --- Logo --- */
.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  text-decoration: none;
  transition: all var(--transition-base);
  padding: var(--spacing-sm) 0;
}
.logo:hover {
  opacity: 0.8;
}
.logo-icon {
  font-size: 1.8rem;
}
.logo-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

/* --- Links de Navegação --- */
.nav-links {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-left: var(--spacing-md);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  transition: all var(--transition-base);
  white-space: nowrap;
  background: none;
  border: none;
  cursor: pointer;
}

.nav-link:hover {
  background-color: var(--color-background);
  color: var(--color-text-primary);
}

/* Estilo do link ativo */
.nav-link.router-link-active:not(.cta-caixa) {
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-weight: var(--font-weight-semibold);
}

/* Link de Caixa (CTA) */
.cta-caixa {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  font-weight: var(--font-weight-semibold);
  box-shadow: var(--shadow-sm);
}
.cta-caixa:hover {
  background-color: var(--color-primary-dark);
  color: var(--color-text-inverse);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.cta-caixa.router-link-active {
  background-color: var(--color-primary-dark);
  box-shadow: none;
}
.link-icon {
  font-size: 1.1rem;
}

/* --- Dropdown "Mais" --- */
.dropdown {
  position: relative;
}
.dropdown-btn {
  gap: var(--spacing-xs);
}
.dropdown-arrow {
  font-size: 0.75rem;
  transition: transform var(--transition-base);
}
.dropdown:hover .dropdown-arrow {
  transform: rotate(180deg);
}

.dropdown-content {
  display: none;
  position: absolute;
  top: calc(100% + var(--spacing-sm));
  left: 0;
  background-color: var(--color-surface);
  min-width: 220px;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-sm);
  z-index: 1020;
  border: 1px solid var(--color-border);
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.dropdown:hover .dropdown-content {
  display: block;
}

.dropdown-content a {
  display: block;
  color: var(--color-text-secondary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  transition: all var(--transition-base);
  text-decoration: none;
}
.dropdown-content a:hover {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  transform: translateX(4px);
}
.dropdown-divider {
  border: 0;
  height: 1px;
  background-color: var(--color-border-light);
  margin: var(--spacing-sm) 0;
}

/* --- Lado Direito (Usuário) --- */
.nav-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.profile-link {
  font-size: var(--font-size-sm);
}

.user-menu {
  position: relative;
  z-index: 1020;
}
.user-menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  border-radius: var(--border-radius-full);
}
.user-photo {
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-full);
  object-fit: cover;
  border: 2px solid var(--color-border);
  transition: all var(--transition-base);
  display: block;
}
.user-menu-btn:hover .user-photo {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: scale(1.05);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + var(--spacing-md));
  right: 0;
  background-color: var(--color-surface);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 240px;
  z-index: 1030;
  border: 1px solid var(--color-border);
  animation: slideDown 0.2s ease-out;
}
.user-info {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
}
.user-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.user-email {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  word-break: break-all;
}
.dropdown-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-decoration: none;
}
.dropdown-item:hover {
  background-color: var(--color-background);
  color: var(--color-text-primary);
}
.logout-btn {
  color: var(--color-danger);
  font-weight: var(--font-weight-medium);
  border-top: 1px solid var(--color-border-light);
}
.logout-btn:hover {
  background-color: #fff5f5;
  color: var(--color-danger-dark);
}

.login-btn {
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-weight: var(--font-weight-semibold);
}
.login-btn:hover {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

/* --- Responsividade --- */
@media (max-width: 1200px) {
  /* Esconde o texto da maioria dos links, mantendo ícones */
  .nav-link:not(.cta-caixa) .link-text,
  .dropdown-btn .link-text {
    display: none;
  }
  
  .logo-text {
    font-size: var(--font-size-lg);
  }

  /* Mantém o texto do "Caixa" */
  .cta-caixa .link-text {
    display: inline;
  }
  
  /* Ajusta padding para ícones */
  .nav-link {
    padding: var(--spacing-sm);
  }
  .cta-caixa {
     padding: var(--spacing-sm) var(--spacing-md);
  }
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0 var(--spacing-md);
  }
  
  .logo-text {
    display: none; /* Esconde texto do logo em mobile */
  }

  /* Esconde "Perfil" e "Mais" */
  .profile-link,
  .dropdown {
    display: none;
  }

  /* Esconde todos os textos de link, mantendo só ícones */
  .nav-link .link-text {
    display: none;
  }
  
  .nav-links {
    gap: var(--spacing-xs);
    margin-left: auto; /* Empurra os links para o centro/direita */
  }

  .nav-left {
    flex: none;
  }
  
  .nav-right {
    margin-left: auto;
  }
}
</style>