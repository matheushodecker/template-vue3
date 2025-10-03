// src/api/FormaPagamentoApi.js
import axios from "axios";

export default class FormaPagamentoApi {
    // GET: Buscar todas as formas de pagamento
    async buscarTodasFormas(page = 1, search = "") {
        const { data } = await axios.get(`/formas-pagamento/?page=${page}&search=${search}`);
        return data;
    }

    // POST: Adicionar nova forma
    async adicionarForma(forma) {
        const { data } = await axios.post("/formas-pagamento/", forma);
        return data;
    }

    // PUT: Atualizar forma existente
    async atualizarForma(forma) {
        const { data } = await axios.put(`/formas-pagamento/${forma.id}/`, forma);
        return data;
    }

    // DELETE: Excluir forma
    async excluirForma(id) {
        await axios.delete(`/formas-pagamento/${id}/`);
    }
}