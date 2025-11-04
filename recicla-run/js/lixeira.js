// lixeira.js

/**
 * Classe Lixeira
 * Responsável por definir as propriedades de cada lixeira no cenário
 * e por gerenciar a lógica de depósito (separação) do lixo coletado.
 */
class Lixeira {
    /**
     * @param {string} tipoDeLixo - O tipo de lixo que esta lixeira aceita (ex: 'Plástico', 'Metal').
     * @param {number} x - Posição X da lixeira no cenário.
     * @param {number} y - Posição Y da lixeira no cenário.
     * @param {string} imagem - Caminho para o arquivo de imagem da lixeira.
     */
    constructor(tipoDeLixo, x, y, imagem) {
        this.tipo = tipoDeLixo;
        this.x = x;
        this.y = y;
        this.imagem = imagem; // Para renderização
        this.elementosDepositados = 0; // Contador de itens depositados nesta lixeira
    }

    /**
     * Verifica se o item de lixo é compatível com o tipo de lixeira.
     * @param {Object} itemLixo - Um objeto representando o item de lixo (assumido ser da classe Lixo).
     * @returns {boolean} True se o tipo for compatível, False caso contrário.
     */
    aceitaLixo(itemLixo) {
        // Assumindo que o itemLixo tem uma propriedade 'tipo'
        return itemLixo.tipo === this.tipo;
    }

    /**
     * Lógica para depositar um item de lixo.
     * @param {Object} itemLixo - O item de lixo a ser depositado.
     * @param {Object} inventario - A instância do Inventario (da classe inventario.js).
     * @returns {boolean} True se o depósito foi bem-sucedido (separação correta).
     */
    depositarLixo(itemLixo, inventario) {
        if (this.aceitaLixo(itemLixo)) {
            // Depósito correto
            this.elementosDepositados++;
            inventario.removerLixo(itemLixo); // Remove do inventário do jogador
            console.log(`Lixo de tipo ${itemLixo.tipo} depositado corretamente na lixeira ${this.tipo}.`);
            // Poderia emitir um evento para atualizar a pontuação
            return true;
        } else {
            // Depósito incorreto (erro)
            console.error(`ERRO: Lixo de tipo ${itemLixo.tipo} depositado incorretamente na lixeira ${this.tipo}.`);
            // Poderia emitir um evento para aplicar uma penalidade
            return false;
        }
    }
}

// Exporta a classe para ser usada nos arquivos de jogo (ex: jogo-urbano.js, jogo-florestal.js)
// Em um ambiente Node.js: module.exports = Lixeira;
// Em um ambiente de navegador com scripts modulares: export { Lixeira };