// js/jogador.js

const player = document.getElementById('player');
// NOTA: As variáveis 'gameOver' e 'gamePaused' são globais (definidas em jogo-urbano.js) e usadas aqui.

// === CONSTANTES DE FÍSICA E POSIÇÃO ===
let isJumping = false;
// 🎯 PADRONIZADO: Limite do "chão" em pixels. Use este valor (Ex: 50) em todos os seus CSS de fase.
const minBottom = -80;

const GRAVIDADE_SUBIDA = 0.5;
const FATOR_QUEDA_FORCADA = 3.0;
const jumpVelocity = 20;
let verticalVelocity = 0;

// --- INICIALIZAÇÃO E POSIÇÃO BASE ---
if (player) {
    // Inicializa o jogador na altura padrão do chão (50px)
    player.style.bottom = minBottom + 'px';
}


/**
 * Executa o movimento vertical (gravidade e pulo) a cada frame do jogo.
 * CRUCIAL: ESTA FUNÇÃO NÃO CHAMA MAIS requestAnimationFrame. 
 * ELA DEVE SER CHAMADA UMA VEZ POR FRAME DENTRO DO gameLoop() EM js/jogo-urbano.js.
 */
function applyGravity() {
    // Não é necessário checar gamePaused/gameOver aqui, pois o gameLoop em js/jogo-urbano.js
    // deve garantir que esta função só seja chamada se o jogo estiver rodando.
    if (!player) return;

    let currentBottom = parseInt(player.style.bottom) || minBottom;

    // 1. Aplica a velocidade vertical
    currentBottom += verticalVelocity;

    // 2. Aplica a Gravidade Dinâmica
    let gravidadeAtual = GRAVIDADE_SUBIDA;

    // Se o jogador está caindo (verticalVelocity é negativo)
    if (verticalVelocity < 0) {
        // Aumenta a gravidade para forçar uma queda mais rápida
        gravidadeAtual = GRAVIDADE_SUBIDA * FATOR_QUEDA_FORCADA;
    }

    verticalVelocity -= gravidadeAtual; // Aplica a gravidade (diminui a subida ou aumenta a descida)

    // 3. Checa se atingiu o chão (limite mínimo)
    if (currentBottom <= minBottom) {
        currentBottom = minBottom;
        isJumping = false; // Permite pular novamente
        verticalVelocity = 0;
    }

    // 4. Aplica a nova posição
    player.style.bottom = currentBottom + 'px';

    // REMOVIDO: requestAnimationFrame(applyGravity)
}


/**
 * Inicia o movimento de pulo (desvio)
 */
function jump() {
    // === NOVO: BLOQUEIO CENTRALIZADO DO PULOS ===
    // Verifica os estados globais definidos em jogo-urbano.js
    if (typeof gameOver !== 'undefined' && gameOver) return;
    if (typeof gamePaused !== 'undefined' && gamePaused) return;
    // ======================================

    if (!isJumping) {
        isJumping = true;
        verticalVelocity = jumpVelocity; // Impulso inicial para cima

        // Verifica se a função existe (definida em jogo-urbano.js)
        if (typeof playJumpSound === 'function') {
            playJumpSound();
        }
    }
}

// --- DETECÇÃO DE ENTRADA (Input) ---
document.addEventListener('keydown', (event) => {

    // === NOVO: BLOQUEIO CENTRALIZADO DO PULOS NO INPUT ===
    // Verifica os estados globais definidos em jogo-urbano.js
    if (typeof gameOver !== 'undefined' && gameOver) return;
    if (typeof gamePaused !== 'undefined' && gamePaused) return;
    // ======================================

    // Tecla de pulo (BARRA DE ESPAÇO)
    if (event.key === ' ') {
        event.preventDefault(); // Impede rolagem da página
        jump();
    }
});

// --- INÍCIO DO JOGO ---
// NENHUM requestAnimationFrame aqui. O loop de física é sincronizado com o gameLoop.