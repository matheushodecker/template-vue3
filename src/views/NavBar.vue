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
        <router-link :to="{ name: 'home' }" class="logo">Livraria</router-link>
        <router-link :to="{ name: 'categorias' }">Categorias</router-link>
      </div>

      <div class="nav-right" v-if="isLoggedIn">
        <!-- Link para o perfil alinhado à esquerda -->
        <router-link to="/usuario" class="profile-link">Perfil</router-link>

        <!-- Foto do usuário com dropdown -->
        <div class="user-menu" @click="toggleDropdown">
          <img
            v-if="user.foto && user.foto.url"
            :src="user.foto.url"
            alt="Foto do usuário"
            class="user-photo-small"
          />
          <img
            v-else
            src="https://via.placeholder.com/50"
            alt="Sem foto"
            class="user-photo-small"
          />

          <div v-if="showDropdown" class="dropdown-menu">
            <p><strong>{{ user.name }}</strong></p>
            <p class="email">{{ user.email }}</p> <!-- Adiciona classe email -->
            <router-link to="/logout" class="dropdown-item">Logout</router-link>
          </div>
        </div>
      </div>

      <div class="nav-right" v-else>
        <router-link to="/login" class="login-btn">Login</router-link>
      </div>
    </nav>
  </header>
</template>

<style scoped>
/* Estilos gerais da barra de navegação */
.navbar {
  background-color: #343a40;
  color: #fff;
  padding: 15px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-left {
  display: flex;
  align-items: center;
}

.nav-left a {
  color: #fff;
  text-decoration: none;
  margin-right: 20px;
  font-weight: bold;
}

.logo {
  font-size: 1.5rem;
}

.nav-right {
  display: flex;
  align-items: center;
}

.profile-link {
  color: #fff;
  text-decoration: none;
  margin-right: 15px;
  font-weight: bold;
}

.user-menu {
  position: relative;
  cursor: pointer;
}

.user-photo-small {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  transition: border-color 0.3s;
}

.user-photo-small:hover {
  border-color: #4a90e2;
}

/* Dropdown menu */
.dropdown-menu {
  position: absolute;
  top: 50px;
  right: 0;
  background-color: #fff;
  color: #333;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
  z-index: 1000;
  min-width: 200px; /* Define um tamanho mínimo para o dropdown */
}

.dropdown-menu p {
  margin: 0;
  padding: 5px 0;
}

.dropdown-item {
  display: block;
  color: #333;
  text-decoration: none;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f4f4f4;
}

/* Estilo específico para o email */
.email {
  word-wrap: break-word; /* Garante que o e-mail quebre de forma adequada se for longo */
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 10px;
}

/* Estilos do botão de login */
.login-btn {
  background-color: #555;
  padding: 10px 20px;
  color: white;
  border-radius: 5px;
  text-decoration: none;
  transition: background-color 0.3s;
}

.login-btn:hover {
  background-color: #000;
}

/* Responsividade */
@media (max-width: 600px) {
  .navbar {
    padding: 10px;
  }

  .nav-left a {
    margin-right: 10px;
  }

  .user-photo-small {
    width: 35px;
    height: 35px;
  }
}
</style>
