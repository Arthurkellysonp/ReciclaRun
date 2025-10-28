// Arquivo: js/obstaculo.js

class Obstaculo {
    constructor(typeData, gameArea) {
        this.element = document.createElement('img');
        this.element.src = typeData.src;
        this.element.className = 'obstaculo-item';

        this.x = gameArea.offsetWidth;

        const OBSTACULO_WIDTH = typeData.width;
        const OBSTACULO_HEIGHT = typeData.height;
        // NOVO: Lê o offset (deslocamento) do objeto typeData. 
        // Se não for definido, assume 0.
        const Y_OFFSET = typeData.y_offset || 0;

        // A linha base (chão) é o limite inferior da gameArea.
        const CHAO_BASE = gameArea.offsetHeight;

        // Posição Final = Linha Base - Altura do Obstáculo + Deslocamento 
        // Se Y_OFFSET for POSITIVO, ele DESCE. Se for NEGATIVO, ele sobe (flutua).
        const POSICAO_CHAO_Y = CHAO_BASE - OBSTACULO_HEIGHT + Y_OFFSET;

        this.y = POSICAO_CHAO_Y;

        this.element.style.position = 'absolute';
        this.element.style.width = `${OBSTACULO_WIDTH}px`;
        this.element.style.height = `${OBSTACULO_HEIGHT}px`;
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;

        gameArea.appendChild(this.element);
    }

    move(speed) {
        this.x -= speed;
        this.element.style.left = `${this.x}px`;
    }

    isOffScreen() {
        return this.x < -this.element.offsetWidth;
    }

    getBounds() {
        return this.element.getBoundingClientRect();
    }
}

// =========================================================
// TIPOS DE OBSTÁCULOS (UNIFICADO PARA TODAS AS FASES)
// =========================================================

const OBSTACULO_TYPES = [
    // -------------------------------------------------------------------
    // OBSTÁCULOS DA CIDADE (URBANO)
    // -------------------------------------------------------------------
    { src: '../public/assets/imagens/obstaculosCidade/Carro.png', width: 200, height: 200, y_offset: 60, fase: 'urbano' },

    { src: '../public/assets/imagens/obstaculosCidade/Cone.png', width: 100, height: 100, y_offset: 10, fase: 'urbano' }, // Desce 10px

    { src: '../public/assets/imagens/obstaculosCidade/Moto.png', width: 230, height: 230, y_offset: 60, fase: 'urbano' }, // Sobe 5px

    { src: '../public/assets/imagens/obstaculosCidade/Placa.png', width: 120, height: 120, y_offset: 25, fase: 'urbano' },

    // -------------------------------------------------------------------
    // NOVOS OBSTÁCULOS DA FLORESTA (DESMATADO)
    // -------------------------------------------------------------------
    // Observação: Ajustei os offsets para que pareçam estar no chão ou flutuando.

    { src: '../public/assets/imagens/obstaculosFloresta/Fogo.png', width: 120, height: 120, y_offset: -35, fase: 'florestal' },

    { src: '../public/assets/imagens/obstaculosFloresta/Tronco.png', width: 120, height: 120, y_offset: -25, fase: 'florestal' }, // Grande no chão

    { src: '../public/assets/imagens/obstaculosFloresta/Toco.png', width: 100, height: 100, y_offset: -30, fase: 'florestal' }, // Buraco no chão (pode precisar de ajuste fino)

    { src: '../public/assets/imagens/obstaculosFloresta/Pedra.png', width: 170, height: 170, y_offset: -5, fase: 'florestal' }, // Pendurado (offset negativo)

    // -------------------------------------------------------------------
    // NOVOS OBSTÁCULOS DO OCEANO (OCEANO)
    // Com base nos arquivos 'obstaculosOceano'
    // -------------------------------------------------------------------
    { src: '../public/assets/imagens/obstaculosOceano/RedePesca.png', width: 180, height: 200, y_offset: 20, fase: 'oceano' },

    { src: '../public/assets/imagens/obstaculosOceano/Pneu.png', width: 170, height: 170, y_offset: 20, fase: 'oceano' },
    
    { src: '../public/assets/imagens/obstaculosOceano/Oleo.png', width: 150, height: 150, y_offset: -10, fase: 'oceano' },
    
    { src: '../public/assets/imagens/obstaculosOceano/Ancora.png', width: 150, height: 150, y_offset: -10, fase: 'oceano' }

    // Você deve implementar a lógica em jogo-urbano.js e jogo-florestal.js
    // para filtrar este array e usar apenas os obstáculos da FASE_ATUAL.
];