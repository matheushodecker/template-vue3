<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth'; // Importa a store de autenticação

const authStore = useAuthStore();

// Computa se o usuário está logado e obtém os dados do usuário
const isLoggedIn = computed(() => authStore.loggedIn);
const user = computed(() => authStore.user);

// Estado reativo para controlar o dropdown
const showDropdown = ref(false);

// Função para alternar o dropdown
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};
</script>

<template>
  <header class="navbar">
    <nav>
      <div class="nav-left">
        <router-link :to="{ name: 'home' }" class="logo">
          <!-- Changed logo icon from bread to store/market icon -->
          <span class="logo-icon">🏪</span>
          <span class="logo-text">Mercadinho Loschicos</span>
        </router-link>
        
        <div class="nav-links">
          <router-link :to="{ name: 'caixa' }" class="caixa-link">
            <span class="link-icon">🛒</span>
            <span>Caixa</span>
          </router-link>
          <router-link :to="{ name: 'venda' }">Vendas</router-link>
          <router-link :to="{ name: 'produto' }">Produtos</router-link>
          <router-link :to="{ name: 'estoque' }">Estoque</router-link>
          <router-link :to="{ name: 'cliente' }">Clientes</router-link>
          <router-link :to="{ name: 'relatorio' }">Relatórios</router-link>
          
          <div class="dropdown">
            <button class="dropdown-btn">
              <span>Mais</span>
              <span class="dropdown-arrow">▾</span>
            </button>
            <div class="dropdown-content">
              <router-link :to="{ name: 'categorias' }">Categorias</router-link>
              <router-link :to="{ name: 'fornecedor' }">Fornecedores</router-link>
              <router-link :to="{ name: 'funcionario' }">Funcionários</router-link>
              <router-link :to="{ name: 'cargo' }">Cargos</router-link>
              <router-link :to="{ name: 'formaPagamento' }">Formas Pagamento</router-link>
              <router-link :to="{ name: 'pagamento' }">Pagamentos</router-link>
              <router-link :to="{ name: 'promocao' }">Promoções</router-link>
              <router-link :to="{ name: 'compra' }">Compras</router-link>
            </div>
          </div>
        </div>
      </div>

      <div class="nav-right" v-if="isLoggedIn">
        <router-link to="/usuario" class="profile-link">Perfil</router-link>

        <div class="user-menu" @click="toggleDropdown">
          <img
            v-if="user.foto && user.foto.url"
            :src="user.foto.url"
            alt="Foto do usuário"
            class="user-photo"
          />
          <img
            v-else
            src="https://via.placeholder.com/50"
            alt="Sem foto"
            class="user-photo"
          />

          <div v-if="showDropdown" class="user-dropdown">
            <p class="user-name">{{ user.name }}</p>
            <p class="user-email">{{ user.email }}</p>
            <router-link to="/logout" class="dropdown-item">Sair</router-link>
          </div>
        </div>
      </div>

      <div class="nav-right" v-else>
        <router-link to="/login" class="login-btn">Entrar</router-link>
      </div>
    </nav>
  </header>
</template>

<style scoped>
/* --- Configuração de Cores e Espaçamentos (Assumindo variáveis globais) --- */

.navbar {
  background-color: var(--color-surface, #ffffff);
  border-bottom: 1px solid var(--color-border, #e9ecef);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
  position: sticky;
  top: 0;
  z-index: 1000;
}

nav {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg, 16px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 72px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl, 24px);
  flex: 1;
}

/* --- Logo --- */
.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 8px);
  font-size: var(--font-size-xl, 1.5rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-text-primary, #333333);
  padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
  border-radius: var(--radius-md, 8px);
  transition: all var(--transition-base, 0.3s ease);
  text-decoration: none;
}

.logo:hover {
  background-color: var(--color-border-light, #f8f9fa);
  transform: translateY(-1px);
}

.logo-icon {
  font-size: 1.5rem;
}

/* --- Menu Principal de Links --- */
.nav-links {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 4px);
}

.nav-links a {
  color: var(--color-text-secondary, #6c757d);
  text-decoration: none;
  padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
  border-radius: var(--radius-md, 8px);
  font-weight: var(--font-weight-medium, 500);
  font-size: var(--font-size-sm, 0.875rem);
  transition: all var(--transition-base, 0.3s ease);
  white-space: nowrap;
}

.nav-links a:hover {
  background-color: var(--color-border-light, #f8f9fa);
  color: var(--color-text-primary, #333333);
}

.nav-links a.router-link-active {
  background-color: var(--color-primary, #007bff);
  color: var(--color-text-inverse, #ffffff);
}

/* --- Link de Caixa (CTA) --- */
.caixa-link {
  display: flex !important;
  align-items: center;
  gap: var(--spacing-xs, 4px);
  background-color: var(--color-primary, #007bff) !important;
  color: var(--color-text-inverse, #ffffff) !important;
  font-weight: var(--font-weight-semibold, 600) !important;
  padding: var(--spacing-sm, 8px) var(--spacing-lg, 16px) !important;
  box-shadow: var(--shadow-sm);
  margin-right: var(--spacing-sm, 8px);
}

.caixa-link:hover {
  background-color: var(--color-primary-dark, #0056b3) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.link-icon {
  font-size: 1.1rem;
}

/* --- Dropdown "Mais" --- */
.dropdown {
  position: relative;
}

.dropdown-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 4px);
  background-color: transparent;
  color: var(--color-text-secondary, #6c757d);
  padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
  border-radius: var(--radius-md, 8px);
  font-weight: var(--font-weight-medium, 500);
  font-size: var(--font-size-sm, 0.875rem);
  transition: all var(--transition-base, 0.3s ease);
  /* Adicionado para correta estilização de botão */
  border: none;
  cursor: pointer;
  white-space: nowrap;
}

.dropdown-btn:hover {
  background-color: var(--color-border-light, #f8f9fa);
  color: var(--color-text-primary, #333333);
}

.dropdown-arrow {
  font-size: 0.75rem;
  transition: transform var(--transition-base, 0.3s ease);
}

/* Efeito de rotação ao passar o mouse */
.dropdown:hover .dropdown-arrow {
  transform: rotate(180deg);
}

.dropdown-content {
  display: none;
  position: absolute;
  top: calc(100% + var(--spacing-sm, 1px));
  left: 0;
  background-color: var(--color-surface, #ffffff);
  min-width: 220px;
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-lg, 0 10px 15px rgba(0, 0, 0, 0.15));
  padding: var(--spacing-sm, 8px);
  z-index: 1000;
  border: 1px solid var(--color-border, #e9ecef);
}

.dropdown:hover .dropdown-content {
  display: block;
  animation: slideDown var(--transition-base, 0.4s ease);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-content a {
  display: block;
  color: var(--color-text-secondary, #6c757d);
  padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
  border-radius: var(--radius-sm, 4px);
  font-size: var(--font-size-sm, 0.875rem);
  transition: all var(--transition-fast, 0.15s ease-out);
}

.dropdown-content a:hover {
  background-color: var(--color-border-light, #f8f9fa);
  color: var(--color-text-primary, #333333);
  transform: translateX(4px);
}

/* --- Menu do Usuário (Direita) --- */
.nav-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 12px);
}

.profile-link {
  color: var(--color-text-secondary, #6c757d);
  font-weight: var(--font-weight-medium, 500);
  font-size: var(--font-size-sm, 0.875rem);
  padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
  border-radius: var(--radius-md, 8px);
  transition: all var(--transition-base, 0.3s ease);
  text-decoration: none;
  white-space: nowrap;
}

.profile-link:hover {
  background-color: var(--color-border-light, #f8f9fa);
  color: var(--color-text-primary, #333333);
}

.user-menu {
  position: relative;
  cursor: pointer;
  padding: var(--spacing-xs, 4px); /* Aumenta a área clicável */
}

.user-photo {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full, 9999px);
  object-fit: cover;
  border: 2px solid var(--color-border, #e9ecef);
  transition: all var(--transition-base, 0.3s ease);
  display: block;
}

/* Melhora o feedback visual ao interagir com o menu do usuário */
.user-menu:hover .user-photo {
  border-color: var(--color-primary, #007bff);
  transform: scale(1.05);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + var(--spacing-sm, 8px));
  right: 0;
  background-color: var(--color-surface, #ffffff);
  padding: var(--spacing-sm, 8px); 
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-lg, 0 10px 15px rgba(0, 0, 0, 0.15));
  min-width: 220px;
  z-index: 1000;
  border: 1px solid var(--color-border, #e9ecef);
  animation: slideDown var(--transition-base, 0.3s ease);
}

.user-name {
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-primary, #333333);
  margin-bottom: var(--spacing-xs, 4px);
  padding: var(--spacing-sm, 8px) var(--spacing-md, 12px); /* Adiciona padding para alinhar texto */
}

.user-email {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-text-secondary, #6c757d);
  margin-bottom: var(--spacing-md, 12px);
  word-break: break-word;
  padding: 0 var(--spacing-md, 12px); /* Adiciona padding para alinhar texto */
}

.user-dropdown .dropdown-item {
  display: block;
  color: var(--color-danger, #dc3545);
  padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
  border-radius: var(--radius-sm, 4px);
  font-weight: var(--font-weight-medium, 500);
  font-size: var(--font-size-sm, 0.875rem);
  text-align: center;
  transition: all var(--transition-fast, 0.15s ease-out);
  border: 1px solid var(--color-danger, #dc3545);
}

.user-dropdown .dropdown-item:hover {
  background-color: var(--color-danger, #dc3545);
  color: var(--color-text-inverse, #ffffff);
}

/* --- Botão Login --- */
.login-btn {
  background-color: var(--color-primary, #007bff);
  color: var(--color-text-inverse, #ffffff);
  padding: var(--spacing-sm, 8px) var(--spacing-lg, 16px);
  border-radius: var(--radius-md, 8px);
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-sm, 0.875rem);
  transition: all var(--transition-base, 0.3s ease);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  white-space: nowrap;
}

.login-btn:hover {
  background-color: var(--color-primary-dark, #0056b3);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* --- Responsividade Otimizada --- */

@media (max-width: 1200px) {
  /* No desktop/tablet grande, esconde o texto dos links secundários */
  .nav-links a:not(.caixa-link, .dropdown-btn) span:not(.link-icon) {
    display: none;
  }
  
  /* Ajusta o padding para que sejam apenas ícones (Caixa e Mais mantêm o texto) */
  .nav-links a:not(.caixa-link) {
    padding: var(--spacing-sm, 8px); 
    text-align: center;
  }
  
  /* Garante que o texto 'Caixa' e 'Mais' permaneçam */
  .caixa-link span:not(.link-icon),
  .dropdown-btn span:not(.dropdown-arrow) {
    display: inline;
  }
}

@media (max-width: 768px) {
  nav {
    padding: 0 var(--spacing-md, 12px);
    height: 60px; /* Reduz a altura da navbar */
  }
  
  .nav-left {
    gap: var(--spacing-md, 12px);
  }
  
  .logo-text {
    display: none; /* Esconde o nome da loja, mantendo apenas o ícone */
  }
  
  /* Esconde o link "Perfil" para mobile, priorizando o menu de foto do usuário */
  .profile-link {
    display: none;
  }
  
  /* Altera a exibição para todos os links serem apenas ícones no menu */
  .nav-links {
    gap: var(--spacing-xs, 4px);
  }

  /* Esconde todos os textos dos links (exceto os ícones) */
  .nav-links a span:not(.link-icon, .dropdown-arrow) {
    display: none;
  }

  /* Faz com que todos os links (agora ícones) fiquem com padding quadrado e maior para facilitar o toque */
  .nav-links a {
    padding: var(--spacing-sm, 8px);
    font-size: var(--font-size-md, 1rem); 
  }
  
  /* Garante que o ícone do Caixa ainda seja visível e proeminente */
  .caixa-link {
    padding: var(--spacing-sm, 8px) !important;
  }
  
  .caixa-link .link-icon {
    font-size: 1.2rem; 
  }
}
</style>
