// Arquivo: js/jogo-urbano.js (Antigo game.js)

const gameArea = document.getElementById('game-area-urbano');
const scoreElement = document.getElementById('score');
const playerElement = document.getElementById('player');
const trashCounters = {
    plastic: document.querySelector('#plastic-count .count-value'),
    metal: document.querySelector('#metal-count .count-value'),
    paper: document.querySelector('#paper-count .count-value'),
    glass: document.querySelector('#glass-count .count-value'),
    organic: document.querySelector('#organic-count .count-value'),
};

// NOVO: Elementos do Modal de Colisão
const gameOverModal = document.getElementById('game-over-modal');
const restartButton = document.getElementById('restart-button');

// === NOVO: ELEMENTOS DO COUNTDOWN E FIM DE FASE ===
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownText = document.getElementById('countdown-text');

// NOVO: Elemento do Modal de Fim de Fase
const phaseCompleteMessage = document.getElementById('phase-complete-message');


// =========================================================
// CONFIGURAÇÃO DE ÁUDIO (ADIÇÃO DE EFEITOS SONOROS E MÚSICA DE FUNDO)
// =========================================================
const audioColetarLixo = new Audio('../public/assets/sons/coletar-lixo.mp3');
const audioGameOver = new Audio('../public/assets/sons/game-over.mp3');
const audioPulo = new Audio('../public/assets/sons/pular.mp3');
const audioContagemInicio = new Audio('../public/assets/sons/contagem-inicio.mp3');

// === NOVAS VARIÁVEIS PARA MÚSICAS DE FUNDO ===
const audioMusicaFundoUrbano = new Audio('../public/assets/sons/cidade.mp3');
const audioMusicaFundoFloresta = new Audio('../public/assets/sons/floresta.mp3');
const audioMusicaFundoMar = new Audio('../public/assets/sons/fundo-do-mar.mp3');

const musicasFundo = {
    'urbano': audioMusicaFundoUrbano,
    'floresta': audioMusicaFundoFloresta,
    'oceano': audioMusicaFundoMar
    // Mantenha 'urbano-poluido' como a chave, ou adicione as chaves dos outros cenários.
    // 'urbano-poluido' corresponde à FASE_ATUAL atual.
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
        // Usa console.warn para registrar a falha na reprodução
        console.warn("Falha ao reproduzir som de pulo. Verifique a ordem dos scripts no HTML e o caminho do arquivo de áudio. Erro:", e.message);
    });
}

function playContagemInicioSound() {
    audioContagemInicio.currentTime = 0;
    audioContagemInicio.play().catch(e => console.warn("Falha ao tocar som de contagem:", e.message));
}


// === NOVA LÓGICA DE MÚSICA DE FUNDO ===

/**
 * Gerencia a reprodução da música de fundo com base na fase atual.
 * @param {string} fase - A fase atual ('urbano-poluido', 'floresta', 'oceano').
 * @param {boolean} shouldPlay - True para tocar, false para apenas pausar outras.
 */
function gerenciarMusicaFundo(shouldPlay = true) {
    const currentAudio = musicasFundo[FASE_ATUAL];

    // 1. Pausa todas as músicas (reset total)
    Object.keys(musicasFundo).forEach(key => {
        const audio = musicasFundo[key];
        audio.pause();
        // Não reseta currentTime aqui, pois isso pode interromper a transição suave
        // O restartPhase fará o reset se necessário.
    });

    // 2. Toca a música da fase atual (se shouldPlay for true)
    if (shouldPlay && currentAudio) {
        currentAudio.loop = true;
        currentAudio.volume = 0.5; // Volume padrão
        currentAudio.play().catch(e => {
            // Este erro é comum em alguns navegadores (autoplay bloqueado)
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
let gamePaused = true; // DEFINIDO COMO TRUE: O jogo começa PAUSADO até o countdown terminar!

let lixos = [];
let obstaculos = [];
let spawnTimer = 0;
let obstaculoSpawnTimer = 0;

const SPAWN_INTERVAL = 150; // Tempo entre a criação de lixos (em frames)
const OBSTACULO_SPAWN_INTERVAL = 150; // Dropa obstáculos com menos frequência
const SCROLL_SPEED = 9; // Velocidade de movimento dos lixos 

// Constante para ajustar a área de colisão (Hitbox)
const HITBOX_PADDING = 50;

// ⭐ ADICIONADO: CONSTANTE DE SEGURANÇA PARA EVITAR PROXIMIDADE (250px à esquerda e direita)
const SPAWN_SAFETY_MARGIN = 250; 

// === NOVO: VARIÁVEL GLOBAL PARA A FASE (URBANO POLUÍDO) ===
const FASE_ATUAL = 'urbano';
// Se você criar novas fases, esta variável deve ser atualizada para corresponder ao tema do background
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
 * Exibe o modal personalizado e pausa o jogo. (MODIFICADA COM ÁUDIO)
 */
function showCollisionModal() {
    // 1. Toca o som de Game Over/Colisão
    playGameOverSound();

    // === NOVO: PAUSA A MÚSICA DE FUNDO ===
    gerenciarMusicaFundo(false); // Pausa, mas não tenta tocar nada.
    // =====================================

    // 2. Pausa o jogo e exibe o modal
    gamePaused = true;
    gameOverModal.classList.remove('hidden');

    // PAUSA a animação CSS do cenário
    gameArea.style.animationPlayState = 'paused';
}

/**
 * Reinicia a fase: zera contadores e remove todos os itens da tela. 
 * Esta função é chamada pelo clique no botão. (MODIFICADA)
 */
function restartPhase() {
    // 1. Esconde o modal e libera o jogo
    gameOverModal.classList.add('hidden');
    gameOver = false; // Garante que o estado de game over foi resetado

    // === NOVO: RESETA A MÚSICA PARA O INÍCIO ===
    const currentAudio = musicasFundo[FASE_ATUAL];
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    // ===========================================

    // Zera contadores e limpa itens (Steps 2-6)
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

    // O gameLoop será retomado após o countdown, dentro da função startCountdown.
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
 * Cria um novo lixo aleatório, verificando proximidade de obstáculos. (CORRIGIDO)
 */
function spawnLixo() {
    // Certifique-se que LIXO_TYPES é acessível (vindo de lixo.js)
    if (typeof LIXO_TYPES === 'undefined' || LIXO_TYPES.length === 0) return;

    const typeData = LIXO_TYPES[Math.floor(Math.random() * LIXO_TYPES.length)];
    // Assumindo que Lixo é uma classe global definida em lixo.js
    const newLixo = new Lixo(typeData.type, typeData.src, gameArea);
    
    // ⭐ NOVO AJUSTE: VERIFICAÇÃO DE PROXIMIDADE (Lixo contra Obstáculos)
    let proximityDetected = false;
    const lixoRect = newLixo.getBounds();
    
    // Checa proximidade APENAS contra os obstáculos
    for (const obstaculo of obstaculos) {
        const obstaculoRect = obstaculo.getBounds();
        
        // Define a "área de proibição" expandida do obstáculo
        const forbiddenArea = {
            // A área proibida começa à esquerda do obstáculo + margem
            x: obstaculoRect.x - SPAWN_SAFETY_MARGIN, 
            // A largura cobre o obstáculo mais as margens de segurança (2 * margem)
            width: obstaculoRect.width + (SPAWN_SAFETY_MARGIN * 2), 
            y: obstaculoRect.y, 
            height: obstaculoRect.height 
        };
        
        // Verifica a intersecção (Horizontal e Vertical)
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
        // Se houve proximidade perigosa com um obstáculo, remove o lixo criado.
        newLixo.element.remove();
        console.log(`Lixo removido devido à proximidade perigosa com obstáculo (margem de segurança: ${SPAWN_SAFETY_MARGIN}px).`);
    } else {
        // Se não houve colisão, adiciona o lixo ao jogo.
        lixos.push(newLixo);
    }
}

/**
 * Cria um novo obstáculo aleatório, filtrando-o pela fase atual (urbano-poluido) e verificando proximidade. (CORRIGIDO)
 */
function spawnObstaculo() {
    // Verifica se a classe Obstaculo e os tipos existem (vindos de obstaculo.js)
    if (typeof Obstaculo === 'undefined' || typeof OBSTACULO_TYPES === 'undefined' || OBSTACULO_TYPES.length === 0) return;

    // 🎯 CORREÇÃO: Filtra o array global para incluir APENAS obstáculos desta fase.
    const faseTipos = OBSTACULO_TYPES.filter(obs => obs.fase === FASE_ATUAL);

    // Se não houver tipos para esta fase, interrompe.
    if (faseTipos.length === 0) return;

    // 1. Pega o objeto de dados aleatoriamente da lista FILTRADA.
    const typeData = faseTipos[Math.floor(Math.random() * faseTipos.length)];

    // 2. Passa o objeto de dados INTEIRO para o construtor
    const newObstaculo = new Obstaculo(typeData, gameArea);
    
    // ⭐ NOVO AJUSTE: VERIFICAÇÃO DE PROXIMIDADE (Obstáculo contra Lixos e outros Obstáculos)
    let proximityDetected = false;
    const obstaculoRect = newObstaculo.getBounds();
    
    // Checa proximidade contra TODOS os itens já spawnados (lixos e obstaculos)
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
    gamePaused = false; // Permite que o jogo execute
    gameArea.style.animationPlayState = 'running'; // Retoma a animação CSS do cenário

    // === NOVO: INICIA MÚSICA DE FUNDO AQUI ===
    gerenciarMusicaFundo(true);
    // ============================================

    requestAnimationFrame(gameLoop); // Inicia o loop do jogo
}

/**
 * Inicia a contagem regressiva 3, 2, 1, GO!
 * @param {number} startValue - O número inicial da contagem (ex: 3).
 */
function startCountdown(startValue = 3) {
    let count = startValue;

    // CHAMADA DE ÁUDIO CORRIGIDA: Toca o som em todo início/reinício
    playContagemInicioSound();

    // 1. Garante que o jogo está pausado
    gamePaused = true;
    gameArea.style.animationPlayState = 'paused';

    // 2. Mostra o overlay e o primeiro número
    countdownOverlay.classList.remove('hidden');
    countdownText.textContent = count;
    countdownText.style.animation = 'pulse 0.8s ease-out';

    // 3. Define o intervalo para a contagem regressiva
    const intervalId = setInterval(() => {
        count--;

        if (count > 0) {
            // 3, 2, 1
            countdownText.textContent = count;
            // Reinicia a animação 'pulse'
            countdownText.style.animation = 'none';
            void countdownText.offsetWidth;
            countdownText.style.animation = 'pulse 0.8s ease-out';

        } else if (count === 0) {
            // GO!
            countdownText.textContent = "GO!";
            countdownText.style.animation = 'none';
            void countdownText.offsetWidth;
            countdownText.style.animation = 'pulse 0.8s ease-out';

        } else {
            // Fim da contagem
            clearInterval(intervalId);

            // Esconde o overlay suavemente
            countdownOverlay.style.opacity = 0;

            setTimeout(() => {
                countdownOverlay.classList.add('hidden');
                countdownOverlay.style.opacity = 1;

                // 4. INICIA O JOGO DE VERDADE
                runGameLogic();

            }, 300); // Tempo para a transição de opacidade
        }
    }, 1000); // 1000ms = 1 segundo
}

// =========================================================
// LOOP PRINCIPAL E FINALIZAÇÃO
// =========================================================

/**
 * Loop principal do jogo.
 */
function gameLoop() {
    // Se o jogo estiver pausado ou acabou, saia imediatamente.
    if (gameOver || gamePaused) return;

    // === ADIÇÃO ESSENCIAL: CHAMA A LÓGICA DE FÍSICA DO JOGADOR ===
    // Isso garante que o movimento do jogador (gravidade e pulo) só ocorra se o jogo não estiver pausado/terminado.
    if (typeof applyGravity === 'function') {
        applyGravity();
    }
    // =============================================================

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

    // A. Lógica para Lixos (MODIFICADA COM ÁUDIO)
    for (let i = lixos.length - 1; i >= 0; i--) {
        const lixo = lixos[i];
        lixo.move(SCROLL_SPEED);

        // A. Verifica Colisão
        if (checkCollision(lixo)) {
            playColetarLixoSound(); // <-- Toca o som de coleta
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

    // B. Lógica para Obstáculos (A colisão chama showCollisionModal, que toca o som)
    for (let i = obstaculos.length - 1; i >= 0; i--) {
        const obstaculo = obstaculos[i];
        obstaculo.move(SCROLL_SPEED);

        // A. Verifica Colisão com Obstáculo
        if (checkCollision(obstaculo)) {
            showCollisionModal(); // Esta função agora toca o som de Game Over
            return; // Interrompe o loop imediatamente.
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
 * * MODIFICADO: Salva o tema da fase no localStorage para o background da classificação.
 */
function endGame() {
    gameOver = true; // Define o estado de fim de jogo (CRUCIAL PARA BLOQUEAR O PULO)

    // === NOVO: PAUSA A MÚSICA DE FUNDO ===
    gerenciarMusicaFundo(false);
    // =====================================

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

    // === NOVO: SALVA O TEMA DA FASE PARA O BACKGROUND NA CLASSIFICAÇÃO ===
    localStorage.setItem('faseConcluida', FASE_ATUAL);

    // NOVO: Salva a chave da FASE POLUÍDA atual para o inventario.js usar
    localStorage.setItem('faseAtualPoluida', `${FASE_ATUAL}-poluido`);

    // E, para o background da classificação, use a fase poluída correta:
    localStorage.setItem('faseParaClassificacao', `${FASE_ATUAL}-poluido`);
    // ====================================================================

    console.log("Fim de Jogo! Total de Lixos Coletados: " + totalTrashCollected);

    // 2. NOVO: Exibe a mensagem de fase concluída
    phaseCompleteMessage.classList.remove('hidden');

    // 3. NOVO: Define um timer para redirecionar automaticamente (ex: 4 segundos)
    setTimeout(() => {
        window.location.href = 'classificacao.html';
    }, 4000); // 4000 milissegundos (4 segundos)
}

// --- CONFIGURAÇÃO DE EVENTOS ---
// ADICIONADO: Escutador de evento para o botão de restart
if (restartButton) {
    // Ao reiniciar, chama o countdown novamente
    restartButton.addEventListener('click', restartPhase);
}


// --- INÍCIO ---
// NOVO: Em vez de iniciar o gameLoop diretamente, iniciamos a contagem regressiva
// O gameLoop será chamado pela função runGameLogic() após o countdown.
document.addEventListener('DOMContentLoaded', () => {
    // Garante que o cenário está pausado enquanto o countdown acontece
    gameArea.style.animationPlayState = 'paused';
    startCountdown(3); // startCountdown agora toca o som!
});