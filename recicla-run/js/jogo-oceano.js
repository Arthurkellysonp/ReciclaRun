// Arquivo: js/jogo-oceano.js (Lógica da Fase Oceano)

const gameArea = document.getElementById('game-area-oceano'); // 🎯 MUDANÇA: ID específico para o Oceano
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

// Elemento do Modal de Fim de Fase
const phaseCompleteMessage = document.getElementById('phase-complete-message');


// =========================================================
// CONFIGURAÇÃO DE ÁUDIO
// =========================================================
const audioColetarLixo = new Audio('../public/assets/sons/coletar-lixo.mp3');
const audioGameOver = new Audio('../public/assets/sons/game-over.mp3');
// 🎯 NOTA: Mudar o som do pulo, se necessário, para um som de 'impulso' ou 'nado'.
const audioPulo = new Audio('../public/assets/sons/pular.mp3'); 
const audioContagemInicio = new Audio('../public/assets/sons/contagem-inicio.mp3');

// VARIÁVEIS PARA MÚSICAS DE FUNDO
const audioMusicaFundoUrbano = new Audio('../public/assets/sons/cidade.mp3');
const audioMusicaFundoFloresta = new Audio('../public/assets/sons/floresta.mp3');
const audioMusicaFundoMar = new Audio('../public/assets/sons/fundo-do-mar.mp3');

const musicasFundo = {
    'urbano': audioMusicaFundoUrbano,
    'florestal': audioMusicaFundoFloresta,
    'oceano': audioMusicaFundoMar // 🎯 CHAVE CORRETA PARA O OCEANO
};

// Funções de som (manter as mesmas, pois são genéricas)
function playColetarLixoSound() {
    audioColetarLixo.currentTime = 0;
    audioColetarLixo.play().catch(e => console.log("Erro ao tocar som de coleta:", e));
}
function playGameOverSound() {
    audioGameOver.currentTime = 0;
    audioGameOver.play().catch(e => console.log("Erro ao tocar som de game over:", e));
}
function playJumpSound() {
    audioPulo.currentTime = 0;
    audioPulo.play().catch(e => {
        console.warn("Falha ao reproduzir som de pulo/impulso. Erro:", e.message);
    });
}
function playContagemInicioSound() {
    audioContagemInicio.currentTime = 0;
    audioContagemInicio.play().catch(e => console.warn("Falha ao tocar som de contagem:", e.message));
}


// === LÓGICA DE MÚSICA DE FUNDO ===
function gerenciarMusicaFundo(shouldPlay = true) {
    const currentAudio = musicasFundo[FASE_ATUAL]; // Pega a música 'oceano'

    // 1. Pausa todas as músicas
    Object.keys(musicasFundo).forEach(key => {
        const audio = musicasFundo[key];
        audio.pause();
    });

    // 2. Toca a música da fase atual
    if (shouldPlay && currentAudio) {
        currentAudio.loop = true;
        currentAudio.volume = 0.5;
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
const MAX_TRASH = 15; // Regra: Jogo acaba após 3 lixos (Mudar para 15 ou mais em produção)
let gameOver = false;
let gamePaused = true; 

let lixos = [];
let obstaculos = [];
let spawnTimer = 0;
let obstaculoSpawnTimer = 0;

const SPAWN_INTERVAL = 150; 
const OBSTACULO_SPAWN_INTERVAL = 300; 
const SCROLL_SPEED = 5; // 🎯 AJUSTE: Velocidade do oceano pode ser diferente
const HITBOX_PADDING = 50;

// === VARIÁVEL GLOBAL PARA A FASE (OCEANO) ===
const FASE_ATUAL = 'oceano'; // 🎯 CRÍTICO: DEFINE O TEMA DESTA FASE
// ==========================================================

// ... (Funções updateHUD, initSpawn - SEM ALTERAÇÃO) ...

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

function initSpawn() {
    spawnLixo();
    spawnLixo();
    spawnObstaculo();
}

function showCollisionModal() {
    playGameOverSound();
    gerenciarMusicaFundo(false); 
    gamePaused = true;
    gameOverModal.classList.remove('hidden');
    gameArea.style.animationPlayState = 'paused';
}

function restartPhase() {
    gameOverModal.classList.add('hidden');
    gameOver = false; 

    const currentAudio = musicasFundo[FASE_ATUAL];
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

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
    initSpawn();

    startCountdown(3);
}

// ... (Função checkCollision - SEM ALTERAÇÃO) ...
function checkCollision(item) {
    const playerRect = playerElement.getBoundingClientRect();
    const itemRect = item.getBounds();

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

    return playerHitbox.x < itemHitbox.x + itemHitbox.width &&
        playerHitbox.x + playerHitbox.width > itemHitbox.x &&
        playerHitbox.y < itemHitbox.y + itemHitbox.height &&
        playerHitbox.y + playerHitbox.height > itemHitbox.y;
}

// ... (Função spawnLixo - SEM ALTERAÇÃO) ...
function spawnLixo() {
    if (typeof LIXO_TYPES === 'undefined' || LIXO_TYPES.length === 0) return;

    const typeData = LIXO_TYPES[Math.floor(Math.random() * LIXO_TYPES.length)];
    const newLixo = new Lixo(typeData.type, typeData.src, gameArea);
    lixos.push(newLixo);
}

/**
 * Cria um novo obstáculo aleatório, filtrando-o pela fase atual ('oceano').
 */
function spawnObstaculo() {
    if (typeof Obstaculo === 'undefined' || typeof OBSTACULO_TYPES === 'undefined' || OBSTACULO_TYPES.length === 0) return;

    // 🎯 CRÍTICO: Filtra por FASE_ATUAL = 'oceano' para usar obstáculosOceanos
    const faseTipos = OBSTACULO_TYPES.filter(obs => obs.fase === FASE_ATUAL);

    if (faseTipos.length === 0) return;

    const typeData = faseTipos[Math.floor(Math.random() * faseTipos.length)];

    const newObstaculo = new Obstaculo(typeData, gameArea);

    obstaculos.push(newObstaculo);
}

// =========================================================
// LÓGICA DO COUNTDOWN
// =========================================================
function runGameLogic() {
    gamePaused = false; 
    gameArea.style.animationPlayState = 'running'; 
    initSpawn(); 

    // INICIA A MÚSICA DE FUNDO DO OCEANO
    gerenciarMusicaFundo(true);

    requestAnimationFrame(gameLoop); 
}

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

                runGameLogic();

            }, 300);
        }
    }, 1000);
}

// =========================================================
// LOOP PRINCIPAL E FINALIZAÇÃO
// =========================================================
function gameLoop() {
    if (gameOver || gamePaused) return;

    if (typeof applyGravity === 'function') {
        applyGravity();
    }

    // SPWAN DE LIXO e OBSTÁCULOS
    spawnTimer++;
    if (spawnTimer >= SPAWN_INTERVAL) {
        spawnLixo();
        spawnTimer = 0;
    }

    obstaculoSpawnTimer++;
    if (obstaculoSpawnTimer >= OBSTACULO_SPAWN_INTERVAL) {
        spawnObstaculo();
        obstaculoSpawnTimer = 0;
    }

    // Lógica para Lixos
    for (let i = lixos.length - 1; i >= 0; i--) {
        const lixo = lixos[i];
        lixo.move(SCROLL_SPEED);

        if (checkCollision(lixo)) {
            playColetarLixoSound(); 
            updateHUD(lixo.tipo);
            lixo.element.remove();
            lixos.splice(i, 1);
            continue;
        }

        if (lixo.isOffScreen()) {
            lixo.element.remove();
            lixos.splice(i, 1);
        }
    }

    // Lógica para Obstáculos
    for (let i = obstaculos.length - 1; i >= 0; i--) {
        const obstaculo = obstaculos[i];
        obstaculo.move(SCROLL_SPEED);

        if (checkCollision(obstaculo)) {
            showCollisionModal(); 
            return; 
        }

        if (obstaculo.isOffScreen()) {
            obstaculo.element.remove();
            obstaculos.splice(i, 1);
        }
    }

    requestAnimationFrame(gameLoop);
}

/**
 * Finaliza o jogo (Regra dos 3 lixos)
 * * Prepara o local storage para a classificação.
 */
function endGame() {
    gameOver = true; 

    gerenciarMusicaFundo(false);

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

    // 2. SALVA O TEMA DA FASE PARA O BACKGROUND NA CLASSIFICAÇÃO
    localStorage.setItem('faseConcluida', FASE_ATUAL); // Salva 'oceano'

    // 3. Salva a chave da FASE POLUÍDA atual para o inventario.js usar
    localStorage.setItem('faseAtualPoluida', `${FASE_ATUAL}-poluido`); // Salva 'oceano-poluido'

    // 4. Para o background da classificação:
    localStorage.setItem('faseParaClassificacao', `${FASE_ATUAL}-poluido`); //   Salva 'oceano-poluido'
    
    console.log("Fim de Jogo! Total de Lixos Coletados: " + totalTrashCollected);

    phaseCompleteMessage.classList.remove('hidden');

    // 5. Define um timer para redirecionar automaticamente
    setTimeout(() => {
        // 🎯 CORREÇÃO CRÍTICA: Redireciona para a TELA DE CLASSIFICAÇÃO, 
        // que por sua vez, redirecionará para o OCEANO LIMPO, e só então para o FINAL.
        window.location.href = 'classificacao.html'; 
    }, 4000); 
}

// --- CONFIGURAÇÃO DE EVENTOS ---
if (restartButton) {
    restartButton.addEventListener('click', restartPhase);
}


// --- INÍCIO ---
document.addEventListener('DOMContentLoaded', () => {
    gameArea.style.animationPlayState = 'paused';
    startCountdown(3); 
});

// === EXPORTS (Para uso em outros arquivos JS, se necessário) ===
// NOTA: Se você não estiver usando módulos, você precisa garantir que 'playJumpSound'
// esteja no escopo global para que 'jogador.js' possa chamá-lo.

// A linha abaixo é importante se o jogador.js chama esta função:
window.playJumpSound = playJumpSound;