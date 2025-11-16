// js/inventario.js
// Responsável por gerenciar os lixos coletados e a lógica de classificação (Drag and Drop) da Fase 2.

// === ELEMENTOS DOM ===
const lixeirasArea = document.getElementById('lixeiras-area');
const lixosInventario = document.getElementById('lixos-inventario');
const msgArea = document.getElementById('educational-message-area');
const finishButton = document.getElementById('finish-classification');
// Elemento de fundo para o background dinâmico
const backgroundElement = document.getElementById('classification-background');


// --- CONFIGURAÇÃO DE TEMPO ---
const TEMPO_PARA_TRANSICAO = 4000; // 4 segundos de espera antes de redirecionar (para o automático)

// --- DADOS ---
// Tipos de lixeira (DEVEM CORRESPONDER AO data-type NO HTML)
const LIXEIRA_TYPES = ['plastic', 'metal', 'paper', 'glass', 'organic'];

// NOVO: Dicionário para traduzir tipos internos (inglês) para exibição (português)
const LIXEIRA_TRADUCAO = {
    'plastic': 'PLÁSTICO',
    'metal': 'METAL',
    'paper': 'PAPEL',
    'glass': 'VIDRO',
    'organic': 'ORGÂNICO'
};

// Mapeamento de Lixo -> Tipo de lixeira
const LIXO_MAPPING = {
    // NOME DESCRITIVO              { type: 'TIPO_PADRÃO', src: 'NomeDoArquivoReal.png' },

    'Garrafa de Plástico': { type: 'plastic', src: 'GarrafaPlastico.png' },
    'Lata de Refrigerante': { type: 'metal', src: 'LataMetal.png' },
    'Bola de Papel': { type: 'paper', src: 'BolaPapel.png' },
    'Pote de Vidro': { type: 'glass', src: 'PoteVidro.png' },
    'Casca de Banana': { type: 'organic', src: 'CascaBanana.png' },

    // ... adicione mais lixos aqui, mantendo o 'type' em inglês
    // NOTA: Seus lixos de Oceano são OBSTÁCULOS e não colecionáveis, 
    // então o LIXO_MAPPING fica inalterado.
};

let lixosRestantes = 0;
let lixoSendoArrastado = null; // Elemento do lixo sendo arrastado


// =========================================================
// CONFIGURAÇÕES DE TRANSIÇÃO DINÂMICA
// =========================================================

// Mapeamento da fase POLUÍDA (atual) para a fase LIMPA (próxima)
const FASES_TRANSICAO = {
    'urbano-poluido': 'urbano-limpo',
    'florestal-poluido': 'florestal-limpo',
    'oceano-poluido': 'oceano-limpo',
};

// Mapeamento da fase LIMPA para o URL do PRÓXIMO JOGO REAL
const PROXIMAS_URLS_REAIS = {
    'urbano-limpo': '../telas/jogo-florestal.html',
    'florestal-limpo': '../telas/jogo-oceano.html',
    'oceano-limpo': '../telas/final.html' // URL de destino final
};

// Mapeamento da fase LIMPA para a Mensagem Educativa (para o cenario.js)
const MENSAGENS_TRANSICAO = {
    'urbano-limpo': 'A cidade respira ar puro! Agora, o foco é a recuperação da nossa floresta. Continue o bom trabalho! 🌆',
    'florestal-limpo': 'As árvores agradecem! O ecossistema florestal foi restaurado. Prepare-se para limpar o oceano! 🌳',
    'oceano-limpo': 'Incrível! O oceano está limpo! Você salvou a vida marinha. 🌊',
};


// =========================================================
// CONFIGURAÇÃO DE ÁUDIO
// =========================================================
// Os caminhos são relativos ao js/inventario.js para public/assets/sons

/**
 * Toca o som de classificação correta (LIXO CORRETO).
 */
function playLixoCorretoSound() {
    const audio = new Audio('../public/assets/sons/lixo-correto.mp3');
    audio.currentTime = 0;
    audio.play().catch(e => console.warn("Falha ao tocar som de acerto:", e.message));
}

/**
 * Toca o som de classificação incorreta (LIXO ERRO).
 */
function playLixoErroSound() {
    const audio = new Audio('../public/assets/sons/lixo-erro.mp3');
    audio.currentTime = 0;
    audio.play().catch(e => console.warn("Falha ao tocar som de erro:", e.message));
}


// =========================================================
// FUNÇÃO PARA BACKGROUND DINÂMICO
// =========================================================

/**
 * Define o background da tela de classificação com base na fase salva no Local Storage.
 * Usa a chave 'faseParaClassificacao' salva nos arquivos de jogo.
 */
function setClassificationBackground() {

    // 1. Tenta buscar o tema da fase salva (ex: 'florestal-poluido' ou 'oceano-poluido')
    const faseParaBackground = localStorage.getItem('faseParaClassificacao');

    if (faseParaBackground && backgroundElement) {
        // 2. Constrói o nome da classe CSS (ex: 'oceano-poluido' -> 'bg-oceano-poluido')
        const backgroundClass = 'bg-' + faseParaBackground;

        // 3. Aplica a classe CSS no elemento
        backgroundElement.classList.add(backgroundClass);

        console.log(`[Inventário.js] Background da Classificação definido: ${backgroundClass}`);

    } else if (backgroundElement) {
        // Fallback para o primeiro cenário se a chave não for encontrada
        backgroundElement.classList.add('bg-urbano-poluido');
        console.warn("[Inventário.js] Fase não encontrada. Usando background padrão: bg-urbano-poluido.");
    }
}


// =========================================================
// FUNÇÕES DE UTILIDADE E MENSAGEM
// =========================================================

/**
 * Embaralha um array in-place (Algoritmo Fisher-Yates).
 * @param {Array} array - O array a ser embaralhado.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


/**
 * Exibe a mensagem educativa e depois a esconde.
 * @param {string} message Mensagem a ser exibida.
 * @param {boolean} isCorrect Se for true, usa um som/estilo de acerto.
 */
function showEducationalMessage(message, isCorrect = false) {

    if (isCorrect) {
        playLixoCorretoSound();
    } else {
        playLixoErroSound();
    }

    // Altera a cor da caixa com base no acerto/erro
    msgArea.style.background = isCorrect
        ? 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)' // Verde/Ciano
        : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'; // Vermelho

    msgArea.innerHTML = `<p>${message}</p>`;
    msgArea.classList.remove('hidden');

    // Esconde a mensagem após 3 segundos
    setTimeout(() => {
        msgArea.classList.add('hidden');
    }, 3000);
}

// =========================================================
// LÓGICA DE INVENTÁRIO E INJEÇÃO DE HTML
// =========================================================

/**
 * Mapeia os contadores da Fase 1 em objetos de lixo específico para injeção.
 * @param {Object} counts - Contagem de lixo por tipo (ex: {plastic: 5, metal: 3})
 * @returns {Array} Lista de lixos individuais (ex: ['Garrafa de Plástico', 'Lata de Refrigerante', ...])
 */
function mapCountsToLixoObjects(counts) {
    const lixosList = [];
    const availableLixos = Object.keys(LIXO_MAPPING);

    // Esta lógica ainda agrupa os lixos, mas não tem problema, pois serão embaralhados depois.
    for (const type of LIXEIRA_TYPES) {
        let count = counts[type] || 0;

        const specificLixosOfType = availableLixos.filter(lixoName =>
            LIXO_MAPPING[lixoName].type === type
        );

        let lixoIndex = 0;
        while (count > 0 && specificLixosOfType.length > 0) {
            const lixoName = specificLixosOfType[lixoIndex % specificLixosOfType.length];
            lixosList.push(lixoName);
            lixoIndex++;
            count--;
        }
    }
    return lixosList;
}

/**
 * Carrega os lixos coletados da fase anterior e os injeta no inventário.
 */
function loadInventoryAndSetupClassification() {
    const collectedDataRaw = localStorage.getItem('collectedTrashCounts');

    if (!collectedDataRaw) {
        showEducationalMessage("Erro: Nenhum lixo coletado encontrado. Por favor, jogue a fase anterior.", false);
        return;
    }

    const collectedData = JSON.parse(collectedDataRaw);
    let lixosToInject = mapCountsToLixoObjects(collectedData);
    
    // ⭐ AJUSTE: Embaralha a lista para que os lixos não fiquem agrupados por tipo.
    shuffleArray(lixosToInject);

    lixosInventario.innerHTML = '';
    lixosRestantes = lixosToInject.length;

    // A. Cria os elementos de lixo com base na lista generada
    lixosToInject.forEach(lixoName => {
        const lixoData = LIXO_MAPPING[lixoName];
        if (!lixoData) return;

        const lixoEl = document.createElement('img');
        lixoEl.className = 'draggable-trash';

        lixoEl.src = `../public/assets/imagens/lixos/${lixoData.src}`;

        lixoEl.alt = `Lixo: ${lixoName}`;
        lixoEl.setAttribute('data-lixo-name', lixoName);
        lixoEl.setAttribute('data-type', lixoData.type);
        lixoEl.setAttribute('draggable', 'true');

        lixosInventario.appendChild(lixoEl);
    });

    // B. Finalização e configuração
    if (lixosRestantes === 0) {
        finishButton.classList.remove('hidden');
        showEducationalMessage("Não há lixos para classificar! Fase concluída. Redirecionando para a cena limpa...", true);

        // Chama a lógica de transição para o próximo cenário/URL
        setTimeout(finishClassification, TEMPO_PARA_TRANSICAO);
    }

    // C. Inicia a lógica de Drag and Drop
    setupDragAndDrop();
}

// =========================================================
// LÓGICA DE DRAG AND DROP (CLASSIFICAÇÃO)
// =========================================================

/**
 * Configura todos os ouvintes de evento de Drag and Drop.
 */
function setupDragAndDrop() {

    // --- LIXOS ARRASTÁVEIS ---
    document.querySelectorAll('.draggable-trash').forEach(lixo => {
        lixo.addEventListener('dragstart', (e) => {
            lixoSendoArrastado = e.target;
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', e.target.getAttribute('data-type'));
        });

        lixo.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
            lixoSendoArrastado = null;
        });
    });

    // --- LIXEIRAS ALVO ---
    document.querySelectorAll('.lixeira-target').forEach(lixeira => {
        const lixeiraType = lixeira.getAttribute('data-type');

        // 1. Drag Over
        lixeira.addEventListener('dragover', (e) => {
            e.preventDefault();
            lixeira.classList.add('drag-over');
        });

        // 2. Drag Leave
        lixeira.addEventListener('dragleave', (e) => {
            lixeira.classList.remove('drag-over');
        });

        // 3. Drop (A Lógica de Classificação)
        lixeira.addEventListener('drop', (e) => {
            e.preventDefault();
            lixeira.classList.remove('drag-over');

            if (lixoSendoArrastado) {
                const lixoTypeCorreto = lixoSendoArrastado.getAttribute('data-type');
                const lixoName = lixoSendoArrastado.getAttribute('data-lixo-name');
                
                // Mapeia os tipos em inglês para português para exibição
                const nomeLixeiraPT = LIXEIRA_TRADUCAO[lixeiraType] || lixeiraType;
                const nomeTipoCorretoPT = LIXEIRA_TRADUCAO[lixoTypeCorreto] || lixoTypeCorreto;


                // --- VERIFICAÇÃO DE CLASSIFICAÇÃO ---
                if (lixoTypeCorreto === lixeiraType) {
                    // Certo
                    lixoSendoArrastado.remove();
                    lixosRestantes--;

                    // Usa a tradução em português
                    showEducationalMessage(`Acerto! O item '${lixoName}' foi corretamente para a lixeira de ${nomeLixeiraPT}.`, true);

                    if (lixosRestantes === 0) {
                        finishButton.classList.remove('hidden');
                        showEducationalMessage("Parabéns! Classificação completa. Redirecionando para a cena limpa...", true);

                        // NOVO: Chama a lógica de transição após o tempo
                        setTimeout(finishClassification, TEMPO_PARA_TRANSICAO);
                    }
                } else {
                    // Errado
                    // Usa a tradução em português
                    const mensagem = `Erro! O item '${lixoName}' é do tipo ${nomeTipoCorretoPT} e deve ir para a lixeira de ${nomeTipoCorretoPT}. Tente novamente.`;
                    showEducationalMessage(mensagem, false);
                }
            }
        });
    });
}

// =========================================================
// LÓGICA DE REDIRECIONAMENTO PARA O CENÁRIO LIMPO
// =========================================================
/**
 * Calcula a próxima fase, salva as chaves de transição e redireciona para a tela de transição.
 */
function finishClassification() {

    // 1. LÊ A CHAVE SALVA NA FASE ANTERIOR (ex: 'florestal-poluido')
    const faseAtualPoluida = localStorage.getItem('faseAtualPoluida');

    // 2. CALCULA OS DADOS DE DESTINO
    // Usamos um fallback robusto aqui
    const proximaFaseLimpa = FASES_TRANSICAO[faseAtualPoluida];
    const proximaPaginaReal = PROXIMAS_URLS_REAIS[proximaFaseLimpa];
    const mensagemExibir = MENSAGENS_TRANSICAO[proximaFaseLimpa];

    if (!proximaPaginaReal) {
        console.error(`ERRO: Fase de transição '${faseAtualPoluida}' ou destino não configurado corretamente. Redirecionamento para o menu.`);
        // Redirecionamento seguro em caso de falha
        window.location.href = '../telas/menu.html';
        return;
    }

    // 3. SALVA OS DADOS PARA O cenario.js LER
    // Salva a chave completa para o CSS (ex: 'cenario-oceano-limpo')
    localStorage.setItem('proximaFaseCenario', `cenario-${proximaFaseLimpa}`);
    localStorage.setItem('proximaFaseURL', proximaPaginaReal);
    localStorage.setItem('mensagemEducativa', mensagemExibir);

    // 4. ATUALIZA O BOTÃO (se estiver visível)
    if (finishButton) {
        finishButton.textContent = 'Iniciando Transição...';
        finishButton.disabled = true;
    }

    // 5. Redireciona para a tela de transição
    // Assume que a tela de transição está em 'fase-concluida.html'
    window.location.href = 'fase-concluida.html';
}


// =========================================================
// INÍCIO DO MÓDULO E EVENTOS
// =========================================================

// Inicia o carregamento do inventário E o background
document.addEventListener('DOMContentLoaded', () => {
    // 1. Define o Background
    setClassificationBackground();

    // 2. Carrega o Inventário e configura o Drag and Drop
    loadInventoryAndSetupClassification();
});

// Evento do botão de finalização (Se o botão for clicável)
if (finishButton) {
    // Se você não quiser o redirecionamento automático, descomente este listener e comente os setTimeouts
    // finishButton.addEventListener('click', finishClassification);
}