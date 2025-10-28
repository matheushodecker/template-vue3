<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
const usuario = computed(() => authStore.user);
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
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
    <div v-if="usuario" class="profile-card">
      <h1><span class="icon">👤</span> Informações do Usuário</h1>
      <div class="profile-content">
        <div class="profile-header">
          <img 
            v-if="usuario.foto && usuario.foto.url" 
            :src="usuario.foto.url" 
            alt="Foto" 
            class="user-photo" 
          />
          <img 
            v-else 
            src="https://avatar.vercel.sh/user.svg?text=User"
            alt="Foto" 
            class="user-photo" 
          />
          <div class="user-identity">
            <p class="user-name">{{ usuario.name }}</p>
            <p class="user-email">{{ usuario.email }}</p>
          </div>
        </div>
        
        <div class="profile-details">
          <div class="detail-item">
            <span class="label">ID do Usuário</span>
            <span class="value">{{ usuario.id }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Último Login</span>
            <span class="value">{{ formatDate(usuario.last_login) || 'Nunca logado' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Grupos</span>
            <span class="value">
               <span v-if="usuario.groups.length > 0" class="group-tags">
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
    <div v-else class="loading-message">
      Carregando informações do usuário...
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
}
.profile-card {
  padding: var(--spacing-lg);
  background-color: var(--color-surface);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
}

h1 {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-display);
  font-weight: var(--font-weight-bold);
  color: var(--color-secondary);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--color-border-light);
}
h1 .icon {
  font-size: 2.2rem;
}

.profile-content {
  padding: var(--spacing-md);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}
.user-photo {
  width: 100px;
  height: 100px;
  border-radius: var(--border-radius-full);
  object-fit: cover;
  border: 4px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
}
.user-identity {
  display: flex;
  flex-direction: column;
}
.user-name {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.user-email {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
}

.profile-details {
  display: grid;
  gap: var(--spacing-lg);
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.detail-item .label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
}
.detail-item .value {
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.group-tags, .permission-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}
.tag {
  background-color: var(--color-accent);
  color: var(--color-text-inverse);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}
</style>