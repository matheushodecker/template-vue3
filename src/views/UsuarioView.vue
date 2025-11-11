<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

// Inicializa a store de autenticação
const authStore = useAuthStore();

// Cria uma referência computada e reativa para o usuário
// O componente será atualizado sempre que 'authStore.user' mudar
const usuario = computed(() => authStore.user);

/**
 * Formata uma string de data para o padrão brasileiro (dd/mm/aaaa, hh:mm).
 * @param {string | null} dateString - A data em formato de string (ISO 8601).
 * @returns {string | null} A data formatada ou null se a entrada for inválida.
 */
const formatDate = (dateString) => {
  if (!dateString) return null;

  const date = new Date(dateString);
  
  // Verifica se a data é válida antes de formatar
  if (isNaN(date.getTime())) {
    return 'Data inválida';
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<template>
  <div class="profile-container">
    <!-- Renderiza o card de perfil apenas se o objeto 'usuario' existir -->
    <div v-if="usuario" class="profile-card">
      <h1>
        <span class="icon">👤</span> Informações do Usuário
      </h1>

      <div class="profile-content">
        <div class="profile-header">
          <!-- 
            CORREÇÃO 1: Usa optional chaining (?.) para acessar 'usuario.foto.url'.
            Isso evita erros se 'usuario.foto' for nulo ou indefinido.
          -->
          <img 
            v-if="usuario.foto?.url" 
            :src="usuario.foto.url" 
            alt="Foto do usuário" 
            class="user-photo" 
          />
          <!-- Imagem padrão caso o usuário não tenha foto -->
          <img 
            v-else 
            src="https://avatar.vercel.sh/user.svg?text=User"
            alt="Avatar padrão" 
            class="user-photo" 
          />
          
          <div class="user-identity">
            <p class="user-name">{{ usuario.name || 'Nome não disponível' }}</p>
            <p class="user-email">{{ usuario.email || 'Email não disponível' }}</p>
          </div>
        </div>
        
        <div class="profile-details">
          <div class="detail-item">
            <span class="label">ID do Usuário</span>
            <span class="value">{{ usuario.id }}</span>
          </div>

          <div class="detail-item">
            <span class="label">Último Login</span>
            <span class="value">{{ formatDate(usuario.last_login ) || 'Nunca logado' }}</span>
          </div>

          <div class="detail-item">
            <span class="label">Grupos</span>
            <span class="value">
              <!-- 
                CORREÇÃO 2: Usa optional chaining (?.) para acessar 'usuario.groups.length'.
                Isso previne erros se 'usuario.groups' não existir.
              -->
               <span v-if="usuario.groups?.length > 0" class="group-tags">
                <span v-for="group in usuario.groups" :key="group.id" class="tag">
                  {{ group.name }}
                </span>
              </span>
              <span v-else>Nenhum grupo</span>
            </span>
          </div>

          <div class="detail-item">
            <span class="label">Permissões</span>
            <span class="value permission-tags">
              <span class="tag" v-if="usuario.is_superuser">Superuser</span>
              <span class="tag" v-if="usuario.is_staff">Staff</span>
              <span class="tag" v-if="usuario.is_active">Ativo</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Mensagem exibida enquanto os dados do usuário estão sendo carregados -->
    <div v-else class="loading-message">
      Carregando informações do usuário...
    </div>
  </div>
</template>

<style scoped>
/* Estilos para o container principal */
.profile-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
}

/* Card que envolve o conteúdo do perfil */
.profile-card {
  padding: var(--spacing-lg, 2rem);
  background-color: var(--color-surface, #fff);
  border-radius: var(--border-radius-lg, 12px);
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05));
  border: 1px solid var(--color-border-light, #e2e8f0);
}

/* Título principal */
h1 {
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 1rem);
  font-size: var(--font-size-display, 1.8rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-secondary, #334155);
  margin-bottom: var(--spacing-lg, 2rem);
  padding-bottom: var(--spacing-md, 1rem);
  border-bottom: 2px solid var(--color-border-light, #e2e8f0);
}

h1 .icon {
  font-size: 2.2rem;
}

/* Conteúdo do perfil */
.profile-content {
  padding: var(--spacing-md, 1rem) 0;
}

/* Cabeçalho com foto e nome */
.profile-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg, 1.5rem);
  margin-bottom: var(--spacing-xl, 2.5rem);
}

.user-photo {
  width: 100px;
  height: 100px;
  border-radius: var(--border-radius-full, 50%);
  object-fit: cover;
  border: 4px solid var(--color-border-light, #e2e8f0);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0,0,0,0.05));
}

.user-identity {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: var(--font-size-xxl, 1.5rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-primary, #1e293b);
  margin: 0;
}

.user-email {
  font-size: var(--font-size-lg, 1.125rem);
  color: var(--color-text-secondary, #64748b);
  margin: 0;
}

/* Detalhes do perfil em grid */
.profile-details {
  display: grid;
  gap: var(--spacing-lg, 1.5rem);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

.detail-item .label {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-text-secondary, #64748b);
  font-weight: var(--font-weight-medium, 500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-item .value {
  font-size: var(--font-size-md, 1rem);
  color: var(--color-text-primary, #1e293b);
  font-weight: var(--font-weight-medium, 500);
}

/* Estilos para as tags de grupo e permissões */
.group-tags, .permission-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm, 0.5rem);
}

.tag {
  background-color: var(--color-accent, #4f46e5);
  color: var(--color-text-inverse, #fff);
  padding: var(--spacing-xs, 0.25rem) var(--spacing-md, 0.75rem);
  border-radius: var(--border-radius-full, 9999px);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
}

/* Mensagem de carregamento */
.loading-message {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #64748b;
}
</style>
