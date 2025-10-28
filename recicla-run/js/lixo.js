// Arquivo: js/lixo.js

class Lixo {
    constructor(tipo, src, gameArea) {
        this.tipo = tipo; 
        this.element = document.createElement('img');
        this.element.src = src;
        this.element.className = 'lixo-item'; 
        this.element.dataset.type = tipo;
        
        this.x = gameArea.offsetWidth;
        
const POSICAO_CHAO_Y = (gameArea.offsetHeight * 0.95) - 60; 
        
        const POSICAO_AR_Y = (gameArea.offsetHeight * 0.7) - 60;
        
        if (Math.random() < 0.5) { 
             this.y = POSICAO_CHAO_Y;
        } else {
             this.y = POSICAO_AR_Y;
        }
        
        this.element.style.position = 'absolute';
        this.element.style.width = '60px'; 
        this.element.style.height = '60px'; 
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

const LIXO_TYPES = [
    { type: 'plastic', src: '../public/assets/imagens/lixos/GarrafaPlastico.png' },
    { type: 'metal', src: '../public/assets/imagens/lixos/LataMetal.png' },
    { type: 'paper', src: '../public/assets/imagens/lixos/BolaPapel.png' },
    { type: 'glass', src: '../public/assets/imagens/lixos/PoteVidro.png' },
    { type: 'organic', src: '../public/assets/imagens/lixos/CascaBanana.png' }
];