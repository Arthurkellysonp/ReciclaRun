// js/mensagemEducativa.js

/**
 * Classe responsável por criar e gerenciar a exibição de mensagens educativas na tela.
 * Esta classe é genérica e apenas lida com a APARÊNCIA e TEMPORIZAÇÃO da mensagem.
 */
class MensagemEducativa {
    /**
     * @param {string} mensagem - O texto educativo a ser exibido (ex: "Parabéns!").
     * @param {HTMLElement} parentElement - O elemento HTML onde a mensagem será inserida (ex: document.body).
     * @param {number} duracao - Duração em milissegundos que a mensagem ficará visível (padrão: 5000ms).
     */
    constructor(mensagem, parentElement, duracao = 5000) {
        this.mensagem = mensagem;
        this.parentElement = parentElement;
        this.duracao = duracao;
        this.element = this.createElement();
    }

    /**
     * Cria o elemento HTML da mensagem e aplica estilos básicos.
     * @returns {HTMLElement} O div da mensagem.
     */
    createElement() {
        const div = document.createElement('div');
        div.classList.add('mensagem-educativa');
        div.textContent = this.mensagem;

        // Estilos básicos para centralizar (sugestão: mover para um arquivo CSS dedicado)
        div.style.position = 'fixed';
        div.style.top = '30%';
        div.style.left = '50%';
        div.style.transform = 'translate(-50%, -50%)';
        div.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        div.style.color = 'white';
        div.style.padding = '20px';
        div.style.borderRadius = '10px';
        div.style.zIndex = '1000';
        div.style.textAlign = 'center';
        div.style.fontSize = '24px';
        div.style.opacity = '0';
        div.style.transition = 'opacity 0.5s ease-in-out';
        
        return div;
    }

    /**
     * Exibe a mensagem na tela com um efeito de fade-in.
     */
    show() {
        this.parentElement.appendChild(this.element);
        
        // Exibe com transição (fade-in)
        setTimeout(() => {
            this.element.style.opacity = '1';
        }, 10); // Pequeno atraso para garantir que a transição funcione

        // Inicia o timer para remover após a duração
        setTimeout(() => {
            this.hide();
        }, this.duracao);
    }
    
    /**
     * Remove a mensagem da tela com um efeito de fade-out.
     */
    hide() {
        this.element.style.opacity = '0';
        setTimeout(() => {
            // Remove o elemento do DOM apenas após a transição terminar
            if (this.element.parentElement) {
                this.element.parentElement.removeChild(this.element);
            }
        }, 500); // Espera a duração da transição de opacidade (0.5s)
    }
}