// Arquivo: js/jogo-florestal.js (Cópia e adaptação do jogo-urbano.js com LÓGICA DE PROXIMIDADE CORRIGIDA)

// =========================================================
// VARIÁVEIS DE ELEMENTOS (AJUSTADAS PARA A FASE FLORESTAL)
// =========================================================
const gameArea = document.getElementById('game-area-florestal'); // MUDANÇA: ID da área de jogo
const scoreElement = document.getElementById('score');
const playerElement = document.getElementById('player');
const trashCounters = {
    plastic: document.querySelector('#plastic-count .count-value'),
    metal: document.querySelector('#metal-count .count-value'),
    paper: document.querySelector('#paper-count .count-value'),
    glass: document.querySelector('#glass-count .count-value'),
    organic: document.querySelector('#organic-count .count-value'),
};

// Elementos do Modal de Colisão
const gameOverModal = document.getElementById('game-over-modal');
const restartButton = document.getElementById('restart-button');

// Elementos do Countdown e Fim de Fase
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownText = document.getElementById('countdown-text');
const phaseCompleteMessage = document.getElementById('phase-complete-message');


// =========================================================
// CONFIGURAÇÃO DE ÁUDIO (Mantém o mesmo sistema de áudio)
// =========================================================
const audioColetarLixo = new Audio('../public/assets/sons/coletar-lixo.mp3');
const audioGameOver = new Audio('../public/assets/sons/game-over.mp3');
const audioPulo = new Audio('../public/assets/sons/pular.mp3');
const audioContagemInicio = new Audio('../public/assets/sons/contagem-inicio.mp3');

// MÚSICAS DE FUNDO
const audioMusicaFundoUrbano = new Audio('../public/assets/sons/cidade.mp3');
const audioMusicaFundoFloresta = new Audio('../public/assets/sons/floresta.mp3');
const audioMusicaFundoMar = new Audio('../public/assets/sons/fundo-do-mar.mp3');

const musicasFundo = {
    'urbano-poluido': audioMusicaFundoUrbano,
    'florestal': audioMusicaFundoFloresta, // NOVO: Chave 'florestal'
    'oceano': audioMusicaFundoMar
};
// ==============================================


/**
 * Toca o som de coleta de lixo.
 */
function playColetarLixoSound() {
    audioColetarLixo.currentTime = 0;
    audioColetarLixo.play().catch(e => console.log("Erro ao tocar som de coleta:", e));
}

/**
 * Toca o som de Game Over/Colisão com Obstáculo.
 */
function playGameOverSound() {
    audioGameOver.currentTime = 0;
    audioGameOver.play().catch(e => console.log("Erro ao tocar som de game over:", e));
}

/**
 * Toca o som de Pulo (Chamado a partir de js/jogador.js).
 */
function playJumpSound() {
    audioPulo.currentTime = 0;
    audioPulo.play().catch(e => {
        console.warn("Falha ao reproduzir som de pulo. Erro:", e.message);
    });
}

function playContagemInicioSound() {
    audioContagemInicio.currentTime = 0;
    audioContagemInicio.play().catch(e => console.warn("Falha ao tocar som de contagem:", e.message));
}


// === NOVA LÓGICA DE MÚSICA DE FUNDO ===

/**
 * Gerencia a reprodução da música de fundo com base na fase atual.
 * @param {boolean} shouldPlay - True para tocar, false para apenas pausar outras.
 */
function gerenciarMusicaFundo(shouldPlay = true) {
    const currentAudio = musicasFundo[FASE_ATUAL];

    // 1. Pausa todas as músicas (reset total)
    Object.keys(musicasFundo).forEach(key => {
        const audio = musicasFundo[key];
        audio.pause();
    });

    // 2. Toca a música da fase atual (se shouldPlay for true)
    if (shouldPlay && currentAudio) {
        currentAudio.loop = true;
        currentAudio.volume = 0.5; // Volume padrão
        currentAudio.play().catch(e => {
            console.log(`Música de fundo da fase ${FASE_ATUAL} não iniciada automaticamente. Erro:`, e.message);
        });
    }
}

// =========================================================
// VARIÁVEIS DO JOGO
// =========================================================
let score = 0;
let totalTrashCollected = 0;
const MAX_TRASH = 15; // Regra: Jogo acaba após 15 lixos
let gameOver = false;
let gamePaused = true;

let lixos = [];
let obstaculos = [];
let spawnTimer = 0;
let obstaculoSpawnTimer = 0;

const SPAWN_INTERVAL = 150;
const OBSTACULO_SPAWN_INTERVAL = 150;
const SCROLL_SPEED = 9;

const HITBOX_PADDING = 50;

// ⭐ CONSTANTE DE SEGURANÇA (Adicionada)
const SPAWN_SAFETY_MARGIN = 250; 

// === MUDANÇA ESSENCIAL: VARIÁVEL GLOBAL PARA A FASE ===
const FASE_ATUAL = 'florestal'; // MUDANÇA: Define a fase como 'florestal'
// ==========================================================

/**
 * Atualiza o placar e os contadores na tela.
 */
function updateHUD(type) {
    score++;
    totalTrashCollected++;
    scoreElement.textContent = `Lixos Coletados: ${score}`;

    if (type && trashCounters[type]) {
        let currentCount = parseInt(trashCounters[type].textContent) || 0;
        trashCounters[type].textContent = currentCount + 1;
    }

    if (totalTrashCollected >= MAX_TRASH) {
        endGame();
    }
}

/**
 * Exibe o modal personalizado e pausa o jogo.
 */
function showCollisionModal() {
    playGameOverSound();

    // Pausa a música de fundo
    gerenciarMusicaFundo(false);

    gamePaused = true;
    gameOverModal.classList.remove('hidden');

    // PAUSA a animação CSS do cenário
    gameArea.style.animationPlayState = 'paused';
}

/**
 * Reinicia a fase.
 */
function restartPhase() {
    // 1. Esconde o modal e libera o jogo
    gameOverModal.classList.add('hidden');
    gameOver = false;

    // === NOVO: RESETA A MÚSICA PARA O INÍCIO ===
    const currentAudio = musicasFundo[FASE_ATUAL];
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    // ===========================================

    // Zera contadores e limpa itens 
    score = 0;
    totalTrashCollected = 0;
    scoreElement.textContent = `Lixos Coletados: 0`;
    Object.values(trashCounters).forEach(counter => {
        counter.textContent = 0;
    });

    lixos.forEach(lixo => lixo.element.remove());
    lixos = [];
    obstaculos.forEach(obstaculo => obstaculo.element.remove());
    obstaculos = [];

    spawnTimer = 0;
    obstaculoSpawnTimer = 0;

    // 7. Inicia a contagem (que retomará o gameLoop e a música)
    startCountdown(3);
}

/**
 * Verifica colisão entre o jogador e um item (lixo ou obstáculo).
 */
function checkCollision(item) {
    // 1. Obtém os limites visuais
    const playerRect = playerElement.getBoundingClientRect();
    const itemRect = item.getBounds();

    // 2. Aplica o ajuste de padding para criar a hitbox real
    const playerHitbox = {
        x: playerRect.x + HITBOX_PADDING,
        y: playerRect.y + HITBOX_PADDING,
        width: playerRect.width - (HITBOX_PADDING * 2),
        height: playerRect.height - (HITBOX_PADDING * 2)
    };

    const itemHitbox = {
        x: itemRect.x + HITBOX_PADDING,
        y: itemRect.y + HITBOX_PADDING,
        width: itemRect.width - (HITBOX_PADDING * 2),
        height: itemRect.height - (HITBOX_PADDING * 2)
    };

    // 3. Verifica a intersecção usando as novas hitboxes ajustadas
    return playerHitbox.x < itemHitbox.x + itemHitbox.width &&
        playerHitbox.x + playerHitbox.width > itemHitbox.x &&
        playerHitbox.y < itemHitbox.y + itemHitbox.height &&
        playerHitbox.y + playerHitbox.height > itemHitbox.y;
}

/**
 * Cria um novo lixo aleatório, verificando proximidade de obstáculos.
 */
function spawnLixo() {
    if (typeof LIXO_TYPES === 'undefined' || LIXO_TYPES.length === 0) return;

    const typeData = LIXO_TYPES[Math.floor(Math.random() * LIXO_TYPES.length)];
    const newLixo = new Lixo(typeData.type, typeData.src, gameArea);
    
    // ⭐ LÓGICA DE PROXIMIDADE CORRIGIDA (Lixo contra Obstáculos)
    let proximityDetected = false;
    const lixoRect = newLixo.getBounds();
    
    for (const obstaculo of obstaculos) {
        const obstaculoRect = obstaculo.getBounds();
        
        // Define a "área de proibição" expandida do obstáculo
        const forbiddenArea = {
            x: obstaculoRect.x - SPAWN_SAFETY_MARGIN, 
            width: obstaculoRect.width + (SPAWN_SAFETY_MARGIN * 2), 
            y: obstaculoRect.y, 
            height: obstaculoRect.height 
        };
        
        // Verifica a intersecção 
        const horizontalOverlap = lixoRect.x < forbiddenArea.x + forbiddenArea.width &&
                                  lixoRect.x + lixoRect.width > forbiddenArea.x;

        const verticalOverlap = lixoRect.y < forbiddenArea.y + forbiddenArea.height &&
                                lixoRect.y + lixoRect.height > forbiddenArea.y;

        if (horizontalOverlap && verticalOverlap) {
            proximityDetected = true;
            break;
        }
    }

    if (proximityDetected) {
        newLixo.element.remove();
        console.log(`Lixo removido devido à proximidade perigosa com obstáculo (margem de segurança: ${SPAWN_SAFETY_MARGIN}px).`);
    } else {
        lixos.push(newLixo);
    }
}

/**
 * Cria um novo obstáculo aleatório, verificando proximidade de Lixos e outros Obstáculos.
 */
function spawnObstaculo() {
    if (typeof Obstaculo === 'undefined' || typeof OBSTACULO_TYPES === 'undefined' || OBSTACULO_TYPES.length === 0) return;

    // 🎯 Filtra o array global para incluir APENAS obstáculos desta fase.
    const faseTipos = OBSTACULO_TYPES.filter(obs => obs.fase === FASE_ATUAL);

    // Se não houver tipos para esta fase, interrompe.
    if (faseTipos.length === 0) return;

    // 1. Seleciona um obstáculo aleatório da lista filtrada.
    const typeData = faseTipos[Math.floor(Math.random() * faseTipos.length)];
    const newObstaculo = new Obstaculo(typeData, gameArea);

    // ⭐ LÓGICA DE PROXIMIDADE ADICIONADA: Checa contra Lixos e outros Obstáculos
    let proximityDetected = false;
    const obstaculoRect = newObstaculo.getBounds();
    
    // Checa proximidade contra TODOS os itens já spawnados
    const itemsToCheck = [...lixos, ...obstaculos];
    
    for (const item of itemsToCheck) {
        const itemRect = item.getBounds();
        
        // Define a "área de proibição" expandida do item existente
        const forbiddenArea = {
            x: itemRect.x - SPAWN_SAFETY_MARGIN, 
            width: itemRect.width + (SPAWN_SAFETY_MARGIN * 2), 
            y: itemRect.y, 
            height: itemRect.height 
        };
        
        // Verifica a intersecção
        const horizontalOverlap = obstaculoRect.x < forbiddenArea.x + forbiddenArea.width &&
                                  obstaculoRect.x + obstaculoRect.width > forbiddenArea.x;

        const verticalOverlap = obstaculoRect.y < forbiddenArea.y + forbiddenArea.height &&
                                obstaculoRect.y + obstaculoRect.height > forbiddenArea.y;

        if (horizontalOverlap && verticalOverlap) {
            proximityDetected = true;
            break; 
        }
    }

    if (proximityDetected) {
        // Se houve proximidade perigosa, remove o obstáculo criado.
        newObstaculo.element.remove();
        console.log(`Obstáculo removido devido à proximidade perigosa com outro item (margem de segurança: ${SPAWN_SAFETY_MARGIN}px).`);
    } else {
        // Se não houve colisão ou proximidade, adiciona o obstáculo ao jogo.
        obstaculos.push(newObstaculo);
    }
}

// =========================================================
// LÓGICA DO COUNTDOWN
// =========================================================

/**
 * Chamada após o countdown. Inicia a lógica principal e o gameLoop.
 */
function runGameLogic() {
    gamePaused = false;
    gameArea.style.animationPlayState = 'running';

    // INICIA A MÚSICA DE FUNDO
    gerenciarMusicaFundo(true);

    requestAnimationFrame(gameLoop);
}

/**
 * Inicia a contagem regressiva 3, 2, 1, GO!
 * @param {number} startValue - O número inicial da contagem (ex: 3).
 */
function startCountdown(startValue = 3) {
    let count = startValue;

    playContagemInicioSound();

    gamePaused = true;
    gameArea.style.animationPlayState = 'paused';

    countdownOverlay.classList.remove('hidden');
    countdownText.textContent = count;
    countdownText.style.animation = 'pulse 0.8s ease-out';

    const intervalId = setInterval(() => {
        count--;

        if (count > 0) {
            countdownText.textContent = count;
            countdownText.style.animation = 'none';
            void countdownText.offsetWidth;
            countdownText.style.animation = 'pulse 0.8s ease-out';

        } else if (count === 0) {
            countdownText.textContent = "GO!";
            countdownText.style.animation = 'none';
            void countdownText.offsetWidth;
            countdownText.style.animation = 'pulse 0.8s ease-out';

        } else {
            clearInterval(intervalId);

            countdownOverlay.style.opacity = 0;

            setTimeout(() => {
                countdownOverlay.classList.add('hidden');
                countdownOverlay.style.opacity = 1;

                // INICIA O JOGO DE VERDADE
                runGameLogic();

            }, 300);
        }
    }, 1000);
}

// =========================================================
// LOOP PRINCIPAL E FINALIZAÇÃO
// =========================================================

/**
 * Loop principal do jogo.
 */
function gameLoop() {
    if (gameOver || gamePaused) return;

    // CHAMA A LÓGICA DE FÍSICA DO JOGADOR
    if (typeof applyGravity === 'function') {
        applyGravity();
    }

    // 1. SPWAN DE LIXO e OBSTÁCULOS
    spawnTimer++;
    if (spawnTimer >= SPAWN_INTERVAL) {
        spawnLixo();
        spawnTimer = 0;
    }

    // Spawn de Obstáculo
    obstaculoSpawnTimer++;
    if (obstaculoSpawnTimer >= OBSTACULO_SPAWN_INTERVAL) {
        spawnObstaculo();
        obstaculoSpawnTimer = 0;
    }

    // 2. MOVER, COLISÃO e LIMPEZA

    // A. Lógica para Lixos
    for (let i = lixos.length - 1; i >= 0; i--) {
        const lixo = lixos[i];
        lixo.move(SCROLL_SPEED);

        // A. Verifica Colisão
        if (checkCollision(lixo)) {
            playColetarLixoSound();
            updateHUD(lixo.tipo);
            lixo.element.remove();
            lixos.splice(i, 1);
            continue;
        }

        // B. Limpa Lixo que Saiu da Tela
        if (lixo.isOffScreen()) {
            lixo.element.remove();
            lixos.splice(i, 1);
        }
    }

    // B. Lógica para Obstáculos
    for (let i = obstaculos.length - 1; i >= 0; i--) {
        const obstaculo = obstaculos[i];
        obstaculo.move(SCROLL_SPEED);

        // A. Verifica Colisão com Obstáculo
        if (checkCollision(obstaculo)) {
            showCollisionModal();
            return;
        }

        // B. Limpa Obstáculo que Saiu da Tela
        if (obstaculo.isOffScreen()) {
            obstaculo.element.remove();
            obstaculos.splice(i, 1);
        }
    }

    requestAnimationFrame(gameLoop);
}

/**
 * Finaliza o jogo (Regra dos 15 lixos)
 * Salva o tema da fase no localStorage para o background da classificação.
 */
function endGame() {
    gameOver = true;

    // PAUSA A MÚSICA DE FUNDO
    gerenciarMusicaFundo(false);

    // Pausa o cenário
    gameArea.style.animationPlayState = 'paused';

    // 1. ARMAZENA AS CONTAGENS NO LOCAL STORAGE
    const collectedData = {
        plastic: parseInt(trashCounters.plastic.textContent) || 0,
        metal: parseInt(trashCounters.metal.textContent) || 0,
        paper: parseInt(trashCounters.paper.textContent) || 0,
        glass: parseInt(trashCounters.glass.textContent) || 0,
        organic: parseInt(trashCounters.organic.textContent) || 0,
    };

    localStorage.setItem('collectedTrashCounts', JSON.stringify(collectedData));

    // SALVA O TEMA DA FASE (FLORESTAL) PARA O BACKGROUND NA CLASSIFICAÇÃO
    localStorage.setItem('faseConcluida', FASE_ATUAL);

    // NOVO: Salva a chave da FASE POLUÍDA atual para o inventario.js usar
    localStorage.setItem('faseAtualPoluida', `${FASE_ATUAL}-poluido`);

    // E, para o background da classificação, use a fase poluída correta:
    localStorage.setItem('faseParaClassificacao', `${FASE_ATUAL}-poluido`);

    console.log("Fim de Jogo! Total de Lixos Coletados: " + totalTrashCollected);

    // 2. Exibe a mensagem de fase concluída
    phaseCompleteMessage.classList.remove('hidden');

    // 3. Define um timer para redirecionar automaticamente (ex: 4 segundos)
    setTimeout(() => {
        window.location.href = 'classificacao.html';
    }, 4000);
}

// --- CONFIGURAÇÃO DE EVENTOS ---
if (restartButton) {
    restartButton.addEventListener('click', restartPhase);
}


// --- INÍCIO ---
document.addEventListener('DOMContentLoaded', () => {
    // Garante que o cenário está pausado enquanto o countdown acontece
    gameArea.style.animationPlayState = 'paused';
    startCountdown(3);
});