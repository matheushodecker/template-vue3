<script setup>
import "@passageidentity/passage-elements/passage-auth";
const appId = import.meta.env.VITE_PASSAGE_APP_ID;
</script>

<template>
  <div class="login-page-container">
    <div class="login-box">
      <div class="login-header">
        <span class="logo-icon">🏪</span>
        <h1>Login</h1>
        <p>Acesse o painel de gestão</p>
      </div>
      <div class="auth-container">
        <passage-auth :app-id="appId"></passage-auth>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 72px - 48px); /* Tela - Navbar - Padding */
  width: 100%;
}

.login-box {
  width: 100%;
  max-width: 450px;
  background-color: var(--color-surface);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden; /* Garante que o conteúdo respeite a borda */
}

.login-header {
  text-align: center;
  padding: var(--spacing-lg);
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border-light);
}
.login-header .logo-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-sm);
}
.login-header h1 {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}
.login-header p {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

.auth-container {
  padding: var(--spacing-lg) var(--spacing-xl);
}

/* O Passage insere estilos, mas podemos tentar sobrescrever alguns */
:global(passage-auth) {
  /* Tenta forçar a largura total */
  width: 100% !important;
}
</style>