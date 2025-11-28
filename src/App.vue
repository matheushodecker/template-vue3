<script setup>
import Navbar from './views/NavBar.vue'
</script>

<template>
  <Navbar />
  <main class="app-main-content">
    <RouterView />
  </main>
</template>

<style>
/* ============================================
   SISTEMA DE DESIGN GLOBAL (REIMAGINADO)
============================================
*/
:root {
  /* --- Paleta de Cores --- */
  --color-primary: #41b883; /* Verde Vue (Principal) */
  --color-primary-dark: #358a66; /* Para hover */
  --color-primary-light: #e6f7ee; /* Para fundos sutis */
  
  --color-secondary: #34495e; /* Azul/Cinza Escuro (Títulos, Texto Forte) */
  
  --color-accent: #3498db; /* Azul (Botões de Editar, Info) */
  --color-accent-dark: #2980b9; /* Para hover */

  --color-danger: #e74c3c; /* Vermelho (Excluir, Erros, Inativo) */
  --color-danger-dark: #c0392b; /* Para hover */
  
  --color-warning: #f39c12; /* Laranja (Pendente, Estoque Baixo) */
  --color-success: #27ae60; /* Verde Sucesso (Finalizada, Recebido) */

  /* --- Cores de UI (Interface) --- */
  --color-text-primary: #2c3e50; /* Cor de texto principal (um pouco mais suave que o preto) */
  --color-text-secondary: #7f8c8d; /* Cor de texto para labels, descrições */
  --color-text-inverse: #ffffff; /* Texto sobre fundos escuros/coloridos */
  
  --color-background: #f5f7fa; /* Fundo principal da aplicação (cinza muito claro) */
  --color-surface: #ffffff; /* Fundo de cards, modais, inputs */
  
  --color-border: #e0e0e0; /* Bordas de inputs, divisores */
  --color-border-light: #f0f0f0; /* Divisores mais sutis */

  /* --- Tipografia --- */
  --font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-size-base: 16px;
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-md: 1rem;      /* 16px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem;  /* 20px */
  --font-size-xxl: 1.5rem;   /* 24px */
  --font-size-display: 2rem; /* 32px */

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* --- Layout e Espaçamento --- */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;

  /* --- Bordas e Sombras --- */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 16px; /* Cantos mais suaves para cards */
  --border-radius-full: 9999px;

  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 10px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 25px rgba(0, 0, 0, 0.1);

  /* --- Transições --- */
  --transition-base: 0.2s ease-in-out;
}

/* --- Resets Globais e Estilos Base --- */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background-color: var(--color-background);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* --- Layout Principal da Aplicação --- */
.app-main-content {
  /* O padding-top garante que o conteúdo não fique atrás da NavBar sticky */
  padding: calc(72px + var(--spacing-lg)) var(--spacing-lg) var(--spacing-lg);
  max-width: 1600px;
  margin: 0 auto;
}

/* --- Estilos Globais de Formulário (Reutilizáveis) --- */
/* (Estilos mais específicos ficam nos componentes) */

label {
  display: block;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-sm);
}

input[type='text'],
input[type='number'],
input[type='tel'],
input[type='email'],
input[type='url'],
input[type='date'],
input[type='datetime-local'],
select,
textarea {
  width: 100%;
  padding: 10px 14px;
  font-size: var(--font-size-md);
  font-family: var(--font-family-base);
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-base);
}

input::placeholder,
textarea::placeholder {
  color: #a0aec0; /* Cinza mais claro para placeholder */
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

input:disabled,
select:disabled,
textarea:disabled {
  background-color: var(--color-background);
  color: var(--color-text-secondary);
  cursor: not-allowed;
}

/* --- Estilos Globais de Botão (Reutilizáveis) --- */
/* (Pode ser estendido nos componentes) */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border: 1px solid transparent;
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  text-decoration: none;
  text-transform: none; /* Design profissional moderno raramente usa uppercase */
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  box-shadow: var(--shadow-sm);
}
.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.btn-accent {
  background-color: var(--color-accent);
  color: var(--color-text-inverse);
  box-shadow: var(--shadow-sm);
}
.btn-accent:hover:not(:disabled) {
  background-color: var(--color-accent-dark);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.btn-danger {
  background-color: var(--color-danger);
  color: var(--color-text-inverse);
  box-shadow: var(--shadow-sm);
}
.btn-danger:hover:not(:disabled) {
  background-color: var(--color-danger-dark);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.btn-secondary {
  background-color: var(--color-secondary);
  color: var(--color-text-inverse);
}
.btn-secondary:hover:not(:disabled) {
  background-color: #5a6d80; /* Um pouco mais claro */
}

.btn-light {
  background-color: var(--color-background);
  color: var(--color-text-secondary);
  border-color: var(--color-border);
}
.btn-light:hover:not(:disabled) {
  background-color: #e2e6ea;
}


.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* --- Estilos de Loading e Alertas (Reutilizáveis) --- */
.loading-message {
  text-align: center;
  color: var(--color-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-xxl) 0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  background-color: var(--color-background);
  border-radius: var(--border-radius-md);
  border: 1px dashed var(--color-border);
}

.error-message {
  padding: var(--spacing-md);
  background-color: #fff5f5;
  border: 1px solid var(--color-danger);
  color: var(--color-danger-dark);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
  text-align: center;
  margin-bottom: var(--spacing-md);
}

/* --- App.vue - Adicionar ao final do style --- */
@media (max-width: 768px) {
  .app-main-content {
    /* Reduz o padding lateral para ganhar espaço */
    padding: calc(72px + 16px) 12px 16px 12px !important; 
    overflow-x: hidden; /* Evita scroll horizontal indesejado */
  }

  /* Ajuste global de tipografia para leitura */
  body {
    font-size: 14px; /* Base mínima recomendada */
  }

  /* Botões mais altos para facilitar o toque (Área de toque > 44px) */
  button, .btn, input, select {
    min-height: 44px; 
  }
}

</style>