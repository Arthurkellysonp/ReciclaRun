// js/cenario.js (VERSÃO AJUSTADA PARA O NOME DOS SEUS ARQUIVOS)

// =========================================================
// CONFIGURAÇÃO DA TRANSIÇÃO
// =========================================================
const TEMPO_TRANSICAO_MS = 6000; // 6 segundos de animação
const FALLBACK_MENSAGEM = "Parabéns! O lixo foi coletado. O ambiente foi restaurado. 🌍";
const FALLBACK_PROXIMA_PAGINA = '../telas/menu.html'; // Fallback seguro
const FALLBACK_CENARIO_CLASSE = 'cenario-urbano-limpo'; 

// 🎯 AJUSTE CRUCIAL: Mapeamento para carregar o CSS do cenário LIMPO
// Agora usando 'florestal-arborizado.css'
const CSS_MAP = {
    // Chave do localStorage:           Nome do arquivo CSS real:
    'cenario-urbano-limpo':     '../css/urbano-limpo.css',
    'cenario-florestal-limpo':  '../css/florestal-arborizado.css', // 🎯 CORREÇÃO AQUI
    'cenario-oceano-limpo':   '../css/oceano-limpo.css' 
};


// =========================================================
// FUNÇÕES DE UTILIDADE (loadCenarioCss - Mantida)
// =========================================================
/**
 * Carrega dinamicamente o arquivo CSS do cenário limpo.
 * @param {string} className - A classe do cenário limpo (ex: 'cenario-florestal-limpo').
 */
function loadCenarioCss(className) {
    const cssPath = CSS_MAP[className];
    if (cssPath) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;
        document.head.appendChild(link);
    } else {
        console.warn(`Caminho CSS não encontrado para a classe: ${className}.`);
    }
}


// =========================================================
// FUNÇÃO PRINCIPAL (initTransicaoCenario - Mantida)
// =========================================================
const body = document.body;
const carregandoBarra = document.getElementById('carregando-barra'); 


function initTransicaoCenario() {
    
    // 1. LÊ AS CONFIGURAÇÕES SALVAS PELO inventario.js
    const proximaClasse = localStorage.getItem('proximaFaseCenario') || FALLBACK_CENARIO_CLASSE; 
    const proximaPagina = localStorage.getItem('proximaFaseURL') || FALLBACK_PROXIMA_PAGINA;
    const mensagemExibir = localStorage.getItem('mensagemEducativa') || FALLBACK_MENSAGEM;
    
    // 2. Aplicar o CSS do Cenário Limpo (O loadCenarioCss agora usa o nome correto)
    loadCenarioCss(proximaClasse);
    body.classList.add(proximaClasse); 
    
    // 3. Exibir a Mensagem Educativa (Verifica se a classe existe)
    if (typeof MensagemEducativa !== 'undefined') {
        const mensagem = new MensagemEducativa(mensagemExibir, body, TEMPO_TRANSICAO_MS - 1000);
        mensagem.show();
    } else {
        console.error("ERRO: Classe MensagemEducativa não encontrada.");
    }

    // 4. Animar a barra de carregamento
    if (carregandoBarra) {
        carregandoBarra.style.width = '0%'; 
        carregandoBarra.style.transition = `width ${TEMPO_TRANSICAO_MS / 1000}s linear`;
        
        setTimeout(() => {
            carregandoBarra.style.width = '100%';
        }, 100);
    }
    
    // 5. Iniciar o Timer de Redirecionamento
    setTimeout(() => {
        localStorage.removeItem('proximaFaseCenario');
        localStorage.removeItem('proximaFaseURL');
        localStorage.removeItem('mensagemEducativa'); 
        
        window.location.href = proximaPagina;
    }, TEMPO_TRANSICAO_MS);
}


// --- INÍCIO ---
document.addEventListener('DOMContentLoaded', initTransicaoCenario);