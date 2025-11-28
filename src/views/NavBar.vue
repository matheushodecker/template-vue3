<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()

// Usando o getter 'loggedIn' da store, que agora é computado
const isLoggedIn = computed(() => authStore.loggedIn)
const user = computed(() => authStore.user)

// Controla o dropdown do usuário (em vez de CSS hover, para ser amigável ao toque)
const showUserDropdown = ref(false)
const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value
}

const closeDropdowns = () => {
  showUserDropdown.value = false
  showMobileMenu.value = false // Adicionado: Fecha o menu mobile
}

// Controla se o menu de navegação mobile está aberto
const showMobileMenu = ref(false)
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  // Garante que o dropdown do usuário feche ao abrir o menu principal
  if (showMobileMenu.value) {
    showUserDropdown.value = false
  }
}

// Fecha o dropdowns e o menu mobile se clicar fora

</script>

<template>
  <div
    v-if="showUserDropdown || showMobileMenu"
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

        <button
          class="menu-toggle"
          :class="{ active: showMobileMenu }"
          @click="toggleMobileMenu"
          aria-label="Abrir menu de navegação"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

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
    
    <transition name="slide">
      <div v-if="showMobileMenu" class="mobile-menu">
        <router-link 
            :to="{ name: 'usuario' }" 
            class="mobile-nav-link"
            v-if="isLoggedIn"
            @click="closeDropdowns"
        >
          <span class="link-icon">👤</span>
          <span class="link-text">Perfil</span>
        </router-link>
        
        <router-link 
            :to="{ name: 'caixa' }" 
            class="mobile-nav-link cta-caixa"
            @click="closeDropdowns"
        >
          <span class="link-icon">🛒</span>
          <span class="link-text">Caixa</span>
        </router-link>

        <router-link :to="{ name: 'venda' }" class="mobile-nav-link" @click="closeDropdowns">
            <span class="link-icon">💰</span>
           <span class="link-text">Vendas</span>
         </router-link>
         <router-link :to="{ name: 'produto' }" class="mobile-nav-link" @click="closeDropdowns">
            <span class="link-icon">🏷️</span>
           <span class="link-text">Produtos</span>
         </router-link>
         <router-link :to="{ name: 'estoque' }" class="mobile-nav-link" @click="closeDropdowns">
            <span class="link-icon">📦</span>
           <span class="link-text">Estoque</span>
         </router-link>
         <router-link :to="{ name: 'cliente' }" class="mobile-nav-link" @click="closeDropdowns">
            <span class="link-icon">👥</span>
           <span class="link-text">Clientes</span>
         </router-link>
         <router-link :to="{ name: 'relatorio' }" class="mobile-nav-link" @click="closeDropdowns">
            <span class="link-icon">📈</span>
           <span class="link-text">Relatórios</span>
         </router-link>
         
         <hr class="mobile-menu-divider" />
         <h4 class="mobile-menu-title">Mais Opções:</h4>
         
         <router-link :to="{ name: 'compra' }" class="mobile-nav-link" @click="closeDropdowns">
            <span class="link-icon">🛍️</span>
            <span class="link-text">Compras</span>
         </router-link>
         <router-link :to="{ name: 'fornecedor' }" class="mobile-nav-link" @click="closeDropdowns">
            <span class="link-icon">🚚</span>
            <span class="link-text">Fornecedores</span>
         </router-link>
         <router-link :to="{ name: 'categorias' }" class="mobile-nav-link" @click="closeDropdowns">
            <span class="link-icon">📑</span>
            <span class="link-text">Categorias</span>
         </router-link>
         <router-link :to="{ name: 'promocao' }" class="mobile-nav-link" @click="closeDropdowns">
            <span class="link-icon">🎁</span>
            <span class="link-text">Promoções</span>
         </router-link>
         
         <hr class="mobile-menu-divider" />
         
         <router-link :to="{ name: 'funcionario' }" class="mobile-nav-link" @click="closeDropdowns">
            <span class="link-icon">👷</span>
            <span class="link-text">Funcionários</span>
         </router-link>
         <router-link :to="{ name: 'cargo' }" class="mobile-nav-link" @click="closeDropdowns">
            <span class="link-icon">📌</span>
            <span class="link-text">Cargos</span>
         </router-link>
         
         <hr class="mobile-menu-divider" />
         
         <router-link :to="{ name: 'formaPagamento' }" class="mobile-nav-link" @click="closeDropdowns">
            <span class="link-icon">💳</span>
            <span class="link-text">Formas Pagamento</span>
         </router-link>
         <router-link :to="{ name: 'pagamento' }" class="mobile-nav-link" @click="closeDropdowns">
            <span class="link-icon">💵</span>
            <span class="link-text">Pagamentos</span>
         </router-link>
         
      </div>
    </transition>
    
  </header>
</template>

<style scoped>
/* Variáveis (Assumindo que estão definidas em outro lugar, mas incluídas aqui para contexto de valores) */
/* :root {
  --color-primary: #007bff;
  --color-primary-dark: #0056b3;
  --color-primary-light: #e6f2ff;
  --color-danger: #dc3545;
  --color-danger-dark: #b02a37;
  --color-surface: #ffffff;
  --color-background: #f8f9fa;
  --color-border: #dee2e6;
  --color-border-light: #f1f3f5;
  --color-text-primary: #212529;
  --color-text-secondary: #6c757d;
  --color-text-inverse: #ffffff;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-full: 50%;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.5rem;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --transition-base: 0.2s ease;
}
*/

/* Overlay para fechar dropdowns e menu mobile */
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
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1010;
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

/* --- Links de Navegação (Desktop) --- */
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

/* --- Dropdown "Mais" (Desktop) --- */
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

/* --- MENU MOBILE E TOGGLE (NOVOS ESTILOS) --- */

/* Menu Toggle (Hambúrguer) */
.menu-toggle {
  display: none; /* Escondido por padrão (Desktop) */
  background: none;
  border: none;
  cursor: pointer;
  width: 30px;
  height: 24px;
  padding: 0;
  position: relative;
  /* Espaçamento em mobile, será ajustado na media query */
  margin-right: 0; 
  z-index: 1040;
}
.menu-toggle span {
  display: block;
  width: 100%;
  height: 3px;
  background-color: var(--color-text-primary);
  border-radius: 3px;
  margin-bottom: 5px;
  transition: all 0.3s ease;
}
.menu-toggle span:last-child {
  margin-bottom: 0;
}

/* Animação do X */
.menu-toggle.active span:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}
.menu-toggle.active span:nth-child(2) {
  opacity: 0;
}
.menu-toggle.active span:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

/* Menu Mobile (Conteúdo flutuante) */
.mobile-menu {
  position: absolute;
  top: 72px; /* Altura da navbar */
  left: 0;
  width: 100%;
  background-color: var(--color-surface);
  box-shadow: var(--shadow-xl);
  z-index: 1020;
  padding: var(--spacing-md);
  border-bottom-left-radius: var(--border-radius-lg);
  border-bottom-right-radius: var(--border-radius-lg);
  max-height: calc(100vh - 72px);
  overflow-y: auto;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  color: var(--color-text-primary);
  text-decoration: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-md);
  transition: all var(--transition-base);
}
.mobile-nav-link:hover {
  background-color: var(--color-background);
}
.mobile-nav-link.router-link-active:not(.cta-caixa) {
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
  font-weight: var(--font-weight-semibold);
}
.mobile-nav-link .link-icon {
  font-size: 1.3rem;
}
.mobile-nav-link.cta-caixa {
  margin: var(--spacing-sm) 0;
}

.mobile-menu-divider {
  border: 0;
  height: 1px;
  background-color: var(--color-border-light);
  margin: var(--spacing-md) 0;
}
.mobile-menu-title {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    padding: var(--spacing-sm) var(--spacing-md) var(--spacing-xs);
}

/* Transição de slide para o Vue */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease-out;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}


/* --- RESPONSIVIDADE --- */

/* Tablets/Medium Screens - Esconde texto, mantém ícones e texto do CTA Caixa */
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
  
  /* Ajusta padding para ícones ficarem centralizados */
  .nav-link {
    padding: var(--spacing-sm);
  }
  .cta-caixa {
     padding: var(--spacing-sm) var(--spacing-md);
  }
}

/* Mobile/Small Screens - Ativa menu hambúrguer */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 var(--spacing-md);
  }
  
  .logo-text {
    display: none; /* Esconde texto do logo em mobile */
  }

  /* 1. Oculta todos os links da barra principal (Desktop) */
  .nav-links,
  .profile-link,
  .dropdown {
    display: none;
  }
  
  /* 2. Exibe o botão de menu (Hambúrguer) e o move */
  .menu-toggle {
    display: block;
    /* Move o toggle para o lado direito do logo e antes dos botões de login/usuário */
    margin-left: auto; 
    order: 1; /* Garante que fique antes do nav-right */
  }

  /* 3. Ajuste o lado esquerdo */
  .nav-left {
    flex: 1; /* Permite que o logo e o toggle usem o espaço */
    justify-content: flex-start;
    gap: var(--spacing-md);
  }
  
  /* 4. Garante que o menu do usuário/login fique no extremo direito */
  .nav-right {
    order: 2; /* Garante que fique após o toggle */
    margin-left: var(--spacing-md); /* Espaçamento entre o toggle e os botões */
  }
}

/* Garante que o mobile menu não apareça em desktop */
@media (min-width: 769px) {
  .mobile-menu {
    display: none !important;
  }
}
/* --- NavBar.vue - Substituir/Adicionar a parte responsiva --- */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 16px;
    height: 64px; /* Navbar um pouco menor no mobile */
  }

  .navbar {
    height: 64px;
  }

  /* Menu Mobile Estilo "Gaveta" (Drawer) */
  .mobile-menu {
    top: 64px;
    height: calc(100vh - 64px); /* Ocupa toda a altura restante */
    border-radius: 0;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: var(--color-surface);
  }

  /* Links grandes para facilitar o toque */
  .mobile-nav-link {
    padding: 16px; /* Área de toque generosa */
    font-size: 1.1rem;
    border: 1px solid var(--color-border-light);
    border-radius: 12px;
    margin-bottom: 8px;
  }

  /* Destaque para o botão Caixa */
  .mobile-nav-link.cta-caixa {
    background-color: var(--color-primary);
    color: white !important;
    font-weight: bold;
    text-align: center;
    justify-content: center;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  /* Ícone do menu hamburguer maior */
  .menu-toggle {
    width: 44px;
    height: 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
}
</style>