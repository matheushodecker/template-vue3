import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import CategoriaView from "../views/CategoriaView.vue";
import LoginView from "../views/LoginView.vue";
import LogoutView from "../views/LogoutView.vue";
import UsuarioView from "../views/UsuarioView.vue";
import FornecedorView from "../views/FornecedorView.vue";
import CargoView from "../views/CargoView.vue";
import FuncionarioView from "../views/FuncionarioView.vue";
import ClienteView from "../views/ClienteView.vue";


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/categorias",
      name: "categorias",
      component: CategoriaView,
    },
    {
      path: "/fornecedor",
      name: "fornecedor",
      component: FornecedorView,

    },
         {
      path: "/cargo",
      name: "cargo",
      component:CargoView ,
    },
      {
      path: "/funcionario",
      name: "funcionario",
      component: FuncionarioView,
    },
      {
      path: "/cliente",
      name: "cliente",
      component: ClienteView ,
    },
    //   {
    //   path: "",
    //   name: "",
    //   component: ,
    // },
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
    {
      path: "/usuario",
      name: "usuario",
      component: UsuarioView,
    },
    {
      path: "/logout",
      name: "logout",
      component: LogoutView,
    }
  ],
});

export default router;
