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
/* --- Padrão CRUD Responsivo - Adicionar ao final --- */
@media (max-width: 768px) {
  .crud-container {
    padding: 10px;
  }

  h1 {
    font-size: 1.5rem;
    flex-wrap: wrap;
  }

  /* --- Formulários: Uma coluna só --- */
  .form-grid, 
  .grid-cols-2, .grid-cols-3, .grid-cols-4, .grid-cols-5 {
    grid-template-columns: 1fr !important; /* Força 1 coluna */
    gap: 16px;
  }
  
  .form-group.span-2, .form-group.span-3, .form-group.span-4 {
    grid-column: span 1 !important;
  }

  /* Ajuste de Checkbox para ficar alinhado */
  .checkbox-group.align-end {
    align-items: center;
    padding-top: 0;
    margin-top: 10px;
  }

  /* Botões de Ação do Formulário (Salvar/Cancelar) */
  .form-actions {
    flex-direction: column-reverse; /* Salvar em cima, Cancelar embaixo */
    gap: 12px;
  }
  .form-actions button {
    width: 100%;
    height: 48px;
  }

  /* --- Listas: Transformar linhas em CARDS --- */
  .list-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
    gap: 12px;
    border-radius: 12px;
    background: white;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    margin-bottom: 12px;
  }

  /* Cabeçalho do Card */
  .item-main-info {
    width: 100%;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-border-light);
    padding-bottom: 8px;
    margin-bottom: 4px;
  }
  .item-name {
    font-size: 1.1rem;
    font-weight: bold;
  }

  /* Detalhes do Card */
  .item-details {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-start; /* Alinha tags à esquerda */
  }

  .detail-tag {
    font-size: 0.85rem;
    padding: 4px 10px;
  }

  /* Ações do Card (Botões Editar/Excluir) */
  .item-actions {
    width: 100%;
    display: flex;
    justify-content: flex-end; /* Botões à direita */
    gap: 16px;
    margin-top: 8px;
    border-top: 1px dashed var(--color-border-light);
    padding-top: 8px;
  }

  .btn-action {
    font-size: 1.4rem; /* Ícones maiores para toque */
    padding: 8px 16px;
    background-color: var(--color-background); /* Fundo cinza para parecer botão */
    border-radius: 8px;
  }
}
</style>