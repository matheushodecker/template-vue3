<script setup>
import "@passageidentity/passage-elements/passage-auth";
const appId = import.meta.env.VITE_PASSAGE_APP_ID;
</script>

<template>
  <div class="container">
    <h1>Login</h1>
    <div class="authContainer">
      <passage-auth :app-id="appId"></passage-auth>
    </div>
  </div>
</template>

<style scoped>
body {
  font-family: "Arial", sans-serif;
  background-color: #f4f4f9;
  margin: 0;
  padding: 20px;
  color: #333;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

h1 {
  font-size: 2rem;
  color: #343a40;
  margin-bottom: 30px;
  text-align: center;
}

.authContainer {
  background-color: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  margin: 20px auto;
  text-align: center;
}

@media (max-width: 600px) {
  .authContainer {
    padding: 20px;
    max-width: 90%;
  }
}
</style>
