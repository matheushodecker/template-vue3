import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import AuthService from '@/api/auth';
const authService = new AuthService();

export const useAuthStore = defineStore('auth', () => {
  const user = ref({});

  // O estado de login é computado a partir da presença de um objeto de usuário
  // Isso garante que a reatividade funcione corretamente no NavBar.vue
  const loggedIn = computed(() => Object.keys(user.value).length > 0);

  async function setToken(token) {
    // A chamada à API deve ser envolvida em um try/catch para tratamento de erro
    try {
      user.value = await authService.postUserToken(token);
    } catch (error) {
      console.error("Erro ao buscar dados do usuário após login:", error);
      user.value = {}; // Garante que o usuário não está logado em caso de falha
    }
  }

  function unsetToken() {
    user.value = {};
  }

  return { user, loggedIn, setToken, unsetToken };
});